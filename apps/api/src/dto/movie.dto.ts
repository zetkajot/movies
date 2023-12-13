import { z } from 'zod';

export const movieDtoSchema = z.object({
  title: z.string().max(255),
  genres: z.array(z.string()).min(1),
  year: z.coerce.number(),
  runtime: z.coerce.number(),
  director: z.string().max(255),
  actors: z.string().optional(),
  plot: z.string().optional(),
  posterUrl: z.string().optional(),
});

export type MovieDto = z.infer<typeof movieDtoSchema>;