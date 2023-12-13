import { HttpException } from './http-exception';

export class InternalServerErrorException extends HttpException {
  public status: number = 500;
  public name: string = 'Internal Server Error';
}