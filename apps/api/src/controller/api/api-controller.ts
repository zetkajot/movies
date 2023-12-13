import { Router } from 'express';
import { MovieService } from '../../service/movie.service';
import { AbstractController } from '../abstract-controller';
import { z } from 'zod';
import { GetMoviesOptions } from '../../service/types/get-movies-options';
import { MovieDto, movieDtoSchema } from '../../dto/movie.dto';

export class ApiController extends AbstractController {
  constructor(router: Router, private readonly movieService: MovieService) {
    super(router, '/movies', []);
    this.buildRoutes();
  }

  private buildRoutes() {
    const getMoviesSchema = z.object({
      runtime: z.coerce.number().optional(),
      genres: z
        .array(z.string())
        .min(1)
        .or(z.string().transform((s) => s.split(',')))
        .optional(),
    });
    this.registerRoute<GetMoviesOptions, never>(
      '/',
      'get',
      (query) => this.movieService.getMovies(query),
      getMoviesSchema
    );

    this.registerRoute<never, MovieDto>(
      '/',
      'post',
      (_, body) => this.movieService.saveMovie(body),
      undefined,
      movieDtoSchema
    );
  }
}
