import { JSONMovieStorageError } from './json-movie-storage.error';

export class InvalidFileContentsError extends JSONMovieStorageError {
  override name = InvalidFileContentsError.name;
  constructor(public readonly path: string, public readonly parseError: Error) {
    super(`File "${path}" content is not a valid JSON! Reason: ${parseError.message}`);
  }
}