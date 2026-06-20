import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import routes from './routes';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { AUDIO_DIR } from './engine/storage';

export function createApp() {
  const app = express();

  // helmet's cross-origin-resource-policy blocks the app from loading audio
  // from a different origin, so relax that one header for static media.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(express.json());

  // Structured request logging (logs every request + status/latency).
  app.use(pinoHttp({ logger }));

  // Generated episode audio (local-disk hosting for now).
  app.use('/audio', express.static(AUDIO_DIR));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
