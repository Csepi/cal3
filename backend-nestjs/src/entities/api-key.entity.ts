import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { enumType, timestampTzType } from './column-types';
import { User } from './user.entity';

export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export enum ApiKeyTier {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
}

@Entity('api_keys')
@Index(['prefix'], { unique: true })
@Index(['userId', 'isActive'])
export class ApiKey {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 18 })
  prefix!: string;

  @Column({ length: 128 })
  keyHash!: string;

  @Column({ length: 8 })
  lastFour!: string;

  @Column({
    type: 'simple-json',
    default: '["read"]',
  })
  scopes!: ApiKeyScope[];

  @Column({
    type: enumType,
    enum: ApiKeyTier,
    default: ApiKeyTier.USER,
  })
  tier!: ApiKeyTier;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: timestampTzType, nullable: true })
  expiresAt?: Date | null;

  @Column({ type: timestampTzType, nullable: true })
  rotateAfter?: Date | null;

  @Column({ type: timestampTzType, nullable: true })
  lastUsedAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  usageCount!: number;

  @Column({ type: timestampTzType, nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
