import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { enumType, timestampType } from './column-types';
import { User } from './user.entity';
import { AgentPermission } from './agent-permission.entity';
import { AgentApiKey } from './agent-api-key.entity';

export enum AgentStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('agent_profiles')
@Index(['userId', 'name'], { unique: true })
export class AgentProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.agentProfiles, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ length: 80 })
  name!: string;

  @Column('varchar', { length: 255, nullable: true })
  description?: string | null;

  @Column({ type: enumType, enum: AgentStatus, default: AgentStatus.ACTIVE })
  status!: AgentStatus;

  @Column({ type: timestampType, nullable: true })
  lastUsedAt?: Date | null;

  @OneToMany(() => AgentPermission, (permission) => permission.agent, {
    cascade: true,
  })
  permissions!: AgentPermission[];

  @OneToMany(() => AgentApiKey, (apiKey) => apiKey.agent, { cascade: true })
  apiKeys!: AgentApiKey[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
