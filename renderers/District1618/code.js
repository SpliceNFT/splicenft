/* eslint-disable no-unreachable */

/**
 * District 1618 generates a panel of shapes based on the golden mean (1.618)
 */

function ({ p5, colors, dim }) {
  /**
   * layoutGridOnPartOfCanvas() takes a series of shrinking rectangles (an array of goldenMeanRects)
   * and positions them as a grid on the canvas. The grid is defined by a designated starting point (start_pnt) and
   * with a given width and height (grid_dim)
   */
  function layoutGridOnPartOfCanvas(
    goldenMeanRectArray,
    grid_dim,
    start_pnt,
    colors
  ) {
    const total_rows = p5.floor(grid_dim.h / goldenMeanRectArray[0].sqr_width);
    const length_of_largest_width =
      goldenMeanRectArray[0].sqr_width + goldenMeanRectArray[0].rect_width;
    const total_cols = p5.round(grid_dim.w / length_of_largest_width);
    const horiz_margin =
      (grid_dim.w - total_cols * length_of_largest_width) / 2;
    const vert_margin =
      (grid_dim.h - total_rows * goldenMeanRectArray[0].sqr_width) / 2;

    p5.push();
    p5.translate(start_pnt.x, start_pnt.y);
    //loop through grid
    for (let row = 0; row < total_rows; row++) {
      for (let col = 0; col < total_cols; col++) {
        center_point = new PointLocation(
          horiz_margin +
            col * length_of_largest_width +
            length_of_largest_width / 2,
          vert_margin +
            row * goldenMeanRectArray[0].sqr_width +
            goldenMeanRectArray[0].sqr_width / 2
        );
        drawDrosteEffect(goldenMeanRectArray, center_point, colors);
      }
    }
    p5.pop();
  }

  /**
   * drawDrosteEffect() draws a series of shrinking rectangles to a particular point (the rect's center_point) on the canvas
   */
  function drawDrosteEffect(goldenMeanRectArray, center_point, colors) {
    for (let i = 0; i < goldenMeanRectArray.length; i++) {
      const a_GoldenMeanRect = goldenMeanRectArray[i];
      //draw it
      p5.push();
      const width_of_sqr_and_rect =
        a_GoldenMeanRect.sqr_width + a_GoldenMeanRect.rect_width;
      p5.translate(
        center_point.x - width_of_sqr_and_rect / 2,
        center_point.y - a_GoldenMeanRect.sqr_width / 2
      );
      p5.fill(getColor(colors, 4));
      a_GoldenMeanRect.renderSqr();
      p5.fill(getColor(colors, 4));
      a_GoldenMeanRect.renderRect();
      p5.pop();
    }
  }

  /**
   * GoldenMeanRect is a class that holds the vertexes of the square and rect that make up
   * a rect with golden mean dimensions
   */
  class GoldenMeanRect {
    constructor(x_, y_, length_) {
      this.sqr_width = length_;
      this.sqrVertexArray = [];

      //sqr points
      this.sqrVertexArray.push(new PointLocation(x_, y_));
      this.sqrVertexArray.push(new PointLocation(x_, y_ + length_));
      this.sqrVertexArray.push(new PointLocation(x_ + length_, y_ + length_));
      this.sqrVertexArray.push(new PointLocation(x_ + length_, y_));

      //rect points
      this.rectVertexArray = [];
      this.rect_width =
        p5.sqrt(p5.sq(length_) + p5.sq(length_ / 2)) - length_ / 2;
      this.rectVertexArray.push(new PointLocation(x_ + length_, y_));
      this.rectVertexArray.push(new PointLocation(x_ + length_, y_ + length_));
      this.rectVertexArray.push(
        new PointLocation(x_ + length_ + this.rect_width, y_ + length_)
      );
      this.rectVertexArray.push(
        new PointLocation(x_ + length_ + this.rect_width, y_)
      );
    }

    renderSqr() {
      p5.beginShape();
      for (let i = 0; i < this.sqrVertexArray.length; i++) {
        p5.vertex(this.sqrVertexArray[i].getX(), this.sqrVertexArray[i].getY());
      }
      p5.endShape(p5.CLOSE);
    }
    renderRect() {
      //first draw sqr
      p5.beginShape();
      for (let i = 0; i < this.rectVertexArray.length; i++) {
        p5.vertex(
          this.rectVertexArray[i].getX(),
          this.rectVertexArray[i].getY()
        );
      }
      p5.endShape(p5.CLOSE);
    }
  }

  /**
   * PointLocation a handy class for holding the location of a point on the canvas
   */
  class PointLocation {
    constructor(x_, y_) {
      this.x = x_;
      this.y = y_;
    }

    getX() {
      return this.x;
    }

    getY() {
      return this.y;
    }
  }

  /**
   * Dimension is a class that holds width and height info. Not sure why I haven't written this class before.
   */
  class Dimension {
    constructor(w_, h_) {
      this.w = w_;
      this.h = h_;
    }

    getW() {
      return this.w;
    }

    getH() {
      return this.h;
    }
  }

  /**
   * getColor() handles color picking. The colorIndex parameter represents: the most common color (value=0), the secondary color (value=1),  a tertiary color(s) if they exist (value=2), the darkest color (value=3).
   */
  function getColor(colors, colorIndex) {
    let num_tertiary_colors,
      r,
      darkest_color_index,
      darkest_color_total,
      random_color;

    switch (colorIndex) {
      case 0:
        //possibly the background color
        return colors[0];
        break;
      case 1:
        //most common color, not background
        //if it's black, let's make it gray so it appears on our black background
        if (
          p5.red(colors[1]) == 0 &&
          p5.green(colors[1]) == 0 &&
          p5.blue(colors[1]) == 0
        )
          return p5.color(75, 75, 75);
        else return colors[1];
        break;
      case 2:
        //any of the colors except the background one
        //if there are just 2 colors then send back the second one
        if (colors.length == 2) {
          return getLikeColor(colors[1]);
        }
        num_tertiary_colors = colors.length - 1;
        r = p5.floor(p5.random(num_tertiary_colors));
        return colors[1 + r];
        break;
      case 3:
        //get the darkest color start as the second in the array, after the most common one
        darkest_color_index = 1;
        darkest_color_total =
          p5.red(colors[1]) + p5.green(colors[1]) + p5.blue(colors[1]);
        for (let i = 2; i < colors.length; i++) {
          let next_color_total =
            p5.red(colors[i]) + p5.green(colors[i]) + p5.blue(colors[i]);
          if (darkest_color_total > next_color_total) {
            //new darkest color
            darkest_color_index = i;
            darkest_color_total = next_color_total;
          }
        }
        return colors[darkest_color_index];
        break;
      case 4:
        //any color, including background color, selected randomly
        if (colors.length == 2) {
          return getLikeColor(colors[1]);
        } else {
          if (colors.length == 3) {
            if (p5.random(100) < 50) return getLikeColor(getColor(colors, 3));
          }
        }
        num_tertiary_colors = colors.length;
        random_color = p5.floor(p5.random(num_tertiary_colors));
        return colors[random_color];
        break;
    }
  }

  /**
   * getRGBSum(this_color) sums the RGB values for a color
   */
  function getRGBSum(this_color) {
    return p5.red(this_color) + p5.green(this_color) + p5.blue(this_color);
  }

  /**
   * getLikeColor() calculates a color that's more or less saturated than the input color
   */
  function getLikeColor(a_color) {
    let its_red = p5.red(a_color);
    let its_green = p5.green(a_color);
    let its_blue = p5.blue(a_color);
    let total_colors = its_red + its_green + its_blue;
    if (total_colors == 0) {
      //if it's black, need to set so that total isn't zero
      its_red = 10;
      its_green = 10;
      its_blue = 10;
      total_colors = its_red + its_green + its_blue;
    }
    //if it's a light color, get a like color that's darker
    const new_total_colors = p5.round(p5.random(0, 255 * 3));
    //set same proportions of each color in the old color for the new color
    const new_color = p5.color(
      (its_red * new_total_colors) / total_colors,
      (its_green * new_total_colors) / total_colors,
      (its_blue * new_total_colors) / total_colors
    );
    return new_color;
  }

  /**
   * reOrderColorsDarkestToLightest() takes an array of colors and sends back an array ordered darkest to lightest
   */
  function reOrderColorsDarkestToLightest(colors) {
    let orderedColors = [];
    let rgbSumOfColorsArray = [];

    //not sure I can use the p5js copy function so I'll just do it myself
    for (let i = 0; i < colors.length; i++) {
      rgbSumOfColorsArray.push(getRGBSum(colors[i]));
    }

    //cycle through colors, and get darkest
    while (orderedColors.length < colors.length) {
      //initialize with the first color in the rgbSumOfColorsArray
      let sum_of_darkest_remaining_color;
      let index_of_darkest_remaining_color;
      let index_sum_of_color;
      //get the first color in the array
      for (let i = 0; i < rgbSumOfColorsArray.length; i++) {
        if (rgbSumOfColorsArray[i] != -1) {
          sum_of_darkest_remaining_color = rgbSumOfColorsArray[i];
          index_of_darkest_remaining_color = i;
          break;
        }
      }

      for (let i = 0; i < rgbSumOfColorsArray.length; i++) {
        index_sum_of_color = rgbSumOfColorsArray[i];
        if (
          sum_of_darkest_remaining_color > index_sum_of_color &&
          index_sum_of_color != -1
        ) {
          sum_of_darkest_remaining_color = index_sum_of_color;
          index_of_darkest_remaining_color = i;
        }
      }

      //found the darkest remaining color
      //add it to the new order array
      orderedColors.push(colors[index_of_darkest_remaining_color]);

      //set the array index to a dummy number
      rgbSumOfColorsArray[index_of_darkest_remaining_color] = -1;
    }
    return orderedColors;
  }

  /**
   * district1618() is where an array of arrays, of grids of golden mean rectangles is built,
   * cycled through as a grid, and then drawn.
   */
  const arrayOfGoldenMeanRectArray = [];
  let center_point;
  let grid_dim;
  let start_pnt;
  let customized_order_of_drawing = [];
  const total_shrinking_sqrs = 3; //how many rects in each droste effect
  const num_cols_across_grid_array = [10, 6, 10];

  p5.noLoop();
  const orderedColorArray = reOrderColorsDarkestToLightest(colors);
  p5.background(orderedColorArray[0]);

  //build an array of grids, in this case, three grids that will be drawn across the screen
  //get the sqr_width for each of these grids, then create shrinking rects
  for (
    let grid_counter = 0;
    grid_counter < num_cols_across_grid_array.length;
    grid_counter++
  ) {
    const rect_and_square_width =
      dim.w / num_cols_across_grid_array[grid_counter];
    //let rect_and_square_width = dim.w/num_cols_across_grid;
    let sqr_width = rect_and_square_width / 1.618;
    const goldenMeanRectArray = [];
    //create an array of shrinking goldenMeanRects
    for (let i = 0; i < total_shrinking_sqrs; i++) {
      const a_GoldenMeanRect = new GoldenMeanRect(0, 0, sqr_width);
      goldenMeanRectArray.push(a_GoldenMeanRect);
      sqr_width = a_GoldenMeanRect.rect_width;
    }
    arrayOfGoldenMeanRectArray.push(goldenMeanRectArray);
  }

  p5.noStroke();
  customized_order_of_drawing = [0, 2, 1]; //here I want to draw the middle third grid last, so it sits on top

  //cycle through the array of grids and send each away to be drawn
  for (
    let grid_index = 0;
    grid_index < customized_order_of_drawing.length;
    grid_index++
  ) {
    const grid_counter = customized_order_of_drawing[grid_index];
    grid_dim = new Dimension(dim.w / arrayOfGoldenMeanRectArray.length, dim.h);
    start_pnt = new PointLocation(
      grid_counter * (dim.w / arrayOfGoldenMeanRectArray.length),
      0
    );
    layoutGridOnPartOfCanvas(
      arrayOfGoldenMeanRectArray[grid_counter],
      grid_dim,
      start_pnt,
      orderedColorArray
    );
  }
}
