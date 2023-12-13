import { FileHandle, constants, open } from 'fs/promises';
import {
  GetByAnyOfInput,
  GetByComposedInput,
  GetByExactInput,
  GetByInputVariants,
  GetByRangeInput,
} from '../types/inputs';
import { Storage } from '../types/storage';
import { MovieRecord, movieRecordSchema, rawMovieRecordSchema } from './movie-record';
import {
  JSONMovieStorageOptions,
  MovieRecordFlushBehavior,
  MovieRecordPostDeserializeTransformer,
  MovieRecordPreSerializeTransformer,
} from './types/json-movie-storage-options';
import { UnableToOpenFileError } from './errors/unable-to-open-file.error';
import { InvalidFileContentsError } from './errors';
import { binsearchNext, binsearchPrevious } from './utils';
import { OnShutdown } from '../../types/on-shutdown';

/**
 * Stores Movie records in memory backed up by JSON file
 */
export class JSONMovieStorage implements Storage<MovieRecord>, OnShutdown {
  private genres!: string[];
  private records!: MovieRecord[];
  private genresIndex!: Map<string, MovieRecord[]>;
  private runtimesIndex!: [number, MovieRecord][];
  private largestId!: number;
  private flushBehavior: MovieRecordFlushBehavior;

  public static readonly DEFAULT_PRE_SERIALIZE: MovieRecordPreSerializeTransformer =
    (records, { genres }) => ({
      genres,
      movies: rawMovieRecordSchema.array().parse(records),
    });
  public static readonly DEFAULT_POST_DESERIALIZE: MovieRecordPostDeserializeTransformer =
    (data, ctx) => {
      ctx.genres = data.genres;
      return movieRecordSchema.array().parse(data.movies);
    };

  private readonly preSerialize: MovieRecordPreSerializeTransformer;
  private readonly postDeserialize: MovieRecordPreSerializeTransformer;
  private fileHandle!: FileHandle;

  constructor(opts?: JSONMovieStorageOptions) {
    this.preSerialize =
      opts?.preSerialize ?? JSONMovieStorage.DEFAULT_PRE_SERIALIZE;
    this.postDeserialize =
      opts?.postDeserialize ?? JSONMovieStorage.DEFAULT_POST_DESERIALIZE;
    this.flushBehavior =
      opts?.flushBehavior ?? MovieRecordFlushBehavior.ON_SHUTDOWN;
  }
  public async onShutdown(): Promise<void> {
    console.log(`Shutting down JSONMovieStorage`);
    if (this.flushBehavior === MovieRecordFlushBehavior.ON_SHUTDOWN) {
      await this.flushData();
    }
    await this.fileHandle.close();
    console.log(`File handle to DB file closed.`);
  }
  public async save(input: MovieRecord): Promise<void> {
    if (this.flushBehavior === MovieRecordFlushBehavior.ON_SAVE) {
      await this.flushData();
    }
    this.records.push(input);
    for (const genre in input.genres) {
      this.genresIndex.get(genre)?.push(input);
    }

    const firstSmallestRuntimeIdx = binsearchPrevious(
      this.runtimesIndex,
      input.runtime
    );
    this.runtimesIndex.splice(firstSmallestRuntimeIdx + 1, 0, [
      input.runtime,
      input,
    ]);
  }

  private async flushData(): Promise<void> {
    const serialized = JSON.stringify(this.preSerialize(this.records, this));
    await this.fileHandle.truncate();
    await this.fileHandle.write(serialized, 0, 'utf-8');
  }

  public async load(jsonFilePath: string): Promise<this> {
    console.log(`Loading JSON movie data from ${jsonFilePath}`);
    try {
      this.fileHandle = await open(jsonFilePath, constants.O_RDWR);
    } catch (err) {
      throw new UnableToOpenFileError(jsonFilePath, err as Error);
    }
    let parsedData;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      parsedData = JSON.parse(
        await this.fileHandle.readFile({ encoding: 'utf-8' })
      );
    } catch (e) {
      throw new InvalidFileContentsError(jsonFilePath, e as Error);
    }
    this.genres = parsedData.genres;
    this.records = this.postDeserialize(parsedData, this);

    this.buildGenresIndex();
    this.buildRuntimeIndex();
    this.findLargestId();

    console.log('JSONMovieStorage ready!');

