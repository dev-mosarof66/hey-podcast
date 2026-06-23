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
import { Client } from './Client';

/**
 * A B2B "briefing" — a branded recurring audio show for a client. Each briefing
 * has its own prompt and a public podcast RSS feed (keyed by slug) that the
 * client can add to Spotify/Apple. Generated episodes link back via briefingId.
 */
@Entity({ name: 'briefings' })
export class Briefing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // What the engine researches each run (passed to the pipeline as the topic).
  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
