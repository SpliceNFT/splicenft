function splice({ p5, params, dim }) {
  // all your code must go inside this function.
  const { colors, nftItem } = params;
  let y = dim.h;
  for (let color of colors) {
    // colors[].color is a p5 color
    p5.fill(color.color);
    p5.strokeWeight(0);
    y = y - color.freq * dim.h;
    p5.rect(0, y, dim.w, color.freq * dim.h);
  }

  p5.textSize(32);
  p5.fill(colors[2].color);
  p5.text(nftItem.metadata.name, 10, 30);

  const trait1 = {
    trait_type: 'Favorite_Pet',
    value: p5.random() > 0.5 ? 'Cat' : 'Dog'
  };
  const trait2 = {
    trait_type: 'Favorite_Food',
    value: p5.random() > 0.8 ? 'Broccoli' : 'Marshmallow'
  };
  return [trait1, trait2];
}
