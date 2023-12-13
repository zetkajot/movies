import express, { Router } from 'express';
import { ErrorHandler } from './error-mapper/error-handler';
import { MovieServiceError } from './service/errors';
import { MovieServiceErrorMapper } from './error-mapper/movie-service-error-mapper';
import { JSONMovieStorage } from './storage/json-movie-storage/json-movie-storage';
import { MovieService } from './service/movie.service';
import { ApiController } from './controller/api/api-controller';
import { ZodError } from 'zod';
import { ZodErrorMapper } from './error-mapper/zod-error-mapper';
import { ConfigProvider } from './config/config-provider';

const onShutdownTriggers: (() => unknown)[] = [];

['SIGTERM', 'SIGQUIT', 'SIGINT', 'beforeExit'].forEach((ev) => {
  process.on(ev, async () => {
    console.log('App shutting down...');
    for (const trigger of onShutdownTriggers) {
      await trigger();
    }
  });
});

async function main() {
  const host = ConfigProvider.CONFIG.APP_HOST;
  const port = ConfigProvider.CONFIG.APP_PORT;

  const appRouter = Router();
  const app = express();

  const storage = await new JSONMovieStorage().load(
    ConfigProvider.CONFIG.DB_FILE_PATH
  );
  onShutdownTriggers.push(storage.onShutdown.bind(storage));
  const movieSvc = new MovieService(storage);

  const appErrrorHandler = new ErrorHandler()
    .registerMapper(MovieServiceError, new MovieServiceErrorMapper())
    .registerMapper(ZodError, new ZodErrorMapper());

  app
    .use(express.json())
    .use(appRouter)
    .use(appErrrorHandler.getErrorHandler());

  new ApiController(appRouter, movieSvc);

  const server = app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });

  onShutdownTriggers.push(() =>
    server.close()
  );
}

main();
