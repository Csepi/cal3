import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export type ConfigurationValueType =
  | 'string'
  | 'boolean'
  | 'enum'
  | 'secret'
  | 'json';

@Entity({ name: 'configuration_settings' })
@Unique(['key'])
export class ConfigurationSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  label?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 60, default: 'string' })
  valueType: ConfigurationValueType;

  @Column({ type: 'varchar', length: 80, default: 'general' })
  category: string;

  @Column({ type: 'boolean', default: false })
  isSensitive: boolean;

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

  @Column({ type: 'boolean', default: false })
  isReadOnly: boolean;

  @Column({ type: 'simple-json', nullable: true })
  options?: string[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
