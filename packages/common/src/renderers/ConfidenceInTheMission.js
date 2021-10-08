import p5 from 'p5';

/**
 * ConfidenceInTheMission generates an abstraction of the interior of HAL, from 2001 Space Odyssey.
 * It draws two grids of rectangles on top of one another:
 * 1. a main grid that angles with one-point perspective, has a wide dark gap in the vertical middle,
 * and fades in towards the vertical middle of the canvas and
 * 2. a grid that's flat, fully saturated, and displays blocks of rects of various colors.
 */
export default function ({ p5, colors, dim }) {
  p5.noLoop();
  /**
   * getColorForFlatGridRect() handles all color picking. The colorIndex parameter represents: the most common color (value=0), the secondary color (value=1) and the tertiary color(s) if they exist (value=2).
   */
  const getColorForFlatGridRect = (colorIndex) => {
    let num_tertiary_colors;
    let r;
    switch (colorIndex) {
      case 0:
        //possibly the background color
        return p5.color(colors[0]);
        break;
      case 1:
        //most common color, not background
        //if it's black, let's make it gray so it appears on our black background
        if (
          p5.red(colors[1]) == 0 &&
          p5.green(colors[1]) == 0 &&
          p5.blue(colors[1]) == 0
        ) {
          return p5.color(75, 75, 75);
        } else {
          return p5.color(colors[1]);
        }
        break;
      case 2:
        //the rest of the colors beyond the background and most common color
        //if there are just 2 colors then send back the second one
        if (colors.length == 2) return p5.color(colors[1]);
        num_tertiary_colors = colors.length - 2;
        r = p5.floor(p5.random(num_tertiary_colors));
        return p5.color(colors[2 + r]);
        break;
    }
    return p5.color(100, 100, 100); //some default
  };

  /**
   * getAlpha() calculates the alpha level of colors for the main grid index that fades into the vertical middle of the field
   */
  const getAlpha = (grid_index) => {
    let alpha;
    const max_alpha = 255;
    const min_alpha = 50;
    const range = max_alpha - min_alpha;
    if (grid_index < 0.5) {
      alpha = min_alpha + range - 2 * grid_index * range;
    } else {
      alpha = min_alpha + range - 2 * (1 - grid_index) * range;
    }
    return alpha;
  };

  //lay out the basics
  p5.background(0); //background is always black
  p5.smooth();
  const stroke_size = p5.floor(dim.w / 187);
  p5.strokeWeight(stroke_size);
  p5.stroke(0);

  //setting variable for the main grid, that fades in towards the horizonal middle of the canvas, and displays the most common color of the seed NFT, usually its background color
  const horiz_space = p5.floor(dim.w / 75);
  const vert_space = p5.floor(dim.h / 17.8);
  const quad_width = p5.round(dim.w / 37.5);
  const quad_height = p5.round(dim.h / 7.2);
  const num_columns = dim.w / (quad_width + horiz_space);
  const num_rows = dim.h / (quad_height + vert_space);
  const max_horiz_shift = 10;
  const horiz_shift_increment = max_horiz_shift / (num_columns / 2);
  const additional_horizontal_columns =
    (((num_rows / 2) * max_horiz_shift) / (quad_width + horiz_space)) * 2;
  const num_dark_cols_in_center_row = 3; //center vertical
  const num_of_flat_grid_middle_horizontal_center_rows = 3; //this lets me make the flat grid float in the middle of the field

  //setting variables for fully saturated flat grid
  const flat_horiz_space = p5.floor(dim.w / 187.5);
  const flat_vert_space = p5.floor(dim.h / 25);
  const flat_quad_width = p5.round(dim.w / 50);
  const height_of_flat =
    num_of_flat_grid_middle_horizontal_center_rows *
    2 *
    (quad_height + vert_space);
  const flat_quad_height = p5.round(dim.h / 5.86);
  const flat_num_columns = p5.floor(
    dim.w / (flat_quad_width + flat_horiz_space)
  );
  const flat_num_rows = p5.floor(
    height_of_flat / (flat_quad_height + flat_vert_space)
  );
  const flat_horiz_margin =
    (height_of_flat - flat_num_rows * (flat_quad_height + flat_vert_space)) / 2;
  //this set of variables for the flat grid, that controls when a series of rects in a row are colored a certain way, or not at all
  //for cols
  const flat_frequency_of_background_color_col = 10; //for dark cols, the higher this number, the less frequent
  let flat_background_color_col_flag = 0; //a flag that's set when a column is dark
  //for rows
  let flat_background_color_num_rows = 0; //the number of rows in a block of color
  let flat_background_color_num_rows_color; //the color of the block of color

  let this_color = p5.color(100, 100, 100);

  //cycle through rows for the flat grid first, before the main grid
  for (let row_counter = 0; row_counter < flat_num_rows; row_counter++) {
    p5.push();
    //set to draw at the top left
    p5.translate(
      0,
      flat_horiz_margin +
        (num_rows / 2 - num_of_flat_grid_middle_horizontal_center_rows) *
          (quad_height + vert_space) +
        row_counter * (flat_quad_height + flat_vert_space)
    );

    //cycle through columns for the flat grid
    for (let col_counter = 0; col_counter < flat_num_columns; col_counter++) {
      //here begins a mess of code that's all about creating a HAL-like pattern of colors, with blocks of varous colors and negative spaces
      //add dark cols at a designated increment
      flat_background_color_col_flag = 0;
      //check to see if it's a dark column
      if (col_counter % flat_frequency_of_background_color_col == 0) {
        flat_background_color_col_flag = 1;
        flat_background_color_num_rows = 0;
        //if it's a dark column, then create a short row of random length of tertiary color
        if (p5.floor(p5.random(4)) > 0) {
          flat_background_color_num_rows = p5.int(
            p5.random(1, flat_frequency_of_background_color_col - 2)
          );
        }
        //get a tertiary color for that row
        flat_background_color_num_rows_color = getColorForFlatGridRect(2);
      }
      if (flat_background_color_col_flag == 1)
        //just a dummy transparent color to create gaps
        this_color = p5.color(0, 0, 0, 0);
      //else
      //it's a tertiarty color rect
      else if (flat_background_color_num_rows > 0) {
        flat_background_color_num_rows--;
        this_color =
          flat_background_color_num_rows_color || p5.color(120, 120, 120);
      }
      //it's just a secondary color rect
      else this_color = getColorForFlatGridRect(1);
      //that's the end of the mess that creates a HAL-like pattern

      p5.fill(this_color);
      p5.quad(
        0,
        0,
        0,
        flat_quad_height,
        flat_quad_width,
        flat_quad_height,
        flat_quad_width,
        0
      );

      //shift over to the next rect to draw
      p5.translate(flat_quad_width + flat_horiz_space, 0);
    }
    p5.pop();
  }

  //cycle through rows for the main grid
  //adjust for angle of rects by adding additional columns on either side of the grid
  for (
    let col_counter = -1 * additional_horizontal_columns;
    col_counter < num_columns + additional_horizontal_columns;
    col_counter++
  ) {
    p5.push();
    p5.translate(col_counter * (quad_width + horiz_space), 0);

    //cycle through rows
    for (let row_counter = 0; row_counter < num_rows; row_counter++) {
      //add dark vertical HAL-like middle column
      if (
        col_counter < num_columns / 2 + num_dark_cols_in_center_row &&
        col_counter > num_columns / 2 - num_dark_cols_in_center_row
      )
        //this middle column gets a dummy color
        this_color = p5.color(0, 0, 0, 0);
      else {
        //the rest of the rects get the most common color, usually the background color
        this_color = getColorForFlatGridRect(0);
        //get alpha fade-in for color

        this_color.setAlpha(getAlpha(row_counter / num_rows)); //STEFAN - SHOULD WE ADD P5. BEFORE this_color.setAlpha?
      }

      p5.fill(this_color);

      //get the direction of the tilted rect right for each quadrant of the grid
      //top half
      let shift_dir = -1;
      if (row_counter < num_rows / 2) shift_dir = 1;
      //left side
      if (col_counter < num_columns / 2) {
        p5.quad(
          0,
          0,
          shift_dir * ((num_columns / 2 - col_counter) * horiz_shift_increment),
          quad_height,
          shift_dir *
            ((num_columns / 2 - col_counter) * horiz_shift_increment) +
            quad_width,
          quad_height,
          quad_width,
          0
        );
        p5.translate(
          shift_dir * ((num_columns / 2 - col_counter) * horiz_shift_increment),
          quad_height + vert_space
        );
      } else {
        //draw the rect already!
        p5.quad(
          0,
          0,
          shift_dir *
            -((col_counter - num_columns / 2) * horiz_shift_increment),
          quad_height,
          shift_dir *
            -((col_counter - num_columns / 2) * horiz_shift_increment) +
            quad_width,
          quad_height,
          quad_width,
          0
        );

        //move to the next rect
        p5.translate(
          shift_dir *
            -((col_counter - num_columns / 2) * horiz_shift_increment),
          quad_height + vert_space
        );
      }
    }
    p5.pop();
  }
}
