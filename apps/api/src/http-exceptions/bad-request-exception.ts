import { HttpException } from './http-exception';

export class BadRequestException extends HttpException {
  public status: number = 400;
  public name: string = 'Bad Request';
}