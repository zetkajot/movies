import { JSONMovieStorage } from '../storage/json-movie-storage/json-movie-storage';
import { MovieRecord } from '../storage/json-movie-storage/movie-record';
import { GetByInputVariants } from '../storage/types/inputs';
import { UnknownGenresError } from './errors';
import { GetMoviesOptions } from './types/get-movies-options';

export class MovieService {
  // assuming genres do not change during app runtime
  private genresCache: string[] | undefined;
  constructor(private readonly movieStorage: JSONMovieStorage) {}

  public async getMovies(opts: GetMoviesOptions = {}) {
    let results: MovieRecord[];
    if (
      Array.isArray(opts.genres) &&
      opts.genres.length >= 1 &&
      typeof opts.runtime === 'number'
    ) {
      await this.checkGenres(opts.genres);
      results = await this.movieStorage.getByComposed({
        [GetByInputVariants.ANY_OF]: { genres: opts.genres },
        [GetByInputVariants.RANGE]: {
          runtime: [opts.runtime - 10, opts.runtime + 10],
        },
      });
    } else if (Array.isArray(opts.genres) && opts.genres.length >= 1) {
      await this.checkGenres(opts.genres);
      results = await this.movieStorage.getByAnyOf({ genres: opts.genres });
    } else if (typeof opts.runtime === 'number') {
      results = await this.movieStorage.getByRange({
        runtime: [opts.runtime - 10, opts.runtime + 10],
      });
    } else {
      results = [(await this.movieStorage.getAll())[0]];
    }

    return results;
  }

  private async checkGenres(input: string[]): Promise<void> {
    if (!this.genresCache) {
      this.genresCache = await this.movieStorage.getGenres();
    }
    if (input.some(genre => !this.genresCache!.includes(genre))) {
      throw new UnknownGenresError(input, this.genresCache);
    }
  }
}
