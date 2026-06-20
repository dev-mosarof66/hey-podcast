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
import { Topic } from './Topic';
import { User } from './User';

export const EPISODE_STATUS = ['queued', 'generating', 'ready', 'failed'] as const;
export type EpisodeStatus = (typeof EPISODE_STATUS)[number];


@Entity({ name: 'episodes' })
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  prompt: string | null;

  @Column({ type: 'text', nullable: true })
  audioUrl: string | null;

  // The two-host dialogue used to synthesize the audio — shown as a transcript.
  @Column({ type: 'jsonb', nullable: true })
  transcript: { speaker: 'A' | 'B'; text: string }[] | null;

  // Generated first names for the two hosts (A = male voice, B = female voice).
  @Column({ type: 'jsonb', nullable: true })
  hosts: { A: string; B: string } | null;

  @Column({ type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ type: 'enum', enum: EPISODE_STATUS, default: 'queued' })
  status: EpisodeStatus;

  @Column({ type: 'boolean', default: false })
  isShared: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  topicId: string | null;

  @ManyToOne(() => Topic, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'topicId' })
  topic: Topic | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
