import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './automation-rule.dto';
import { TriggerType } from '../../entities/automation-rule.entity';
import { ActionType } from '../../entities/automation-action.entity';

const validateDto = <T extends object>(
  dtoClass: new () => T,
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(dtoClass, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
  });

const flattenErrorFields = (
  errors: ValidationError[],
  parentPath = '',
): string[] => {
  const fields: string[] = [];

  for (const error of errors) {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints && Object.keys(error.constraints).length > 0) {
      fields.push(currentPath);
    }

    if (error.children && error.children.length > 0) {
      fields.push(...flattenErrorFields(error.children, currentPath));
    }
  }

  return fields;
};

const buildCreatePayload = (
  triggerConfig: Record<string, unknown>,
): Record<string, unknown> => ({
  name: 'Relative trigger validation test',
  triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
  triggerConfig,
  actions: [
    {
      actionType: ActionType.UPDATE_EVENT_TITLE,
      actionConfig: { newTitle: 'Updated title' },
    },
  ],
});

describe('automation rule DTO relative trigger config validation', () => {
  it('accepts valid nested relative_time_to_event trigger configuration', () => {
    const errors = validateDto(
      CreateAutomationRuleDto,
      buildCreatePayload({
        configVersion: 1,
        referenceTime: { base: 'start' },
        offset: { direction: 'before', value: 5, unit: 'minutes' },
        eventFilter: { calendarIds: [1], tags: ['vacation'] },
        execution: { runOncePerEvent: true, schedulingWindowDays: 90 },
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid nested offset direction with field-level error', () => {
    const errors = validateDto(
      CreateAutomationRuleDto,
      buildCreatePayload({
        offset: { direction: 'sideways', value: 5, unit: 'minutes' },
      }),
    );

    expect(flattenErrorFields(errors)).toContain(
      'triggerConfig.offset.direction',
    );
  });

  it('rejects negative offset value with field-level error', () => {
    const errors = validateDto(
      CreateAutomationRuleDto,
      buildCreatePayload({
        offset: { direction: 'before', value: -1, unit: 'minutes' },
      }),
    );

    expect(flattenErrorFields(errors)).toContain('triggerConfig.offset.value');
  });

  it('rejects invalid calendar filter ids with field-level error', () => {
    const errors = validateDto(
      CreateAutomationRuleDto,
      buildCreatePayload({
        eventFilter: {
          calendarIds: [1, 'bad-id'],
        },
      }),
    );

    const fields = flattenErrorFields(errors);
    expect(
      fields.some((field) =>
        field.startsWith('triggerConfig.eventFilter.calendarIds'),
      ),
    ).toBe(true);
  });

  it('rejects unknown nested properties for relative trigger configs', () => {
    const errors = validateDto(
      CreateAutomationRuleDto,
      buildCreatePayload({
        offset: {
          direction: 'before',
          value: 5,
          unit: 'minutes',
          unexpected: 'boom',
        },
      }),
    );

    expect(flattenErrorFields(errors)).toContain(
      'triggerConfig.offset.unexpected',
    );
  });

  it('does not enforce relative nested schema for non-relative trigger configs', () => {
    const errors = validateDto(CreateAutomationRuleDto, {
      name: 'Starts in rule',
      triggerType: TriggerType.EVENT_STARTS_IN,
      triggerConfig: { minutes: 30 },
      actions: [
        {
          actionType: ActionType.UPDATE_EVENT_TITLE,
          actionConfig: { newTitle: 'Updated title' },
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('validates relative-shaped config on update DTO with field-level errors', () => {
    const errors = validateDto(UpdateAutomationRuleDto, {
      triggerConfig: {
        offset: { direction: 'before', value: 3, unit: 'decades' },
      },
    });

    expect(flattenErrorFields(errors)).toContain('triggerConfig.offset.unit');
  });

  it('allows non-relative update payloads that do not resemble relative shape', () => {
    const errors = validateDto(UpdateAutomationRuleDto, {
      triggerConfig: { minutes: 10 },
    });

    expect(errors).toHaveLength(0);
  });
});
