import { getMetadataArgsStorage } from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

describe('AutomationRule entity mapping', () => {
  it('maps approvedBy relation to approvedByUserId column', () => {
    const joinColumn = getMetadataArgsStorage().joinColumns.find(
      (entry) =>
        entry.target === AutomationRule && entry.propertyName === 'approvedBy',
    );

    expect(joinColumn?.name).toBe('approvedByUserId');
  });

  it('maps createdBy relation to createdById column', () => {
    const joinColumn = getMetadataArgsStorage().joinColumns.find(
      (entry) =>
        entry.target === AutomationRule && entry.propertyName === 'createdBy',
    );

    expect(joinColumn?.name).toBe('createdById');
  });
});
