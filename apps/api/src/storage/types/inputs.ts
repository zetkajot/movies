export enum GetByInputVariants {
  EXACT,
  RANGE,
  ANY_OF
};

export type GetByInputVariantsInputs<T> = {
  [GetByInputVariants.EXACT]: GetByExactInput<T>;
  [GetByInputVariants.RANGE]: GetByRangeInput<T>;
  [GetByInputVariants.ANY_OF]: GetByAnyOfInput<T>;
}

export type GetByExactInput<T> = Partial<T>;

export type GetByRangeInput<T> = Partial<{
  [K in keyof T]: T[K] extends number ? [min: number, max: number] : never;
}>;

export type GetByAnyOfInput<T> = Partial<{
  [K in keyof T]: T[K] extends string[] ? string[] : never;
}>

export type GetByComposedInput<T> = Partial<GetByInputVariantsInputs<T>>;