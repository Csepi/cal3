import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserConsentType =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'marketing_email'
  | 'data_processing'
  | 'cookie_analytics';

export type UserConsentDecision = 'accepted' | 'revoked';

@Entity({ name: 'user_consents' })
@Index('idx_user_consents_user_type_created', ['userId', 'consentType', 'createdAt'])
export class UserConsent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index('idx_user_consents_user_id')
  userId!: number;

  @Column({ type: 'varchar', length: 64 })
  @Index('idx_user_consents_type')
  consentType!: UserConsentType;

  @Column({ type: 'varchar', length: 64 })
  policyVersion!: string;

  @Column({ type: 'varchar', length: 16 })
  decision!: UserConsentDecision;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  source?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;
}
