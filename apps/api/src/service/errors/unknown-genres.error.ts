import { MovieServiceError } from './movie-service.error';

export class UnknownGenresError extends MovieServiceError {
  override name = UnknownGenresError.name;

  constructor(
    public readonly receivedGenres: string[],
    public readonly allowedGenres: string[]
  ) {
    super(
      `Received array of genres [${receivedGenres.map(v => `'${v}'`).join(', ')}] contains unknown genre. Allowed genres are [${allowedGenres.map(v => `'${v}'`).join(', ')}].`
    );
  }
}
