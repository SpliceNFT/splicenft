declare module 'get-rgba-palette' {
  type RGB = [number, number, number];

  /**
   * @param pixels a flat array of RGBA values
   */
  type FilterFunction = (pixels: number[], index: number) => boolean;
  export default function (
    pixels: number[] | Uint8Array,
    count?: number = 5,
    quality?: number = 10,
    filter?: FilterFunction
  ): RGB[];
}
