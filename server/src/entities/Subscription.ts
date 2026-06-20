import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

export const SUB_TIER = ['free', 'premium'] as const;
export type SubscriptionTier = (typeof SUB_TIER)[number];

export const SUB_STATUS = ['active', 'trialing', 'past_due', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUB_STATUS)[number];

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: SUB_TIER, default: 'free' })
  tier: SubscriptionTier;

  @Column({ type: 'enum', enum: SUB_STATUS, default: 'active' })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  renewsAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
