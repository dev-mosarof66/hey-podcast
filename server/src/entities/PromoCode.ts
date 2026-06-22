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

  /**
   * Codes are reusable: they keep working for every redemption until an admin
   * disables them. `disabled` is the only gate; `redemptionCount` tracks usage.
   */
  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  @Column({ type: 'int', default: 0 })
  redemptionCount: number;

  /** The most recent redeemer + time (for admin visibility). */
  @Column({ type: 'uuid', nullable: true })
  redeemedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
