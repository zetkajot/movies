import { JSONMovieStorage } from '../storage/json-movie-storage/json-movie-storage';
import { MovieService } from './movie.service';
import { UnknownGenresError } from './errors';
import { GetByInputVariants } from '../storage/types/inputs';
import { movieRecordSchema } from '../storage/json-movie-storage/movie-record';

const dummyData = [
  {
    id: 1,
    title: 'title',
    year: 1000,
    genres: ['A', 'B'],
    runtime: 25,
    director: 'guy',
  },
  {
    id: 2,
    title: 'title',
    year: 1000,
    genres: ['A', 'B'],
    runtime: 25,
    director: 'guy',
  },
  {
    id: 3,
    title: 'title',
    year: 1000,
    genres: ['A', 'B'],
    runtime: 25,
    director: 'guy',
  },
];

describe('Movie Service test suite', () => {
  const mockStorage = {
    getGenres: jest.fn(),
    getByRange: jest.fn().mockResolvedValue(dummyData),
    getAll: jest.fn().mockResolvedValue(dummyData),
    getByAnyOf: jest.fn().mockResolvedValue(dummyData),
    getByComposed: jest.fn().mockResolvedValue(dummyData),
    getLargestId: jest.fn().mockResolvedValue(999),
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as JSONMovieStorage;
  let service: MovieService;
  beforeEach(() => {
    service = new MovieService(mockStorage);
  });
  describe('getMovies()', () => {
    it('Should throw an error if unknown genre was specified within genres filter', async () => {
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      const invalidGenres = ['A', 'B', 'X'];
      await expect(
        service.getMovies({ genres: invalidGenres })
      ).rejects.toThrow(UnknownGenresError);
    });
    it('Should return exactly one movie if no filters were specified', async () => {
      await expect(service.getMovies()).resolves.toHaveLength(1);
    });
    it("Should use storage's getByRange method with 10 minute interval if only runtime filter is specified", async () => {
      const runtime = 10;
      const expectedRange = [0, 20];
      await service.getMovies({ runtime });
      expect(mockStorage.getByRange).toHaveBeenCalledWith({
        runtime: expectedRange,
      });
    });
    it("Should use storage's getByAnyOf method if only genre filter is specified", async () => {
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      const genres = ['A', 'B', 'C'];
      await service.getMovies({ genres });
      expect(mockStorage.getByAnyOf).toHaveBeenCalledWith({ genres });
    });
    it("Should use storage's getByComposed method if both genre and runtime filter are specified", async () => {
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      const genres = ['A', 'B', 'C'];
      const runtime = 10;
      const expectedRange = [0, 20];
      await service.getMovies({ genres, runtime });
      expect(mockStorage.getByComposed).toHaveBeenCalledWith({
        [GetByInputVariants.ANY_OF]: { genres },
        [GetByInputVariants.RANGE]: { runtime: expectedRange },
      });
    });
  });
  describe('saveMovie()', () => {
    it('Should throw an error if received movie dto contains unknown genre', async () => {
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      await expect(
        service.saveMovie({
          title: '',
          year: 0,
          runtime: 0,
          genres: ['A', 'X'],
          director: 'guy',
        })
      ).rejects.toThrow(UnknownGenresError);
    });
    it('Should should save new movie dto in record form with id 1 grater than the current greatest id', async () => {
      const expectedId = 101;
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      (mockStorage.getLargestId as jest.Mock).mockReturnValue(expectedId-1);
      const dto = {
        title: '',
        year: 0,
        runtime: 0,
        genres: ['A', 'B'],
        director: 'guy',
      };
      await service.saveMovie(dto);
      expect(mockStorage.save).toHaveBeenCalledWith(movieRecordSchema.parse({
        ...dto,
        id: expectedId,
      }));
    });
    it('Should return newly saved movie', async () => {
      (mockStorage.getGenres as jest.Mock).mockResolvedValue(['A', 'B', 'C']);
      const dto = {
        title: '',
        year: 0,
        runtime: 0,
        genres: ['A', 'B'],
        director: 'guy',
      };
      const result = await service.saveMovie(dto);
      expect(result).toEqual(dto);
    });
  });
});
