import { JSONMovieStorage } from '../json-movie-storage';
import { MovieRecord } from '../movie-record';

export type JSONMovieStorageOptions = Partial<{
  /**
   * Custom transformer run before movie record is passed to `JSON.stringify()`
   */
  preSerialize: MovieRecordPreSerializeTransformer;
  /**
   * Custom transformer run after data was deserialized via `JSON.parse()`
   */
  postDeserialize: MovieRecordPostDeserializeTransformer;
  /**
   * Controls when flush into file is triggered
   */
  flushBehavior: MovieRecordFlushBehavior;
}>;

// Allowing any due to return type of JSON.parse() and params of JSON.stringify()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MovieRecordPreSerializeTransformer = (records: MovieRecord[], ctx: JSONMovieStorage) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MovieRecordPostDeserializeTransformer = (data: any, ctx: JSONMovieStorage) => MovieRecord[];

export enum MovieRecordFlushBehavior {
  /**
   * Writes to file immediately after record saves
   */
  ON_SAVE,
  /**
   * Writes to file on app shutdown
   */
  ON_SHUTDOWN,
}