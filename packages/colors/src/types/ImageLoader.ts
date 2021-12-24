export type ImageLoader = (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
) => Promise<Uint8Array>;
