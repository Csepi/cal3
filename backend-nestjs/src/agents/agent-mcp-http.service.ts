import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { ZodRawShape } from 'zod';
import {
  AgentActionKey,
  getAgentActionDefinition,
} from './agent-actions.registry';
import { AgentMcpService } from './agent-mcp.service';
import type { AgentContext } from './interfaces/agent-context.interface';
import type { ExecuteAgentActionDto } from './dto/agent.dto';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { ContentBlock } from '@modelcontextprotocol/sdk/types.js';
import {
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
type ToolHandler = (parameters: Record<string, unknown>) => Promise<unknown>;

interface McpSession {
  context: AgentContext;
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

@Injectable()
export class AgentMcpHttpService {
  private readonly logger = new Logger(AgentMcpHttpService.name);
  private readonly sessions = new Map<string, McpSession>();

  constructor(private readonly agentMcpService: AgentMcpService) {}

  async handleStreamRequest(
    context: AgentContext,
    req: Request,
    res: Response,
    body: unknown,
  ): Promise<void> {
    const incomingSessionId = req.get('mcp-session-id')?.trim();
    let sessionId = incomingSessionId;
    let session: McpSession | undefined = undefined;

    try {
      this.logger.verbose?.(
        `[${context.agent.id}] -> ${req.method} ${req.originalUrl} (session=${
          sessionId ?? 'new'
        })`,
      );

      if (body !== undefined) {
        this.logger.debug(
          `[${context.agent.id}] Request body: ${this.safeStringify(body)}`,
        );
      }

      if (!sessionId) {
        sessionId = randomUUID();
        session = await this.createSession(sessionId, context);
      } else {
        session = this.sessions.get(sessionId);
        if (!session) {
          this.logger.warn(
            `MCP session ${sessionId} not found. Creating new session for agent ${context.agent.id}.`,
          );
          session = await this.createSession(sessionId, context);
        } else if (session.context.agent.id !== context.agent.id) {
          this.logger.warn(
            `MCP session ${sessionId} belongs to agent ${session.context.agent.id}, but agent ${context.agent.id} attempted access. Regenerating session.`,
          );
          session = await this.createSession(sessionId, context);
        }
      }

      if (!session || !sessionId) {
        throw new Error('Failed to establish MCP session');
      }

      this.logger.debug(
        `[${context.agent.id}] Using session ${sessionId}. Active sessions=${this.sessions.size}`,
      );

      const enhancedRequest = req as Request & { auth?: AuthInfo };

      res.on('close', () => {
        this.logger.debug(
          `[${context.agent.id}] Response closed for session ${sessionId} (${req.method})`,
        );
        if (req.method === 'DELETE') {
          this.cleanupSession(sessionId as string);
        }
      });

      await session.transport.handleRequest(enhancedRequest, res, body);

      if (req.method === 'DELETE') {
        this.cleanupSession(sessionId);
      } else {
        this.logger.debug(
          `[${context.agent.id}] Completed ${req.method} for session ${sessionId}`,
        );
      }
    } catch (error) {
      logError(error, buildErrorContext({ action: 'agent-mcp-http.service' }));
      this.logger.error(
        `MCP stream handling error for agent ${context.agent.id}: ${
          error instanceof Error ? error.message : error
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Internal server error' },
          id: null,
        });
      }
    } finally {
      this.logger.verbose?.(
        `[${context.agent.id}] <- ${req.method} (session=${sessionId ?? 'n/a'})`,
      );
    }
  }

  private createServer(context: AgentContext): McpServer {
    const server = new McpServer({
      name: 'primecal-mcp',
      version: '1.0.0',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    });

    const registerTool = (
      action: AgentActionKey,
      inputSchema: ZodRawShape | undefined,
      handler: ToolHandler,
    ) => {
      if (!this.hasPermission(context, action)) {
        return;
      }

      const definition = getAgentActionDefinition(action);
      const config: {
        title?: string;
        description?: string;
        inputSchema?: ZodRawShape;
      } = {
        title: definition?.label ?? action,
        description: definition?.description ?? `Execute ${action}`,
      };

      if (inputSchema) {
        config.inputSchema = inputSchema;
      }

      const toolName = this.createToolName(action);

      server.registerTool(toolName, config, async (parameters, extraInfo) => {
        try {
          const result = await handler(parameters);
          return this.wrapToolResult(result);
        } catch (error) {
          logError(
            error,
            buildErrorContext({ action: 'agent-mcp-http.service' }),
          );
          this.logger.warn(
            `Tool execution failed for ${action}: ${
              error instanceof Error ? error.message : error
            }`,
          );
          return {
            isError: true,
            content: [
              this.toTextContent(
                error instanceof Error ? error.message : String(error),
              ),
            ],
          };
        } finally {
          // Silence unused parameter warning
          void extraInfo;
        }
      });
    };

    registerTool(AgentActionKey.USER_PROFILE_READ, undefined, (params) =>
      this.execute(context, AgentActionKey.USER_PROFILE_READ, params),
    );

    const calendarListSchema: ZodRawShape = {
      calendarIds: z.array(z.number().int().positive()).optional(),
    };

    registerTool(AgentActionKey.CALENDAR_LIST, calendarListSchema, (params) =>
      this.execute(context, AgentActionKey.CALENDAR_LIST, params),
    );

    const readEventsSchema: ZodRawShape = {
      calendarId: z.number().int().positive(),
      start: z.string().optional(),
      end: z.string().optional(),
    };

    registerTool(
      AgentActionKey.CALENDAR_EVENTS_READ,
      readEventsSchema,
      (params) =>
        this.execute(context, AgentActionKey.CALENDAR_EVENTS_READ, params),
    );

    const eventPayloadSchema = z
      .object({
        id: z.number().int().positive().optional(),
        calendarId: z.number().int().positive().optional(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        location: z.string().nullable().optional(),
        allDay: z.boolean().optional(),
        recurrenceType: z.string().nullable().optional(),
        recurrenceRule: z.string().nullable().optional(),
      })
      .passthrough();

    const createEventSchema: ZodRawShape = {
      calendarId: z.number().int().positive().optional(),
      event: eventPayloadSchema,
    };

    registerTool(
      AgentActionKey.CALENDAR_EVENTS_CREATE,
      createEventSchema,
      (params) =>
        this.execute(context, AgentActionKey.CALENDAR_EVENTS_CREATE, params),
    );

    const updateEventSchema: ZodRawShape = {
      eventId: z.number().int().positive().optional(),
      id: z.number().int().positive().optional(),
      event: eventPayloadSchema.optional(),
    };

    registerTool(
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      updateEventSchema,
      (params) =>
        this.execute(context, AgentActionKey.CALENDAR_EVENTS_UPDATE, params),
    );

    const deleteEventSchema: ZodRawShape = {
      eventId: z.number().int().positive().optional(),
      id: z.number().int().positive().optional(),
    };

    registerTool(
      AgentActionKey.CALENDAR_EVENTS_DELETE,
      deleteEventSchema,
      (params) =>
        this.execute(context, AgentActionKey.CALENDAR_EVENTS_DELETE, params),
    );

    const listAutomationRulesSchema: ZodRawShape = {
      ruleIds: z.array(z.number().int().positive()).optional(),
      isEnabled: z.boolean().optional(),
      limit: z.number().int().positive().max(100).optional(),
    };

    registerTool(
      AgentActionKey.AUTOMATION_RULES_LIST,
      listAutomationRulesSchema,
      (params) =>
        this.execute(context, AgentActionKey.AUTOMATION_RULES_LIST, params),
    );

    const triggerAutomationSchema: ZodRawShape = {
      ruleId: z.number().int().positive(),
    };

    registerTool(
      AgentActionKey.AUTOMATION_RULES_TRIGGER,
      triggerAutomationSchema,
      (params) =>
        this.execute(context, AgentActionKey.AUTOMATION_RULES_TRIGGER, params),
    );

    const taskStatusValues = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ] as const;
    const taskPriorityValues = [
      TaskPriority.HIGH,
      TaskPriority.MEDIUM,
      TaskPriority.LOW,
    ] as const;
    const taskSortColumns = ['updatedAt', 'createdAt', 'dueDate'] as const;
    const sortDirections = ['asc', 'desc'] as const;
    const positiveInt = () => z.number().int().positive();
    const hexColorSchema = z
      .string()
      .regex(/^#?[0-9a-fA-F]{6}$/, 'Color must be a valid 6-digit hex value.');

    const listTasksSchema: ZodRawShape = {
      status: z.enum(taskStatusValues).optional(),
      priority: z.enum(taskPriorityValues).optional(),
      search: z.string().max(120).optional(),
      dueFrom: z.string().optional(),
      dueTo: z.string().optional(),
      labelIds: z.array(positiveInt()).max(10).optional(),
      sortBy: z.enum(taskSortColumns).optional(),
      sortDirection: z.enum(sortDirections).optional(),
      page: positiveInt().optional(),
      limit: positiveInt().max(100).optional(),
    };

    registerTool(AgentActionKey.TASKS_LIST, listTasksSchema, (params) =>
      this.execute(context, AgentActionKey.TASKS_LIST, params),
    );

    const createTaskSchema: ZodRawShape = {
      title: z.string().min(1).max(240),
      body: z.union([z.string().max(8000), z.null()]).optional(),
      bodyFormat: z.enum(['markdown'] as const).optional(),
      color: hexColorSchema.optional(),
      priority: z.enum(taskPriorityValues).optional(),
      status: z.enum(taskStatusValues).optional(),
      place: z.union([z.string().max(255), z.null()]).optional(),
      dueDate: z.string().optional(),
      dueEnd: z.string().optional(),
      dueTimezone: z.union([z.string().max(100), z.null()]).optional(),
      assigneeId: positiveInt().nullable().optional(),
      labelIds: z.array(positiveInt()).max(12).optional(),
    };

    registerTool(AgentActionKey.TASKS_CREATE, createTaskSchema, (params) =>
      this.execute(context, AgentActionKey.TASKS_CREATE, params),
    );

    const updateTaskSchema: ZodRawShape = {
      taskId: positiveInt().optional(),
      id: positiveInt().optional(),
      title: z.string().min(1).max(240).optional(),
      body: z.union([z.string().max(8000), z.null()]).optional(),
      bodyFormat: z.enum(['markdown'] as const).optional(),
      color: hexColorSchema.nullable().optional(),
      priority: z.enum(taskPriorityValues).optional(),
      status: z.enum(taskStatusValues).optional(),
      place: z.union([z.string().max(255), z.null()]).optional(),
      dueDate: z.string().optional(),
      dueEnd: z.string().optional(),
      dueTimezone: z.union([z.string().max(100), z.null()]).optional(),
      assigneeId: positiveInt().nullable().optional(),
      labelIds: z.array(positiveInt()).max(12).optional(),
    };

    registerTool(AgentActionKey.TASKS_UPDATE, updateTaskSchema, (params) =>
      this.execute(context, AgentActionKey.TASKS_UPDATE, params),
    );

    const deleteTaskSchema: ZodRawShape = {
      taskId: positiveInt().optional(),
      id: positiveInt().optional(),
    };

    registerTool(AgentActionKey.TASKS_DELETE, deleteTaskSchema, (params) =>
      this.execute(context, AgentActionKey.TASKS_DELETE, params),
    );

    registerTool(AgentActionKey.TASK_LABELS_LIST, undefined, (params) =>
      this.execute(context, AgentActionKey.TASK_LABELS_LIST, params),
    );

    const createLabelSchema: ZodRawShape = {
      name: z.string().min(1).max(64),
      color: hexColorSchema.optional(),
    };

    registerTool(
      AgentActionKey.TASK_LABELS_CREATE,
      createLabelSchema,
      (params) =>
        this.execute(context, AgentActionKey.TASK_LABELS_CREATE, params),
    );

    const updateLabelSchema: ZodRawShape = {
      labelId: positiveInt().optional(),
      id: positiveInt().optional(),
      name: z.string().min(1).max(64).optional(),
      color: hexColorSchema.nullable().optional(),
    };

    registerTool(
      AgentActionKey.TASK_LABELS_UPDATE,
      updateLabelSchema,
      (params) =>
        this.execute(context, AgentActionKey.TASK_LABELS_UPDATE, params),
    );

    const deleteLabelSchema: ZodRawShape = {
      labelId: positiveInt().optional(),
      id: positiveInt().optional(),
    };

    registerTool(
      AgentActionKey.TASK_LABELS_DELETE,
      deleteLabelSchema,
      (params) =>
        this.execute(context, AgentActionKey.TASK_LABELS_DELETE, params),
    );

    server.server.registerCapabilities({
      resources: {
        listChanged: false,
      },
    });
    server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    server.server.registerCapabilities({
      prompts: {
        listChanged: false,
      },
    });
    server.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [],
    }));

    return server;
  }

  private async createSession(
    sessionId: string,
    context: AgentContext,
  ): Promise<McpSession> {
    this.logger.debug(
      `[${context.agent.id}] Creating MCP session ${sessionId}`,
    );

    const server = this.createServer(context);
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: false,
      sessionIdGenerator: () => sessionId,
    });

    await server.connect(transport).catch((error) => {
      this.logger.error(
        `[${context.agent.id}] Failed to connect MCP server for session ${sessionId}: ${
          error instanceof Error ? error.message : error
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    });

    const session: McpSession = {
      context,
      server,
      transport,
    };

    this.sessions.set(sessionId, session);
    this.logger.debug(
      `Created MCP session ${sessionId} for agent ${context.agent.id}. Active sessions=${this.sessions.size}`,
    );

    return session;
  }

  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.transport.close().catch((error) => {
      this.logger.warn(
        `Failed to close MCP transport for session ${sessionId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    });

    this.sessions.delete(sessionId);
    this.logger.debug(
      `Closed MCP session ${sessionId}. Active sessions=${this.sessions.size}`,
    );
  }

  private hasPermission(context: AgentContext, key: AgentActionKey): boolean {
    return (context.permissions ?? []).some(
      (permission) => permission.actionKey === key,
    );
  }

  private async execute(
    context: AgentContext,
    action: AgentActionKey,
    parameters: Record<string, unknown>,
  ): Promise<unknown> {
    const dto: ExecuteAgentActionDto = {
      action,
      parameters,
    };
    return this.agentMcpService.executeAction(context, dto);
  }

  private wrapToolResult(result: unknown): {
    content: ContentBlock[];
    structuredContent?: Record<string, unknown>;
  } {
    if (typeof result === 'string') {
      return {
        content: [this.toTextContent(result)],
      };
    }

    if (result === undefined || result === null) {
      return {
        content: [this.toTextContent('Success')],
      };
    }

    const text =
      typeof result === 'object'
        ? JSON.stringify(result, null, 2)
        : String(result);

    const structured =
      result && typeof result === 'object' && !Array.isArray(result)
        ? (result as Record<string, unknown>)
        : undefined;

    return {
      content: [this.toTextContent(text)],
      ...(structured ? { structuredContent: structured } : {}),
    };
  }

  private toTextContent(text: string): ContentBlock {
    return {
      type: 'text',
      text,
    } as ContentBlock;
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      logError(error, buildErrorContext({ action: 'agent-mcp-http.service' }));
      return `[unserializable:${error instanceof Error ? error.message : 'unknown'}]`;
    }
  }

  private createToolName(action: string): string {
    const normalized = action.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleaned = normalized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    if (!cleaned) {
      return 'tool';
    }
    return cleaned.slice(0, 64);
  }
}
