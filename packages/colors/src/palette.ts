import Group from './group';

type ExtractOptions = {
  pixels?: number;
  distance?: number;
  saturationWeight?: number;
  accuracy?: number;
};

export function palette(options?: ExtractOptions) {
  const { pixels, distance, saturationWeight, accuracy }: ExtractOptions = {
    pixels: 200000,
    distance: 0.2,
    saturationWeight: 0.2,
    accuracy: 10,
    ...options
  };

  return (rgba: number[]) => {
    const root = new Group();

    for (let i = 0; i < rgba.length; i += 4) {
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const a = rgba[i + 3];

      if (a > 250) {
        const loose =
          (((r >> 4) & 0xf) << 2) | (((g >> 4) & 0xf) << 1) | ((b >> 4) & 0xf);
        const narrow =
          Math.round((r * (accuracy - 1)) / 255) * (accuracy * accuracy) +
          Math.round((g * (accuracy - 1)) / 255) * accuracy +
          Math.round((b * (accuracy - 1)) / 255);

        const gNarrow = root.addGroup(narrow);

        const gLoose = gNarrow && gNarrow.addGroup(loose);
        gLoose && gLoose.addColor(r, g, b);
      }
    }

    const colors = root.getColors(distance, saturationWeight, pixels);
    colors.sort((c1, c2) => c2.ratio(pixels) - c1.ratio(pixels));
    return colors.map((color) => color.asStruct(pixels));
  };
}
