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

/** An Expo push token for one of a user's devices. */
@Entity({ name: 'push_tokens' })
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Expo push tokens are globally unique per install; one row per device.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
