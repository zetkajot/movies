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
}>;

// Allowing any due to return type of JSON.parse() and params of JSON.stringify()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MovieRecordPreSerializeTransformer = (records: MovieRecord[]) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MovieRecordPostDeserializeTransformer = (data: any) => MovieRecord[];
