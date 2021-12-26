export type ImageLoaderResult = {
  rgb: Uint8Array;
  dims: {
    w: number;
    h: number;
  };
};

export type ImageLoader = (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
) => Promise<ImageLoaderResult>;
