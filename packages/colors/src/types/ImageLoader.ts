export type ImageLoaderResult = {
  rgb: Uint8Array;
  dims: {
    w: number;
    h: number;
  };
};

export type ImageLoaderOptions = {
  proxy?: string;
  dims?: {
    w: number;
    h: number;
  };
};

export type ImageLoader = (
  image: string | HTMLImageElement,
  options: ImageLoaderOptions
) => Promise<ImageLoaderResult>;
