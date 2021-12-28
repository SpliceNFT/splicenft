import { promises as fs, existsSync, createReadStream, ReadStream } from 'fs';
import { dirname } from 'path';

export const CACHE_LOCATION = './.splice.cache';

export async function lookupString(key: string): Promise<string | null> {
  const location = `${CACHE_LOCATION}/${key}`;

  if (!existsSync(location)) {
    return null;
  }
  return fs.readFile(location, { encoding: 'utf-8' });
}

export async function lookupJSON<T>(key: string): Promise<T | null> {
  const location = `${CACHE_LOCATION}/${key}`;

  if (!existsSync(location)) {
    return null;
  }
  const content = await fs.readFile(location, { encoding: 'utf-8' });
  return JSON.parse(content) as T;
}

export async function lookupBinary(key: string): Promise<ReadStream | null> {
  const location = `${CACHE_LOCATION}/${key}`;

  if (!existsSync(location)) {
    return null;
  }
  return createReadStream(location);
}

export async function store(key: string, payload: any): Promise<void> {
  const location = `${CACHE_LOCATION}/${key}`;
  if (!existsSync(dirname(location))) {
    await fs.mkdir(dirname(location), { recursive: true });
  }

  if (payload instanceof Buffer) {
    return fs.writeFile(location, payload);
  } else if (typeof payload === 'string') {
    return fs.writeFile(location, payload as string, { encoding: 'utf-8' });
  } else {
    return fs.writeFile(location, JSON.stringify(payload), {
      encoding: 'utf-8'
    });
  }
}

export async function withCache<T>(
  cacheKey: string,
  logic: () => Promise<T> | T
): Promise<T> {
  const cached = await lookupJSON<T>(cacheKey);
  if (cached) return cached;
  else {
    const res: T = await logic();
    await store(cacheKey, res);
    return res;
  }
}
