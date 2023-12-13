import { HttpException } from '../../http-exceptions/http-exception';

export interface ErrorMapper<T extends Error> {
  mapError(error: T): HttpException;
}

export type ErrorMapperCtr<T extends Error> = {
  new(): ErrorMapper<T>;
}