import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { timestampTzType } from './column-types';
import { User } from './user.entity';

@Entity('auth_refresh_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['familyId'])
@Index(['userId', 'revoked'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ length: 64 })
  jti!: string;

  @Column({ length: 128 })
  tokenHash!: string;

  @Column({ type: 'uuid' })
  familyId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentTokenId?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  fingerprintHash?: string | null;

  @Column({ type: timestampTzType })
  expiresAt!: Date;

  @Column({ type: timestampTzType })
  familyExpiresAt!: Date;

  @Column({ default: false })
  revoked!: boolean;

  @Column({ type: timestampTzType, nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  revocationReason?: string | null;

  @Column({ type: 'uuid', nullable: true })
  replacedByTokenId?: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent?: string | null;

  @Column({ type: timestampTzType, nullable: true })
  consumedAt?: Date | null;

  @Column({ type: timestampTzType, nullable: true })
  lastUsedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
