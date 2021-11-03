import { promises as fs, existsSync } from 'fs';

export const CACHE_LOCATION = './.splice.cache/';

export async function lookup<T>(
  key: string,
  item: string,
  type: 'binary' | 'json' = 'json'
): Promise<T | Buffer | null> {
  const mdPath = `${CACHE_LOCATION}/${key}/${item}`;
  if (!existsSync(mdPath)) {
    return null;
  }
  const content = await fs.readFile(mdPath);
  if (type === 'json') {
    return JSON.parse(content.toString('utf-8')) as T;
  } else {
    return content;
  }
}

export async function store(
  key: string,
  item: string,
  type: 'json' | 'string' | 'binary',
  payload: any
): Promise<void> {
  const path = `${CACHE_LOCATION}/${key}`;
  if (!existsSync(path)) {
    await fs.mkdir(path, { recursive: true });
  }
  const mdPath = `${path}/${item}`;
  switch (type) {
    case 'binary':
      return fs.writeFile(mdPath, payload);
    case 'json':
      return fs.writeFile(mdPath, JSON.stringify(payload), {
        encoding: 'utf-8'
      });
    case 'string':
      return fs.writeFile(mdPath, payload as string, { encoding: 'utf-8' });
  }
}
