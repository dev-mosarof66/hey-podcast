import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Sales pipeline stages for a B2B client/prospect.
export const CLIENT_STATUS = ['prospect', 'contacted', 'trial', 'active', 'churned'] as const;
export type ClientStatus = (typeof CLIENT_STATUS)[number];

/** A B2B account — a publisher, brand, or company in the sales pipeline. */
@Entity({ name: 'clients' })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'enum', enum: CLIENT_STATUS, default: 'prospect' })
  status: ClientStatus;

  /** Monthly contract value in whole currency units (e.g. USD). */
  @Column({ type: 'int', default: 0 })
  monthlyPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
