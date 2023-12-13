import { NextFunction, Request, Response } from 'express';
import { ErrorMapper } from './types/error-mapper'
import { InternalServerErrorException } from '../http-exceptions/internal-server-error-exception';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrCtr<T extends Error> = { new(...args: any[]): T }


export class ErrorHandler {
  private static readonly DEFAULT_EXCEPTION = new InternalServerErrorException();
  private readonly errorMappers: [ErrCtr<Error>, ErrorMapper<Error>][] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleError(err: unknown, req: Request, res: Response, next: NextFunction) {
    for (const [ErrorCls, errorMapper] of this.errorMappers) {
      if (err instanceof ErrorCls) {
        console.error(err.name, err.message);
        const httpException = errorMapper.mapError(err);
        return res.status(httpException.status).json(httpException);
      }
    }
    console.error(err);
    res.status(ErrorHandler.DEFAULT_EXCEPTION.status).json(ErrorHandler.DEFAULT_EXCEPTION);
  }

  public getErrorHandler() {
    return this.handleError.bind(this);
  }

  public registerMapper<T extends Error>(errorType: ErrCtr<T>, mapper: ErrorMapper<T>): this {
    this.errorMappers.push([errorType, mapper]);
    return this;
  }
}