import { ZodError } from 'zod';
import { ErrorMapper } from './types/error-mapper';
import { HttpException } from '../http-exceptions/http-exception';
import { BadRequestException } from '../http-exceptions/bad-request-exception';

export class ZodErrorMapper implements ErrorMapper<ZodError> {
  mapError(error: ZodError<unknown>): HttpException {
      return new BadRequestException(this.formatZodError(error));
  }

  private formatZodError(error: ZodError<unknown>): string {
    return 'Invalid request:\n'+error.issues.map(({path, message}) => `For properties ${path.map((v) => `'${v}'`).join(', ')}: ${message}`).join('\n');
  }
}