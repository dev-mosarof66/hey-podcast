import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  password: string | null;

  @Index({ unique: true, where: '"googleId" IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // Personalization
  @Column({ type: 'varchar', length: 20, nullable: true })
  ageRange: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  profession: string | null;

  // True once the user has finished the personalization flow. Until then the
  // app keeps routing them back to onboarding (strict — can't be skipped).
  @Column({ type: 'boolean', default: false })
  onboarded: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
