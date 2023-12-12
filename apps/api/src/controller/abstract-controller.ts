import { Router } from 'express';
import { SafeParseError, SafeParseSuccess } from 'zod';

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

  private registerRoute<QueryParams, Body>(
    path: string,
    method: 'get' | 'post',
    routeHandler: (q?: QueryParams, body?: Body) => Promise<unknown>,
    qSchema?: Zod.Schema<QueryParams>,
    bodySchema?: Zod.Schema<Body>
  ): void {
    let routePath =
      (this.root.endsWith('/') ? this.root : this.root + '/') +
      (path.startsWith('/') ? path.slice(1) : path);
    routePath = routePath.endsWith('/') ? routePath.slice(0, -1) : routePath;
    if (method === 'get') {
      this.router.get(routePath, (req, res, next) => {
        const qParsingResult = qSchema?.safeParse(req.query);
        if (qParsingResult && !qParsingResult.success) {
          next((qParsingResult as SafeParseError<unknown>).error);
        }

        routeHandler((qParsingResult as SafeParseSuccess<QueryParams>)?.data)
          .then((responseBody) => res.json(responseBody))
          .catch((e) => next(e));
      });
    } else {
      this.router.post(routePath, (req, res, next) => {
        const qParsingResult = qSchema?.safeParse(req.query);
        if (qParsingResult && !qParsingResult.success) {
          next((qParsingResult as SafeParseError<unknown>).error);
        }
        const bodyParsingResult = bodySchema?.safeParse(req.body);
        if (bodyParsingResult && !bodyParsingResult.success) {
          next((bodyParsingResult as SafeParseError<unknown>).error);
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
