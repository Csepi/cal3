import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgentProfile } from './agent-profile.entity';

@Entity('agent_api_keys')
@Index(['agentId', 'isActive'])
export class AgentApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  agentId: number;

  @ManyToOne(() => AgentProfile, (agent) => agent.apiKeys, {
    onDelete: 'CASCADE',
  })
  agent: AgentProfile;

  @Column({ unique: true, length: 36 })
  tokenId: string;

  @Column({ length: 80 })
  name: string;

  @Column({ length: 255 })
  hashedKey: string;

  @Column({ length: 4 })
  lastFour: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
