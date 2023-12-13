import 'dotenv/config';
import { z } from 'zod';

export const configSchema = z.object({
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number({
    invalid_type_error: 'Port number must coercible to number.',
  }).min(1).max(65536).default(3000),
  DB_FILE_PATH: z.string({
    required_error: 'Path to database file must be set.'
  })
})

export class ConfigProvider {
  public static get CONFIG(): z.infer<typeof configSchema> {
    if (!this.parsedConfig) {
      this.parsedConfig = configSchema.parse(process.env);
    }
    return this.parsedConfig;
  }
  private static parsedConfig: z.infer<typeof configSchema> | undefined;
}