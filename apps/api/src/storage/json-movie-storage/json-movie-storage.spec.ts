import { JSONMovieStorage } from './json-movie-storage';
import fsPromises, { FileHandle } from 'fs/promises';
import { InvalidFileContentsError, UnableToOpenFileError } from './errors';
import { MovieRecord } from './movie-record';
import { GetByInputVariants } from '../types/inputs';
import { MovieRecordFlushBehavior } from './types/json-movie-storage-options';

jest.mock('fs/promises');

const dummyData = {
  genres: ['A', 'B', 'C'],
  movies: [
    {
      id: 0,
      title: 'Movie 0',
      genres: ['A'],
      runtime: 10,
      year: 1000,
      director: 'guy',
    },
    {
      id: 1,
      title: 'Movie 1',
      genres: ['B', 'C'],
      runtime: 20,
      year: 1000,
      director: 'guy',
    },
    {
      id: 3,
      title: 'Movie 3',
      genres: ['A', 'B'],
      runtime: 30,
      year: 2000,
      director: 'guy',
    },
  ] as MovieRecord[],
};

describe('JSON Movie Storage tests', () => {
  const mockPreSerialize = jest.fn();
  const mockPostDeserialize = jest.fn();
  const fhMock = {
  } as unknown as FileHandle;
  let storage: JSONMovieStorage;
  beforeEach(() => {
    jest.resetAllMocks();
    fhMock.readFile = jest.fn().mockResolvedValue(JSON.stringify(dummyData));
    fhMock.write = jest.fn();
    fhMock.close = jest.fn();
    fsPromises.open = jest.fn().mockResolvedValue(fhMock);
    mockPreSerialize.mockImplementation(JSONMovieStorage.DEFAULT_PRE_SERIALIZE);
    mockPostDeserialize.mockImplementation(JSONMovieStorage.DEFAULT_POST_DESERIALIZE);
    storage = new JSONMovieStorage({
      preSerialize: mockPreSerialize,
      postDeserialize: mockPostDeserialize,
    });
  });
  describe('load()', () => {
    it('Should acquire file handle to json file at specified path', async () => {
      mockPostDeserialize.mockReturnValue([]);
      const path = 'some/path/to/file.json';
      await storage.load(path);
      expect(fsPromises.open).toHaveBeenCalledWith(
        path,
        fsPromises.constants.O_RDWR
      );
    });
    it('Should throw an error if file handle could not be acquired', async () => {
      (fsPromises.open as jest.Mock).mockRejectedValue(
        new Error('something went wrong...')
      );
      await expect(storage.load('some/path')).rejects.toThrow(
        UnableToOpenFileError
      );
    });
    it('Should throw an error if file contents could not be parsed as JSON', async () => {
      (fsPromises.open as jest.Mock).mockResolvedValue({
        readFile: jest.fn().mockResolvedValue('not a json :PP'),
      } as unknown as FileHandle);
      await expect(storage.load('some path')).rejects.toThrow(
        InvalidFileContentsError
      );
    });
    it('Should call defined post-deserialize transform function on deserialized data', async () => {
      mockPostDeserialize.mockReturnValue([]);
      await storage.load('some/path');

      expect(mockPostDeserialize).toHaveBeenCalledWith(dummyData, storage);
    });
  });
  describe('getGenres()', () => {
    beforeEach(async () => {
      await storage.load('');
    });
    it('Should return all genres loaded from file', async () =>{
      expect(storage.getGenres()).resolves.toEqual(dummyData.genres);
    });
  });
  describe('getAll()', () => {
    beforeEach(async () => {
      await storage.load('');
    });
    it('Should return all movie records stored', async () => {
      const returnedRecords = await storage.getAll();
      expect(returnedRecords).toEqual(dummyData.movies);
    });
  });
  describe('getByExact()', () => {
    beforeEach(async () => {
      await storage.load('');
    });
    it.each([
      [{ id: 0 }, [dummyData.movies[0]]],
      [{ year: 1000 }, [dummyData.movies[0], dummyData.movies[1]]],
      [{ director: 'guy' }, dummyData.movies],
      [{ id: 0, director: 'guy' }, [dummyData.movies[0]]],
      [{ director: 'guy', year: 2000 }, [dummyData.movies[2]]],
    ])(
      'Should only return records with values exactly matching those passed as args (case %#)',
      async (input, expectedReturnedRecords) => {
        const returnedRecords = await storage.getByExact(input);
        expect(returnedRecords).toEqual(expectedReturnedRecords);
      }
    );
  });
  describe('getByRange()', () => {
    beforeEach(async () => {
      await storage.load('');
    });
    it.each([
      [{ runtime: [0, 10] as [number, number] }, [dummyData.movies[0]]],
      [{ runtime: [15, 25] as [number, number] }, [dummyData.movies[1]]],
      [{ runtime: [30, 100] as [number, number] }, [dummyData.movies[2]]],
      [{ runtime: [-10, 0] as [number, number] }, []],
      [{ runtime: [0, 30] as [number, number] }, [...dummyData.movies]],
      [
        { runtime: [10, 20] as [number, number] },
        [dummyData.movies[0], dummyData.movies[1]],
      ],
    ])(
      'Should only return records with values within inclusive bounds specified in input (case %#)',
      async (input, expectedReturnedRecords) => {
        const returnedRecords = await storage.getByRange(input);
        expect(returnedRecords).toEqual(expectedReturnedRecords);
      }
    );
  });
  describe('getByAnyOf()', () => {
    beforeEach(async () => {

      await storage.load('');
    });
    it.each([
      [{ genres: ['A'] }, [dummyData.movies[0], dummyData.movies[2]]],
      [{ genres: ['B'] }, [dummyData.movies[1], dummyData.movies[2]]],
      [{ genres: ['C'] }, [dummyData.movies[1]]],
      [{ genres: ['A', 'B', 'C'] }, [...dummyData.movies]],
      [{ genres: ['B', 'C'] }, [dummyData.movies[1], dummyData.movies[2]]],
    ])(
      'Should only return records with values containing at least one of the values specified in args (case %#)',
      async (input, expectedReturnedRecords) => {
        const returnedRecords = await storage.getByAnyOf(input);
        expect(returnedRecords.length).toEqual(expectedReturnedRecords.length);
        for (const expectedRecord of expectedReturnedRecords) {
          expect(returnedRecords).toContainEqual(expectedRecord);
        }
      }
    );
    it.each([
      [{ genres: ['B', 'C'] }],
      [{ genres: ['A', 'B', 'C'] }],
      [{ genres: ['B'] }],
      [{ genres: ['A', 'B'] }],
      [{ genres: ['C'] }],
    ])(
      'Should return matching records starting from the record which matches the largest number of values specified in args (case %#)',
      async (input) => {
        const returnedRecords = await storage.getByAnyOf(input);
        for (let i = 0; i<returnedRecords.length-1; i++) {
          const currMatchCount = returnedRecords[i].genres.reduce((acc, curr) => {
            return input.genres.includes(curr) ? acc+1 : acc;
          }, 0);
          const nextMatchCount = returnedRecords[i+1].genres.reduce((acc, curr) => {
            return input.genres.includes(curr) ? acc+1 : acc;
          }, 0);

          expect(currMatchCount).toBeGreaterThanOrEqual(nextMatchCount);
        }
      }
    );
  });
  describe('getByComposed()', () => {
    beforeEach(async () => {

      await storage.load('');
    });
    it.each([
      [{ [GetByInputVariants.EXACT]: { director: 'guy'}, [GetByInputVariants.RANGE]: { runtime: [20, 30] as [number, number] } }, [dummyData.movies[1], dummyData.movies[2]]],
      [{ [GetByInputVariants.ANY_OF]: { genres: ['C'] }, [GetByInputVariants.RANGE]: { runtime: [20, 30] as [number, number] } }, [dummyData.movies[1]]],
      [{ [GetByInputVariants.EXACT]: { year: 1000 }, [GetByInputVariants.ANY_OF]: { genres: ['A'] } }, [dummyData.movies[0]]],
    ])('Should only return records that match all of the conditions specified in input (case %#)', async (input, expectedReturnedRecords) => {
      const returnedRecords = await storage.getByComposed(input);
      expect(returnedRecords.length).toEqual(expectedReturnedRecords.length);
      for (const expectedRecord of expectedReturnedRecords) {
        expect(returnedRecords).toContainEqual(expectedRecord);
      }
    });
  });
  describe('Data flush', () => {
    it('Should flush records stored in memory into the file after save() method is called if flush behavior is set to ON_SAVE', async () => {
      storage = new JSONMovieStorage({
        flushBehavior: MovieRecordFlushBehavior.ON_SAVE,
      });
      await storage.load('');
      await storage.save({} as never);
      expect(fhMock.write).toHaveBeenCalled();
    });
    it('Should flush records stored in memory into the file after onShutdown() method is called if flush behavior is set to ON_SHUTDOWN', async () => {
      storage = new JSONMovieStorage({
        flushBehavior: MovieRecordFlushBehavior.ON_SHUTDOWN,
      });
      await storage.load('');
      await storage.save({} as never);
      expect(fhMock.write).not.toHaveBeenCalled();
      await storage.onShutdown();
      expect(fhMock.write).toHaveBeenCalled();
    });
    it('Should call pre-serialize transformer with record data stored in memory', async () => {
      storage = new JSONMovieStorage({
        flushBehavior: MovieRecordFlushBehavior.ON_SHUTDOWN,
        preSerialize: mockPreSerialize,
      });
      await storage.load('');
      await storage.onShutdown();
      expect(mockPreSerialize).toHaveBeenCalledWith(dummyData.movies,storage);
    });
    it('Should write result of pre-serialize transformer to file', async () => {
      storage = new JSONMovieStorage({
        flushBehavior: MovieRecordFlushBehavior.ON_SHUTDOWN,
        preSerialize: mockPreSerialize,
      });
      await storage.load('');
      await storage.onShutdown();
      expect(fhMock.write).toHaveBeenCalledWith(JSON.stringify(mockPreSerialize(dummyData.movies, storage)), 0, 'utf-8');
    });
  });
  describe('On shutdown', () => {
    it('Should close used file handle', async () => {
      storage = new JSONMovieStorage();
      await storage.load('');
      
      await storage.onShutdown();
      
      expect(fhMock.close).toHaveBeenCalled();
    });
  });
});
