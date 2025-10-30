import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { AgentProfile } from './agent-profile.entity';

@Entity('agent_permissions')
@Unique(['agentId', 'actionKey'])
export class AgentPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  agentId: number;

  @ManyToOne(() => AgentProfile, (agent) => agent.permissions, {
    onDelete: 'CASCADE',
  })
  agent: AgentProfile;

  @Column({ length: 120 })
  actionKey: string;

  @Column({ type: 'simple-json', nullable: true })
  scope?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
