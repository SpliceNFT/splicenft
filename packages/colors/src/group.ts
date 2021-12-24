import Color from './color';

export default class Group {
  private _count: number;
  private children: Record<number, Group | Color>;
  private maxWeight: number | undefined;

  constructor() {
    this._count = 1;
    this.children = {};
  }

  public incr() {
    this._count++;
  }

  get count() {
    return this._count;
  }

  addGroup(word: number): Group | undefined {
    let child = this.children[word];
    if (child) {
      child.incr();
    } else {
      child = new Group();
      this.children[word] = child;
    }

    return child instanceof Group ? child : undefined;
  }

  addColor(red: number, green: number, blue: number): Color | void {
    const word = (red << 16) | (green << 8) | blue;
    if (this.children[word]) {
      this.children[word].incr();
    } else {
      this.children[word] = new Color(red, green, blue);
    }
  }

  getList() {
    return Object.values(this.children);
    //return Object.keys(this.children).map((key) => this.children[key]);
  }

  getMaxWeight(saturationWeight: number, pxCount: number): number {
    if (this.maxWeight === undefined) {
      const list = this.getList().map((child) =>
        child instanceof Color
          ? child.getWeight(saturationWeight, pxCount)
          : child.getMaxWeight(saturationWeight, pxCount)
      );

      list.sort((a, b) => b - a);
      this.maxWeight = list[0] || 0;
    }

    return this.maxWeight;
  }

  getMaxWeightColor(saturationWeight: number, pxCount: number): Color {
    const list = this.getList();
    list.sort((a, b) => {
      if (a instanceof Color && b instanceof Color) {
        return (
          b.getWeight(saturationWeight, pxCount) -
          a.getWeight(saturationWeight, pxCount)
        );
      } else if (a instanceof Group && b instanceof Group) {
        return (
          b.getMaxWeight(saturationWeight, pxCount) -
          a.getMaxWeight(saturationWeight, pxCount)
        );
      } else return 0;
    });

    return list[0] instanceof Color
      ? list[0]
      : list[0].getMaxWeightColor(saturationWeight, pxCount);
  }

  getMaxCountColor(): Color {
    const list = this.getList();
    list.sort((a, b) => {
      if (a instanceof Color && b instanceof Color) {
        return b.count - a.count;
      } else if (a instanceof Group && b instanceof Group) {
        return b.getMaxCountColor().count - a.getMaxCountColor().count;
      } else return 0;
    });

    return list[0] instanceof Color ? list[0] : list[0].getMaxCountColor();
  }

  getColors(
    distance: number,
    saturationWeight: number,
    pxCount: number
  ): Color[] {
    const list: Color[] = this.getList()
      .map((child) => {
        const count = child.count;
        if (child instanceof Group) {
          const color = child.getMaxCountColor();
          color.count = count;
          return color;
        } else return child;
      })
      .sort(
        (a, b) =>
          b.getWeight(saturationWeight, pxCount) -
          a.getWeight(saturationWeight, pxCount)
      );

    const newList: Color[] = [];
    list.forEach((color) => {
      const near = newList.find((col) => col.distance(color) < distance);
      near ? (near.count += color.count) : newList.push(color);
    });
    //newList.sort((c1, c2) => return c2.)
    return newList;
  }
}
