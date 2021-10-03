declare module 'ipfs-only-hash' {
  import { UserImporterOptions } from 'ipfs-unixfs-importer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function of(
    content: string | Uint8Array,
    options?: UserImporterOptions
  ): Promise<string>;
}
