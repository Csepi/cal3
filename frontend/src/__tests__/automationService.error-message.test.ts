import { createAutomationRule } from '../services/automationService';
import { TriggerType, ActionType } from '../types/Automation';
import { secureFetch } from '../services/authErrorHandler';

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

describe('automationService error messaging', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
  >;

  const buildErrorResponse = (payload: unknown): Response =>
    ({
      ok: false,
      status: 400,
      clone: () => ({
        json: async () => payload,
      }),
      text: async () => JSON.stringify(payload),
    }) as unknown as Response;

  const basePayload = {
    name: 'Relative trigger test',
    triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
    triggerConfig: {
      referenceTime: { base: 'start' as const },
      offset: { direction: 'before' as const, value: 5, unit: 'minutes' as const },
    },
    actions: [
      {
        actionType: ActionType.UPDATE_EVENT_TITLE,
        actionConfig: { newTitle: 'Updated title' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns field-level validation error from standardized nested API envelope', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      buildErrorResponse({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request is invalid. Please review your input.',
          details: {
            fields: [
              {
                field: 'triggerConfig.offset.direction',
                reasons: ['direction must be one of the following values: before, after'],
              },
            ],
          },
        },
      }),
    );

    await expect(createAutomationRule(basePayload)).rejects.toThrow(
      'triggerConfig.offset.direction: direction must be one of the following values: before, after',
    );
  });

  test('falls back to nested API error message when field-level details are absent', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      buildErrorResponse({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Unsafe URL detected in field "url".',
        },
      }),
    );

    await expect(createAutomationRule(basePayload)).rejects.toThrow(
      'Unsafe URL detected in field "url".',
    );
  });
});

