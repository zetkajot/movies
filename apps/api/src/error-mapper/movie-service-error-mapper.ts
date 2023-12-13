import { BadRequestException } from '../http-exceptions/bad-request-exception';
import { HttpException } from '../http-exceptions/http-exception';
import { InternalServerErrorException } from '../http-exceptions/internal-server-error-exception';
import { MovieServiceError, UnknownGenresError } from '../service/errors';
import { NoMovieDtoError } from '../service/errors/no-movie-dto.error';
import { ErrorMapper } from './types/error-mapper';

export class MovieServiceErrorMapper implements ErrorMapper<MovieServiceError> {
  mapError(error: MovieServiceError): HttpException {
      if (error instanceof UnknownGenresError) {
        return new BadRequestException(error.message);
      } else if (error instanceof NoMovieDtoError) {
        return new BadRequestException(error.message);
      } 
      else {
        return new InternalServerErrorException();
      }
  }
}