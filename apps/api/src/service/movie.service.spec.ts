import { JSONMovieStorage } from '../storage/json-movie-storage/json-movie-storage';
import { MovieService } from './movie.service';
import { UnknownGenresError } from './errors';
import { GetByInputVariants } from '../storage/types/inputs';
describe('Movie Service test suite', () => {
  const mockStorage = {
    getGenres: jest.fn(),
    getByRange: jest.fn(),
    getAll: jest.fn(),
    getByAnyOf: jest.fn(),
    getByComposed: jest.fn(),
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
      (mockStorage.getAll as jest.Mock).mockResolvedValue([1, 2, 3, 4, 5]);
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
});
