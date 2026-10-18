import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

// Ленивое подключение: сборка не падает, пока DATABASE_URL не задан
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  client ??= neon(process.env.DATABASE_URL!);
  return client(strings, ...values);
}
