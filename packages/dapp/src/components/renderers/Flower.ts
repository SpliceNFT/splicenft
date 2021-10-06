import { DrawProps } from '../../types/Renderers';

export default function ({ p5, colors, dim }: DrawProps) {
  const primaryColor = colors[0];

  p5.background(p5.color(primaryColor[0], primaryColor[1], primaryColor[2]));

  const otherColors = colors.filter((c, i) => i != 0);
  // A design for a simple flower
  p5.translate(dim.w / 2, dim.h / 2);
  p5.noStroke();
  for (let i = 0; i < 10; i++) {
    const color = otherColors[i % otherColors.length];
    p5.fill(p5.color(color[0], color[1], color[2]));
    p5.ellipse(0, 0, 50, dim.w / 1.2);
    p5.rotate(p5.PI / 10);
  }
  p5.noLoop();
}
