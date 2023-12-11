import { JSONMovieStorageError } from './json-movie-storage.error';

export class UnableToOpenFileError extends JSONMovieStorageError {
  override name = UnableToOpenFileError.name;
  constructor(
    public readonly path: string,
    public readonly fsErr: Error,
  ) {
    super(`Could not open file at path "${path}"! Reason: ${fsErr.message}`);
  }
}