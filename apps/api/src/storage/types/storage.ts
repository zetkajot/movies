import {
  GetByExactInput,
  GetByRangeInput,
  GetByAnyOfInput,
  GetByComposedInput,
} from './inputs';

/**
 * Interface for records storage
 */
export interface Storage<Record> {
  /**
   * Returns all stored records
   */
  getAll(): Promise<Record[]>;
  /**
   * Returns records of which selected properties exactly match values specified in input
   */
  getByExact(input: GetByExactInput<Record>): Promise<Record[]>;
  /**
   * Returns records of which selected properties are inside ranges specified in input
   */
  getByRange(input: GetByRangeInput<Record>): Promise<Record[]>;
  /**
   * Return records of which selected properties contain at least one value specified in input
   */
  getByAnyOf(input: GetByAnyOfInput<Record>): Promise<Record[]>;
  /**
   * Returns records matching all of the specified conditions
   */
  getByComposed(inptut: GetByComposedInput<Record>): Promise<Record[]>;
}
