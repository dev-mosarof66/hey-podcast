import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** A one-time promo code that grants a free trial when redeemed. */
@Entity({ name: 'promo_codes' })
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'int', default: 7 })
  trialDays: number;

  @Column({ type: 'boolean', default: false })
  redeemed: boolean;

  /** Admin-disabled codes can never be redeemed, even if unused. */
  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  redeemedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
