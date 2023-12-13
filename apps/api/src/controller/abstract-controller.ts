import { Router } from 'express';
import { SafeParseError, SafeParseSuccess, ZodObjectDef } from 'zod';

export abstract class AbstractController {
  constructor(
    private readonly router: Router,
    private readonly root: string,
    routes: Parameters<AbstractController['registerRoute']>[]
  ) {
    this.router = router;
    for (const routeRegisterParams of routes) {
      this.registerRoute(...routeRegisterParams);
    }
  }

  protected registerRoute<QueryParams, Body>(
    path: string,
    method: 'get' | 'post',
    routeHandler: (q?: QueryParams, body?: Body) => Promise<unknown>,
    qSchema?: Zod.Schema<QueryParams, ZodObjectDef, unknown>,
    bodySchema?: Zod.Schema<Body, ZodObjectDef, unknown>
  ): void {
    let routePath =
      (this.root.endsWith('/') ? this.root : this.root + '/') +
      (path.startsWith('/') ? path.slice(1) : path);
    routePath = routePath.endsWith('/') ? routePath.slice(0, -1) : routePath;
    if (method === 'get') {
      this.router.get(routePath, (req, res, next) => {
        const qParsingResult = qSchema?.safeParse(req.query);
        if (qParsingResult && !qParsingResult.success) {
          return next((qParsingResult as SafeParseError<unknown>).error);
        }

        routeHandler((qParsingResult as SafeParseSuccess<QueryParams>)?.data)
          .then((responseBody) => res.json(responseBody))
          .catch((e) => next(e));
      });
    } else {
      this.router.post(routePath, (req, res, next) => {
        const qParsingResult = qSchema?.safeParse(req.query);
        if (qParsingResult && !qParsingResult.success) {
          return next((qParsingResult as SafeParseError<unknown>).error);
        }
        const bodyParsingResult = bodySchema?.safeParse(req.body);
        if (bodyParsingResult && !bodyParsingResult.success) {
          return next((bodyParsingResult as SafeParseError<unknown>).error);
        }

        routeHandler(
          (qParsingResult as SafeParseSuccess<QueryParams>)?.data,
          (bodyParsingResult as SafeParseSuccess<Body>)?.data
        )
          .then((responseBody) => res.json(responseBody))
          .catch((e) => next(e));
      });
    }
  }
}
