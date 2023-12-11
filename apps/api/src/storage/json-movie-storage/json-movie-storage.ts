import { FileHandle, constants, open } from 'fs/promises';
import {
  GetByAnyOfInput,
  GetByComposedInput,
  GetByExactInput,
  GetByInputVariants,
  GetByRangeInput,
} from '../types/inputs';
import { Storage } from '../types/storage';
import { MovieRecord } from './movie-record';
import {
  JSONMovieStorageOptions,
  MovieRecordPostDeserializeTransformer,
  MovieRecordPreSerializeTransformer,
} from './types/json-movie-storage-options';
import { UnableToOpenFileError } from './errors/unable-to-open-file.error';
import { InvalidFileContentsError } from './errors';

/**
 * Stores Movie records in memory backed up by JSON file
 */
export class JSONMovieStorage implements Storage<MovieRecord> {
  private genres: string[];
  private records: MovieRecord[];
  private genresIndex: Map<string, MovieRecord[]>;
  private runtimesIndex: [number, MovieRecord][];

  public static readonly DEFAULT_PRE_SERIALIZE: MovieRecordPreSerializeTransformer =
    (records) => records;
  public static readonly DEFAULT_POST_DESERIALIZE: MovieRecordPostDeserializeTransformer =
    (data) => data.movies;

  private readonly preSerialize: MovieRecordPreSerializeTransformer;
  private readonly postDeserialize: MovieRecordPreSerializeTransformer;
  private fileHandle: FileHandle;

  constructor(opts?: JSONMovieStorageOptions) {
    this.preSerialize =
      opts?.preSerialize ?? JSONMovieStorage.DEFAULT_PRE_SERIALIZE;
    this.postDeserialize =
      opts?.postDeserialize ?? JSONMovieStorage.DEFAULT_POST_DESERIALIZE;
  }

  public async load(jsonFilePath: string) {
    try {
      this.fileHandle = await open(jsonFilePath, constants.O_RDWR);
    } catch (err) {
      throw new UnableToOpenFileError(jsonFilePath, err);
    }
    let parsedData;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      parsedData = JSON.parse(
        await this.fileHandle.readFile({ encoding: 'utf-8' })
      );
    } catch (e) {
      throw new InvalidFileContentsError(jsonFilePath, e);
    }
    this.genres = parsedData.genres;
    this.records = this.postDeserialize(parsedData);

    this.buildGenresIndex();
    this.buildRuntimeIndex();
  }

  private buildGenresIndex() {
    this.genresIndex = new Map(this.genres.map((genre) => [genre, []]));
    for (const record of this.records) {
      for (const genre of record.genres) {
        this.genresIndex.get(genre).push(record);
      }
    }
  }

  private buildRuntimeIndex() {
    this.runtimesIndex = this.records.map((record) => [record.runtime, record]);
  }

  async getAll(): Promise<MovieRecord[]> {
    return this.records;
  }
  async getByExact(
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
      if (target[key] !== value) {
        return false;
      }
    }
    return true;
  }

  async getByRange(
    input: GetByRangeInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    const results: MovieRecord[] = [];
    let records: MovieRecord[];
    if ('runtime' in input) {
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
    let left = this.binsearchRuntimeIndex(min);
    if (this.runtimesIndex[left][0] < min) {
      left += 1;
    }
    let right = this.binsearchRuntimeIndex(max);
    if (this.runtimesIndex[right][0] > max) {
      right-=1;
    }
    return this.runtimesIndex
      .slice(left, right + 1)
      .map(([, record]) => record);
  }

  private binsearchRuntimeIndex(n: number): number {
    let [left, right] = [0, this.runtimesIndex.length - 1];
    let i: number;
    while (left <= right) {
      i = Math.floor((left + right) / 2);
      if (this.runtimesIndex[i][0] === n) {
        return i;
      } else if (this.runtimesIndex[i][0] < n) {
        left = i + 1;
      } else {
        right = i - 1;
      }
    }
    return i;
  }

  private matchesRange(
    input: GetByRangeInput<MovieRecord>,
    target: MovieRecord
  ): boolean {
    for (const [key, [min, max]] of Object.entries(input)) {
      if (target[key] > max || target[key] < min) {
        return false;
      }
    }
    return true;
  }

  async getByAnyOf(
    input: GetByAnyOfInput<MovieRecord>
  ): Promise<MovieRecord[]> {
    let resultsWithMatchCount: [MovieRecord, number][];
    if (Object.keys(input).length === 1 && Object.keys(input)[0] === 'genres') {
      resultsWithMatchCount = this.getByAnyOfGenresOptimized(input.genres);
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
  getByAnyOfGenresOptimized(genres: string[]): [MovieRecord, number][] {
    const recordMatchCountMap: Map<MovieRecord, number> = new Map();
    for (const genre of genres) {
      this.genresIndex.get(genre).forEach((record) => {
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
    for (const [key, values] of Object.entries(input)) {
      for (const value of target[key]) {
        if (values.includes(value)) {
          acc += 1;
        }
      }
    }
    return acc;
  }

  async getByComposed(
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
