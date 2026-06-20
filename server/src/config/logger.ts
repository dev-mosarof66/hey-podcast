import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.logLevel,
  // Pretty, colourised output in dev; raw JSON (for log aggregators) in prod.
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});