    return this;
  }

  private buildGenresIndex() {
    this.genresIndex = new Map(this.genres.map((genre) => [genre, []]));
    for (const record of this.records) {
      for (const genre of record.genres) {
        this.genresIndex.get(genre)!.push(record);
      }
    }
  }

  private buildRuntimeIndex() {
    this.runtimesIndex = this.records.map((record) => [record.runtime, record]);
    this.runtimesIndex.sort(([l], [r]) => l - r);
  }

  private findLargestId() {
    // copy this.records using spread op to avoid mutation
    this.largestId = [...this.records].sort(({id: l}, {id: r}) => r-l)[0].id;
  }

  public async getGenres(): Promise<string[]> {
    return this.genres;
  }

  public getLargestId(): number {
    return this.largestId;
  }

  public async getAll(): Promise<MovieRecord[]> {
    return this.records;
  }
  public async getByExact(
    input: GetByExactInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    const results: MovieRecord[] = [];
    for (const record of this.records) {
      if (this.matchesExact(input, record)) {
        results.push(record);
      }
    }
    return results;
  }

  private matchesExact(
    input: GetByExactInput<MovieRecord>,
    target: MovieRecord
  ): boolean {
    for (const [key, value] of Object.entries(input)) {
      if (target[key as keyof MovieRecord] !== value) {
        return false;
      }
    }
    return true;
  }

  public async getByRange(
    input: GetByRangeInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    const results: MovieRecord[] = [];
    let records: MovieRecord[];
    if (input['runtime']) {
      records = this.getByRangeRuntimeOptimized(input.runtime);
    } else {
      records = this.records;
    }
    for (const record of records) {
      if (this.matchesRange(input, record)) {
        results.push(record);
      }
    }
    return results;
  }

  private getByRangeRuntimeOptimized([min, max]: [
    min: number,
    max: number
  ]): MovieRecord[] {
    const left = binsearchPrevious(this.runtimesIndex, min);
    const right = binsearchNext(this.runtimesIndex, max);
    if (left > this.runtimesIndex.length - 1 || right < 0) {
      return [];
    }
    return this.runtimesIndex.slice(left + 1, right).map(([, m]) => m);
  }

  private matchesRange(
    input: GetByRangeInput<MovieRecord>,
    target: MovieRecord
  ): boolean {
    for (const [key, [min, max]] of Object.entries(input).filter(
      ([k]) => typeof target[k as keyof MovieRecord] === 'number'
    )) {
      if (
        (target[key as keyof MovieRecord]! as number) > max ||
        (target[key as keyof MovieRecord]! as number) < min
      ) {
        return false;
      }
    }
    return true;
  }

  public async getByAnyOf(
    input: GetByAnyOfInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    let resultsWithMatchCount: [MovieRecord, number][];
    if (Object.keys(input).length === 1 && Object.keys(input)[0] === 'genres') {
      resultsWithMatchCount = this.getByAnyOfGenresOptimized(input.genres!);
    } else {
      resultsWithMatchCount = [];
      for (const record of this.records) {
        const matchCount = this.getMatchCount(input, record);
        if (matchCount > 0) {
          resultsWithMatchCount.push([record, matchCount]);
        }
      }
    }
    return resultsWithMatchCount.sort(([, a], [, b]) => b - a).map(([r]) => r);
  }

  /**
   * Gets movie records with any of specified genres. Should perform better than generic behavior in `getByAnyOf` in avg case.
   */
  private getByAnyOfGenresOptimized(genres: string[]): [MovieRecord, number][] {
    const recordMatchCountMap: Map<MovieRecord, number> = new Map();
    for (const genre of genres) {
      this.genresIndex.get(genre)!.forEach((record) => {
        let currentMatchCount = recordMatchCountMap.get(record) ?? 0;
        recordMatchCountMap.set(record, ++currentMatchCount);
      });
    }
    return Array.from(recordMatchCountMap.entries());
  }

  private getMatchCount(
    input: GetByAnyOfInput<MovieRecord>,
    target: MovieRecord
  ): number {
    let acc = 0;
    for (const [key, values] of Object.entries(input).filter(([k]) =>
      Array.isArray(target[k as keyof MovieRecord])
    )) {
      for (const value of target[key as keyof MovieRecord] as Array<unknown>) {
        if (typeof value === 'string' && values.includes(value)) {
          acc += 1;
        }
      }
    }
    return acc;
  }

  public async getByComposed(
    input: GetByComposedInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    const resultsWithMatchCount: [MovieRecord, number][] = [];
    for (const record of this.records) {
      const matchCount = input[GetByInputVariants.ANY_OF]
        ? this.getMatchCount(input[GetByInputVariants.ANY_OF], record)
        : 1;
      const matchesRange = input[GetByInputVariants.RANGE]
        ? this.matchesRange(input[GetByInputVariants.RANGE], record)
        : true;
      const matchesExact = input[GetByInputVariants.EXACT]
        ? this.matchesExact(input[GetByInputVariants.EXACT], record)
        : true;
      if (matchCount > 0 && matchesRange && matchesExact) {
        resultsWithMatchCount.push([record, matchCount]);
      }
    }
    return resultsWithMatchCount.sort(([, a], [, b]) => b - a).map(([r]) => r);
  }
}
