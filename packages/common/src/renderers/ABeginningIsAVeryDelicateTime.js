/* eslint-disable no-unreachable */
/* eslint-disable no-case-declarations */
import p5 from 'p5';

/**
 * ABeginningIsAVeryDelicateTime is a nod to the otherworldly landscape of the book (and movie!) Dune.
 */

export default function ({ p5, colors, dim }) {
  /**
   * drawWaves() draws horizontal waves of color, across the canvas, more ripples towards the bottom of the screen to give a sense of depth.
   */
  function drawWaves(
    ordered_color_array,
    waves_height,
    canvas_dim,
    max_colors_waves
  ) {
    const height_of_stripe = canvas_dim.h / ordered_color_array.length;
    let wave_colors = [];

    //because too many stripes looks terrible, I'm limiting the number to 5 of the lightest colors
    if (ordered_color_array.length > max_colors_waves)
      wave_colors = p5.subset(
        ordered_color_array,
        ordered_color_array.length - 1 - max_colors_waves,
        ordered_color_array.length
      );
    else wave_colors = ordered_color_array;

    const stripe_width =
      (canvas_dim.h - waves_height) / (wave_colors.length - 1);

    for (let i = wave_colors.length - 1; i > 0; i--) {
      p5.fill(wave_colors[i]);
      p5.noStroke();

      //create array of vertexes
      const this_curvey_line_y_pnt =
        waves_height + (wave_colors.length - 1 - i) * stripe_width;
      const num_points_increment = 5;
      const percentage_variation = 60;
      const arrayOfPointsForCurveyLine = createArrayOfPointsForCurveyLine(
        1,
        percentage_variation,
        stripe_width,
        (wave_colors.length - i) * num_points_increment,
        this_curvey_line_y_pnt,
        canvas_dim
      );

      //draw curvey array of vertexes with fully saturated color
      p5.beginShape();
      for (
        let vertex_counter = 0;
        vertex_counter < arrayOfPointsForCurveyLine.length;
        vertex_counter++
      ) {
        p5.curveVertex(
          arrayOfPointsForCurveyLine[vertex_counter].x,
          arrayOfPointsForCurveyLine[vertex_counter].y
        );
      }
      p5.endShape(p5.CLOSE);

      //now draw darkening lines in that color, to give the shape shading
      const shade_spacing = 1;
      const shade_increment = 0.5;
      for (
        let shade_counter = 0;
        shade_counter < stripe_width * 2;
        shade_counter += shade_spacing
      ) {
        //draw a darker version of that shape
        p5.fill(
          getDarkerOrLighterVersionOfColor(
            wave_colors[i],
            1,
            shade_counter * shade_increment
          )
        );
        p5.beginShape();
        for (
          let vertex_counter = 0;
          vertex_counter < arrayOfPointsForCurveyLine.length;
          vertex_counter++
        ) {
          p5.curveVertex(
            arrayOfPointsForCurveyLine[vertex_counter].x,
            arrayOfPointsForCurveyLine[vertex_counter].y + shade_counter
          );
        }
        p5.endShape(p5.CLOSE);
      }
    }
  }

  /**
   * drawMoons() draws big moons onto the sky
   */
  function drawMoons(
    num_moons,
    ordered_color_array,
    sky_height,
    sky_width,
    ascending_size_flag
  ) {
    let this_moon_color;
    for (let moon_counter = 0; moon_counter < num_moons; moon_counter++) {
      let moon_color_index;
      //pick colors depending on how many colors are in the palette
      switch (ordered_color_array.length) {
        case 2:
          moon_color_index = 1;
          this_moon_color = getDarkerOrLighterVersionOfColor(
            ordered_color_array[moon_color_index],
            coinFlip(),
            p5.random(75)
          );
          break;
        case 3:
          moon_color_index = 1 + moon_counter;
          this_moon_color = getDarkerOrLighterVersionOfColor(
            ordered_color_array[moon_color_index],
            coinFlip(),
            p5.random(50)
          );
          break;
        default:
          moon_color_index =
            1 + p5.round(p5.random(ordered_color_array.length - 3));
          //fix it if index is too high, beyond array
          if (moon_color_index > ordered_color_array.length - 1)
            moon_color_index = ordered_color_array.length - 1;
          this_moon_color = ordered_color_array[moon_color_index];
          break;
      }

      let moon_diameter;
      //set diameter and account for different sized canvases
      if (ascending_size_flag) {
        moon_diameter = p5.random(
          (150 * sky_width) / 1500 + ((60 * sky_width) / 1500) * moon_counter,
          (200 * sky_width) / 1500 + ((60 * sky_width) / 1500) * moon_counter
        );
      } else {
        moon_diameter = p5.random(
          (150 * sky_width) / 1500 - ((60 * sky_width) / 1500) * moon_counter,
          (200 * sky_width) / 1500 - ((60 * sky_width) / 1500) * moon_counter
        );
      }
      let moon_y_pnt = p5.random(75, sky_height - 75);
      //spread them out horizontally
      let direction = coinFlip();
      let moon_x_pnt =
        (sky_width / num_moons) * moon_counter +
        sky_width / num_moons / 2 +
        direction * p5.random(moon_diameter / 4);
      //now draw darkening lines in that color, to give the shape shading
      const shade_spacing = 1;
      const shade_increment = 0.2;
      const number_of_shade_iterations = moon_diameter / 2;
      //get a darker version of the target color
      const starting_color = getDarkerOrLighterVersionOfColor(
        this_moon_color,
        1,
        number_of_shade_iterations * shade_increment * 2
      );

      //const stripe_width
      for (
        let shade_counter = 0;
        shade_counter < number_of_shade_iterations;
        shade_counter += shade_spacing
      ) {
        p5.fill(
          getDarkerOrLighterVersionOfColor(
            this_moon_color,
            0,
            shade_counter * shade_increment
          )
        );
        p5.ellipse(
          moon_x_pnt,
          moon_y_pnt - shade_counter / 4,
          moon_diameter - shade_counter / 4,
          moon_diameter - shade_counter
        );
      }
    }
  }

  /**
   * drawStars() draws a bunch of little stars in the sky
   */
  function drawStars(num_stars, ordered_color_array, sky_height, sky_width) {
    //somewhat evenly spaced
    const num_cols = p5.round(num_stars / 4);
    const num_rows = p5.round(num_stars / num_cols) + 5;
    const col_spacing = sky_width / num_cols + 1;
    const row_spacing = sky_height / num_rows;
    let this_star_color;

    for (let col_counter = 0; col_counter < num_cols; col_counter++) {
      for (let row_counter = 0; row_counter < num_rows; row_counter++) {
        let random_color_index_not_darkest;
        let this_star_color;
        switch (ordered_color_array.length) {
          case 2:
            random_color_index_not_darkest = 1;
            this_star_color = getDarkerOrLighterVersionOfColor(
              ordered_color_array[random_color_index_not_darkest],
              coinFlip(),
              p5.random(50)
            );
            break;
          case 3:
            if (coinFlip() == 1) random_color_index_not_darkest = 1;
            else random_color_index_not_darkest = 2;
            this_star_color = getDarkerOrLighterVersionOfColor(
              ordered_color_array[random_color_index_not_darkest],
              coinFlip(),
              p5.random(50)
            );
            break;
          default:
            random_color_index_not_darkest = p5.round(
              p5.random(1, ordered_color_array.length - 1)
            );
            this_star_color =
              ordered_color_array[random_color_index_not_darkest];
            break;
        }

        let star_y_pnt =
          row_counter * row_spacing + p5.random(row_spacing / 2) * coinFlip();
        //spread them out horizontally
        let star_x_pnt =
          col_counter * col_spacing + p5.random(col_spacing / 2) * coinFlip();
        //set diameter and account for different sized canvases
        let star_diameter = p5.floor(
          p5.random((2 * sky_width) / 1500, (10 * sky_width) / 1500)
        );
        p5.fill(this_star_color);
        p5.ellipse(star_x_pnt, star_y_pnt, star_diameter, star_diameter);
      }
    }
  }

  /**
   * coinFlip() just returns a 1 or -1, with a 50% probability of either
   */
  function coinFlip() {
    if (p5.random(10) >= 5) return 1;
    else return -1;
  }

  /**
   * randomNegOrPositiveNum() generates a random number that's randomly positive or negative
   */
  function randomNegOrPositiveNum(min, max) {
    let random_num = p5.round(p5.random(min, max));
    if (p5.random(100) > 50) random_num = random_num * -1;
    return random_num;
  }

  /**
   * createArrayOfPointsForCurveyLine() creates an array of points across the canvas, either horizontally or vertically,
   * depending on the horizontal_flag parameter. The percentage_variation dictates how much below or above
   * (or left or right, when it's a vertical line) a point in the array can drift above or below the start_point.
   */
  function createArrayOfPointsForCurveyLine(
    horizontal_flag,
    percentage_variation,
    width_of_line,
    max_points,
    start_point,
    dim
  ) {
    let anArrayOfPoints = [];
    const num_points = max_points;
    const dist_btwn_pnts = dim.w / num_points;

    anArrayOfPoints.push(new PointLocation(0, dim.h));
    for (let i = 0; i <= num_points; i++) {
      const the_y =
        start_point +
        randomNegOrPositiveNum(1, (percentage_variation / 100) * width_of_line);
      let the_x;
      if (i > 0)
        the_x =
          i * dist_btwn_pnts +
          p5.random(p5.round(dist_btwn_pnts / 2), dist_btwn_pnts);
      else the_x = i * dist_btwn_pnts;

      const the_point = new PointLocation(the_x, the_y);
      anArrayOfPoints.push(the_point);
    }
    anArrayOfPoints.push(new PointLocation(dim.w, dim.h));
    return anArrayOfPoints;
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
   * getRGBSum(this_color) sums the RGB values for a color
   */
  function getRGBSum(this_color) {
    return p5.red(this_color) + p5.green(this_color) + p5.blue(this_color);
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
   * getColor() handles color picking. The colorIndex parameter represents: the most common color (value=0), the secondary color (value=1),  a tertiary color(s) if they exist (value=2), the darkest color (value=3).
   */
  function getColor(colors, colorIndex) {
    let num_tertiary_colors;
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
        let r = p5.floor(p5.random(num_tertiary_colors));
        return colors[1 + r];
        break;
      case 3:
        //get the darkest color start as the second in the array, after the most common one
        let darkest_color_index = 1;
        let darkest_color_total =
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
        let random_color = p5.floor(p5.random(num_tertiary_colors));
        return colors[random_color];
        break;
    }
  }

  /**
   * getDarkerOrLighterVersionOfColor() takes a color as input and sends back a darker or lighter version of it
   */
  function getDarkerOrLighterVersionOfColor(
    a_color,
    darker_flag,
    percentage_darker
  ) {
    let its_red = p5.red(a_color);
    let its_green = p5.green(a_color);
    let its_blue = p5.blue(a_color);
    let incremental_change;

    if (darker_flag) {
      incremental_change = (percentage_darker / 100) * its_red;
      its_red -= incremental_change;
      incremental_change = (percentage_darker / 100) * its_green;
      its_green -= incremental_change;
      incremental_change = (percentage_darker / 100) * its_blue;
      its_blue -= incremental_change;
    } else {
      incremental_change = (percentage_darker / 100) * (255 - its_red);
      its_red += incremental_change;
      incremental_change = (percentage_darker / 100) * (255 - its_green);
      its_green += incremental_change;
      incremental_change = (percentage_darker / 100) * (255 - its_blue);
      its_blue += incremental_change;
    }
    return p5.color(its_red, its_green, its_blue);
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
   * aBeginningIsAVeryDelicateTime() reorders a palette of colors to go from darkest to lightest,
   * sections off the canvas so that the upper section is filled with the darkest color,
   * and then draws shaded strokes, of every other color in the palette, with those strokes becoming flatter as
   * they move up the canvas.
   */
  const orderedColorArray = reOrderColorsDarkestToLightest(colors);
  const height_of_stripe = dim.h / orderedColorArray.length;
  //draw darkest color on the top rect of vertical golden mean
  const rect_and_square_width = dim.h;
  const sqr_width = rect_and_square_width / 1.618;
  const rect_width = rect_and_square_width - sqr_width;

  p5.noStroke();
  //make the background the darkest color
  p5.background(orderedColorArray[0]);
  p5.noLoop();

  drawStars(150, orderedColorArray, dim.h, dim.w);
  drawMoons(2, orderedColorArray, rect_width, dim.w, 1);
  drawWaves(orderedColorArray, rect_width, dim, 5);
}
