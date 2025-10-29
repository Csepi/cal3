import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'app_log_settings' })
export class LogSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', default: 30 })
  retentionDays!: number;

  @Column({ type: 'boolean', default: true })
  autoCleanupEnabled!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
