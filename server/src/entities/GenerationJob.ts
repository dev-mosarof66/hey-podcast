import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Episode } from './Episode';

export const JOB_STATUS = ['queued', 'running', 'done', 'failed'] as const;
export type JobStatus = (typeof JOB_STATUS)[number];

export const JOB_TRIGGER = ['cron', 'on_demand'] as const;
export type JobTrigger = (typeof JOB_TRIGGER)[number];

@Entity({ name: 'generation_jobs' })
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  episodeId: string;

  @ManyToOne(() => Episode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episodeId' })
  episode: Episode;

  // Topic this job is for (digest's primary topic, the global topic, or a
  // prompt-matched topic). The worker applies it to the episode when it's ready.
  @Column({ type: 'uuid', nullable: true })
  topicId: string | null;

  @Column({ type: 'enum', enum: JOB_TRIGGER })
  trigger: JobTrigger;

  @Column({ type: 'enum', enum: JOB_STATUS, default: 'queued' })
  status: JobStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;
}
