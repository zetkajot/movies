import { NextFunction, Request, Response, Router } from 'express';
import { AbstractController } from './abstract-controller';
import { ZodError, z } from 'zod';

class ConcreteController extends AbstractController {}

describe('Controller test suite', () => {
  const routerMock: Router = {
    get: jest.fn(),
    post: jest.fn(),
  } as unknown as Router;
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('When registering routes', () => {
    describe('For \'get\' routes', () => {
      it('Should register GET routes using `Router.get` method', () => {
        new ConcreteController(routerMock, '', [['path', 'get', jest.fn()]]);
        expect(routerMock.get).toHaveBeenCalled();
      });
      it.each([
        ['root/', 'path', 'root/path'],
        ['root', '/path', 'root/path'],
        ['root', 'path', 'root/path'],
        ['root', 'path/', 'root/path'],
        ['root', '/path/', 'root/path'],
        ['root/', '/path', 'root/path'],
        ['root/', '/path/', 'root/path'],
      ])(
        'Should register GET routes with provided path prefixed with controller root with properly placed fw slashes ("%s" + "%s")',
        (root, routePath, expectedPath) => {
          new ConcreteController(routerMock, root, [
            [routePath, 'get', jest.fn()],
          ]);
          expect(routerMock.get).toHaveBeenCalledWith(
            expectedPath,
            expect.any(Function)
          );
        }
      );
      it('If query params schema was provided, parsed query params should be passed as arguments to route handler fn when route is triggered', () => {
        const routeHandler = jest.fn().mockResolvedValue(null);
        const qSchema = z.object({
          param: z.coerce.string(),
        });
        const rawQuery = {
          param: 1,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'get', routeHandler, qSchema],
        ]);
  
        const registeredHandler = (routerMock.get as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response) => unknown;
        registeredHandler(
          { query: rawQuery } as never,
          { json: jest.fn() } as never
        );
  
        expect(routeHandler).toHaveBeenCalledWith(qSchema.parse(rawQuery));
      });
      it('If query params parsing failed, it should pass resulting error to next function', () => {
        const nextMock = jest.fn();
        const routeHandler = jest.fn().mockResolvedValue(null);
        const qSchema = z.object({
          param: z.string(),
        });
        const rawQuery = {
          param: null,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'get', routeHandler, qSchema],
        ]);
  
        const registeredHandler = (routerMock.get as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response, next: NextFunction) => unknown;
        registeredHandler(
          { query: rawQuery } as never,
          { } as never,
          nextMock,
        );
  
        expect(nextMock).toHaveBeenCalledWith(expect.any(ZodError));
      });
      it("Should pass resolved output of router handler to response's json method", (done) => {
        const expectedResolvedValue = { some: 'data' };
        const responseJSONMock = jest.fn();
        const routeHandler = jest.fn().mockResolvedValue(expectedResolvedValue);
        new ConcreteController(routerMock, 'root', [
          ['path', 'get', routeHandler],
        ]);
  
        const registeredHandler = (routerMock.get as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response) => unknown;
        registeredHandler(
          { } as never,
          { json: responseJSONMock } as never
        );
        
        process.nextTick(() => {
          expect(responseJSONMock).toHaveBeenCalledWith(expectedResolvedValue);
          done();
        });
      });
      it("Should pass rejected output (Error) of route handler to the next method", (done) => {
        const expectedError = new Error('Some error from route handler');
        const nextMock = jest.fn();
        const routeHandler = jest.fn().mockRejectedValue(expectedError);
        new ConcreteController(routerMock, 'root', [
          ['path', 'get', routeHandler],
        ]);
  
        const registeredHandler = (routerMock.get as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response, next: NextFunction) => unknown;
        registeredHandler(
          { } as never,
          { } as never,
          nextMock,
        );
        
        process.nextTick(() => {
          expect(nextMock).toHaveBeenCalledWith(expectedError);
          done();
        });
      });
    });
    describe('For \'post\' routes', () => {
      it('Should register POST routes using `Router.post` method', () => {
        new ConcreteController(routerMock, '', [['path', 'post', jest.fn()]]);
        expect(routerMock.post).toHaveBeenCalled();
      });
      it.each([
        ['root/', 'path', 'root/path'],
        ['root', '/path', 'root/path'],
        ['root', 'path', 'root/path'],
        ['root', 'path/', 'root/path'],
        ['root', '/path/', 'root/path'],
        ['root/', '/path', 'root/path'],
        ['root/', '/path/', 'root/path'],
      ])(
        'Should register POST routes with provided path prefixed with controller root with properly placed fw slashes ("%s" + "%s")',
        (root, routePath, expectedPath) => {
          new ConcreteController(routerMock, root, [
            [routePath, 'post', jest.fn()],
          ]);
          expect(routerMock.post).toHaveBeenCalledWith(
            expectedPath,
            expect.any(Function)
          );
        }
      );
      it('If query params schema was provided, parsed query params should be passed as arguments to route handler fn when route is triggered', () => {
        const routeHandler = jest.fn().mockResolvedValue(null);
        const qSchema = z.object({
          param: z.coerce.string(),
        });
        const rawQuery = {
          param: 1,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler, qSchema],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response) => unknown;
        registeredHandler(
          { query: rawQuery } as never,
          { json: jest.fn() } as never
        );
  
        expect(routeHandler).toHaveBeenCalledWith(qSchema.parse(rawQuery), undefined);
      });
      it('If query params parsing failed, it should pass resulting error to next function', () => {
        const nextMock = jest.fn();
        const routeHandler = jest.fn().mockResolvedValue(null);
        const qSchema = z.object({
          param: z.string(),
        });
        const rawQuery = {
          param: null,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler, qSchema],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response, next: NextFunction) => unknown;
        registeredHandler(
          { query: rawQuery } as never,
          { } as never,
          nextMock,
        );
  
        expect(nextMock).toHaveBeenCalledWith(expect.any(ZodError));
      });
      it('If body schema was provided, parsed body should be passed as arguments to route handler fn when route is triggered', () => {
        const routeHandler = jest.fn().mockResolvedValue(null);
        const bodySchema = z.object({
          param: z.coerce.string(),
        });
        const rawBody = {
          param: 1,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler, undefined, bodySchema],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response) => unknown;
        registeredHandler(
          { body: rawBody } as never,
          { json: jest.fn() } as never
        );

        expect(routeHandler).toHaveBeenCalledWith(undefined, bodySchema.parse(rawBody));
      });
      it('If body parsing failed, it should pass resulting error to next function', () => {
        const nextMock = jest.fn();
        const routeHandler = jest.fn().mockResolvedValue(null);
        const bodySchema = z.object({
          param: z.string(),
        });
        const rawBody = {
          param: null,
        };
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler, undefined, bodySchema],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response, next: NextFunction) => unknown;
        registeredHandler(
          { query: rawBody } as never,
          { } as never,
          nextMock,
        );
  
        expect(nextMock).toHaveBeenCalledWith(expect.any(ZodError));
      });
      it("Should pass resolved output of router handler to response's json method", (done) => {
        const expectedResolvedValue = { some: 'data' };
        const responseJSONMock = jest.fn();
        const routeHandler = jest.fn().mockResolvedValue(expectedResolvedValue);
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response) => unknown;
        registeredHandler(
          { } as never,
          { json: responseJSONMock } as never
        );
        
        process.nextTick(() => {
          expect(responseJSONMock).toHaveBeenCalledWith(expectedResolvedValue);
          done();
        });
      });
      it("Should pass rejected output (Error) of route handler to the next method", (done) => {
        const expectedError = new Error('Some error from route handler');
        const nextMock = jest.fn();
        const routeHandler = jest.fn().mockRejectedValue(expectedError);
        new ConcreteController(routerMock, 'root', [
          ['path', 'post', routeHandler],
        ]);
  
        const registeredHandler = (routerMock.post as jest.Mock).mock
          .lastCall[1] as (req: Request, res: Response, next: NextFunction) => unknown;
        registeredHandler(
          { } as never,
          { } as never,
          nextMock,
        );
        
        process.nextTick(() => {
          expect(nextMock).toHaveBeenCalledWith(expectedError);
          done();
        });
      });
    });
  });

});
