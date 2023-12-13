import { MovieServiceError } from './movie-service.error';

export class NoMovieDtoError extends MovieServiceError {
  override name = NoMovieDtoError.name;

  constructor(
  ) {
    super(`Movie DTO must be sent using request body!`);
  }
}