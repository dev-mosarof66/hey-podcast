import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Episode } from './Episode';
import { User } from './User';

@Entity({ name: 'episode_progress' })
@Unique('uq_episode_progress', ['userId', 'episodeId'])
export class EpisodeProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  episodeId: string;

  @ManyToOne(() => Episode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episodeId' })
  episode: Episode;

  @Column({ type: 'int', default: 0 })
  positionSec: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
