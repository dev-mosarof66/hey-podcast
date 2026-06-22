import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Singleton tracker for the rotating global-digest cron. Stores which topic to
 * start from on the next run (`cursor`) and the last day it ran (`lastRunOn`),
 * so the batch generates a small fixed number of topics per day and rotates
 * through the whole catalog over time.
 */
@Entity({ name: 'global_digest_state' })
export class GlobalDigestState {
  // Always a single row (id = 1).
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  /** Offset into the topic list (ordered by createdAt) for the next run. */
  @Column({ type: 'int', default: 0 })
  cursor: number;

  /** 'YYYY-MM-DD' (digest timezone) of the last run — the per-day guard. */
  @Column({ type: 'varchar', length: 10, nullable: true })
  lastRunOn: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
