import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'app_log_settings' })
export class LogSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', default: 30 })
  retentionDays!: number;

  @Column({ type: 'boolean', default: true })
  autoCleanupEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  realtimeCriticalAlertsEnabled!: boolean;

  @Column({ type: 'int', default: 25 })
  errorRateAlertThresholdPerMinute!: number;

  @Column({ type: 'int', default: 1500 })
  p95LatencyAlertThresholdMs!: number;

  @Column({ type: 'int', default: 72 })
  metricsRetentionHours!: number;

  @Column({ type: 'int', default: 2555 })
  auditRetentionDays!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
