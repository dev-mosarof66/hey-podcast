import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './config/env';
import { User } from './entities/User';
import { Topic } from './entities/Topic';
import { TopicFollow } from './entities/TopicFollow';
import { Episode } from './entities/Episode';
import { EpisodeProgress } from './entities/EpisodeProgress';
import { SavedEpisode } from './entities/SavedEpisode';
import { GenerationJob } from './entities/GenerationJob';
import { Subscription } from './entities/Subscription';
import { PushToken } from './entities/PushToken';
import { Notification } from './entities/Notification';
import { PromoCode } from './entities/PromoCode';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  // NeonDB requires SSL.
  ssl: { rejectUnauthorized: false },
  synchronize: env.dbSynchronize,
  logging: env.dbLogging,
  entities: [
    User,
    Topic,
    TopicFollow,
    Episode,
    EpisodeProgress,
    SavedEpisode,
    GenerationJob,
    Subscription,
    PushToken,
    Notification,
    PromoCode,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
