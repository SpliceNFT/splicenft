export default class Color {
  public count: number;

  private r: number;
  private g: number;
  private b: number;

  private sat: number | undefined;

  constructor(red: number, green: number, blue: number) {
    this.r = red;
    this.g = green;
    this.b = blue;

    this.count = 1;
  }

  public incr() {
    this.count++;
  }

  getWeight(saturationWeight: number, pxCount: number) {
    return (
      (this.count / pxCount) * (1 - saturationWeight) +
      this.saturation * saturationWeight
    );
  }

  distance(color: Color) {
    return (
      (Math.abs(color.r - this.r) +
        Math.abs(color.g - this.g) +
        Math.abs(color.b - this.b)) /
      (3 * 0xff)
    );
  }

  get saturation() {
    if (this.sat === undefined) {
      this.sat = Math.max(
        Math.abs(this.r - this.g) / 0xff,
        Math.abs(this.r - this.b) / 0xff,
        Math.abs(this.g - this.b) / 0xff
      );
    }

    return this.sat;
  }
  public ratio(pixels: number) {
    return this.count / pixels;
  }

  public asStruct(pixels: number) {
    return {
      red: this.r,
      green: this.g,
      blue: this.b,
      ratio: this.ratio(pixels),
      saturation: this.saturation / 0xff
    };
  }
}
