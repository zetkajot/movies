import { z } from 'zod';

export const rawMovieRecordSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.coerce.string(),
  runtime: z.coerce.string(),
  genres: z.array(z.string()).min(1),
  director: z.string(),
  actors: z.string().optional(),
  plot: z.string().optional(),
  posterUrl: z.string().optional(),
});

export const movieRecordSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.coerce.number(),
  runtime: z.coerce.number(),
  genres: z.array(z.string()).min(1),
  director: z.string(),
  actors: z.string().optional(),
  plot: z.string().optional(),
  posterUrl: z.string().optional(),
});

export type RawMovieRecord = z.infer<typeof rawMovieRecordSchema>;
export type MovieRecord = z.infer<typeof movieRecordSchema>;