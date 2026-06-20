import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Episode } from './Episode';
import { User } from './User';

@Entity({ name: 'saved_episodes' })
@Unique('uq_saved_episode', ['userId', 'episodeId'])
export class SavedEpisode {
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

  @Column({ type: 'boolean', default: false })
  downloaded: boolean;

  @Column({ type: 'text', nullable: true })
  localUri: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  savedAt: Date;
}
