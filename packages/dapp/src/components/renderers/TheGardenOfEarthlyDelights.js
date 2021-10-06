/* eslint-disable no-unreachable */
/* eslint-disable no-case-declarations */
import p5 from 'p5';
//import { DrawProps } from '../../types/Renderers';

/**
 * TheGardenOfEarthlyDelights generates a mildly post-apocalyptic landscape,
 * of towers and barbed wires, whose shapes are defined by L-systems.
 */

export default function ({ p5, colors, dim }) {
  /**
   * growAndDrawFractals() draws the fractal and then updates its underlying rule (grows it)
   */
  function growAndDrawFractals(dim, fractalObjects) {
    let still_growing = 0;

    //now cycle through array of fractals, render and grow
    for (let j = 0; j < fractalObjects.length; j++) {
      if (fractalObjects[j].counter < fractalObjects[j].iterations) {
        still_growing = 1;
        //render it
        p5.push();
        p5.translate(fractalObjects[j].y_point, dim.h);
        p5.rotate(-Math.PI / 2);
        fractalObjects[j].turtle.render();
        p5.translate(fractalObjects[j].y_point, dim.h);
        p5.pop();

        //grow it
        p5.push();
        fractalObjects[j].lsys.generate();
        fractalObjects[j].turtle.setToDo(fractalObjects[j].lsys.getSentence());
        fractalObjects[j].turtle.changeLen(0.5);
        p5.pop();
        fractalObjects[j].counter++;
      }
    }
    return still_growing;
  }

  /**
   * plantFractal() finds a point on the screen where the fractal should be planted,
   * and uses that to seed the plant so that the plants are biggest towards the middle of the canvas,
   * smaller towards its sides.
   */
  function plantFractal(colors, dim, max_seeds, fractalObjects) {
    let x_point;
    const wireSeedNum = p5.int(p5.random(1, 8));
    const towerSeedNum = p5.int(p5.random(8, 10));
    //seed a new fractal object, either a wire type or a tower type
    //much of this somewhat messy code is all about making fractals appear
    //tallest in the middle of the canvas, and get smaller towards the edges
    const halfway_max_seeds = max_seeds / 2;
    let this_index; //index of seed adjusted for where it sits in first or second half of total
    //first half of drawing, moving from middle to right, getting shorter as you get to the edge
    if (fractalObjects.length < halfway_max_seeds) {
      //middle to right
      this_index = halfway_max_seeds - fractalObjects.length;
      x_point = dim.w - this_index * (dim.w / 2 / halfway_max_seeds);
    } else {
      this_index =
        halfway_max_seeds - (fractalObjects.length - halfway_max_seeds);
      x_point = this_index * (dim.w / 2 / halfway_max_seeds);
    }

    //seed with more wires than towers
    if (p5.int(p5.random(100) < 75))
      seed(
        wireSeedNum,
        x_point,
        this_index,
        halfway_max_seeds,
        colors,
        dim,
        fractalObjects
      );
    else
      seed(
        towerSeedNum,
        x_point,
        this_index,
        halfway_max_seeds,
        colors,
        dim,
        fractalObjects
      );
  }

  /**
   * getColorForFlatGridRect() handles color picking. The colorIndex parameter represents: the most common color (value=0), the secondary color (value=1),  a tertiary color(s) if they exist (value=2), the darkest color (value=3).
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
          const next_color_total =
            p5.red(colors[i]) + p5.green(colors[i]) + p5.blue(colors[i]);
          if (darkest_color_total > next_color_total) {
            //new darkest color
            darkest_color_index = i;
            darkest_color_total = next_color_total;
          }
        }
        return colors[darkest_color_index];
        break;
    }
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
    let new_total_colors = p5.int(p5.random(0, 255 * 3));
    //set same proportions of each color in the old color for the new color
    let new_color = p5.color(
      (its_red * new_total_colors) / total_colors,
      (its_green * new_total_colors) / total_colors,
      (its_blue * new_total_colors) / total_colors
    );
    return new_color;
  }

  /**
   * seed() picks a type of fractal object, sets its initial rules and parameters, and then adds it to the fractal array.
   * The first 8 types are distorted plants, like towers, and the last two are like barbed wire.
   */
  function seed(
    rule_index,
    y_point,
    seed_index,
    max_seeds,
    colors,
    dim,
    fractalObjects
  ) {
    let a_rule_object;
    let lsys;
    const ruleset = [];
    let total_iterations;
    let num_radians;

    if (rule_index == 0)
      //if the rule-index sent is zero, then set that rule to a random number
      rule_index = p5.int(p5.random(1, 8));
    switch (rule_index) {
      //first set of indexs are towers
      case 1:
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F-[[X]+X]+F[+FX]-X');
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.random(3, 5);
        num_radians = p5.int(p5.random(80, 150));
        if (p5.random(100) > 50) num_radians = -num_radians;
        break;
      case 2:
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F[+X][-X]FX');
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.random(4, 7);
        num_radians = p5.random(80, 170);
        if (p5.random(100) > 50) num_radians = num_radians * -1;
        break;
      case 3:
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F[+X]F[-X]+X');
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.random(3, 6);
        num_radians = p5.random(80, 130);
        if (p5.random(100) > 50) num_radians = num_radians * -1;
        break;
      case 4:
        a_rule_object = new Rule('F', 'F[+F]F[-F][F]');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        total_iterations = p5.random(3, 6);
        num_radians = p5.random(80, 100);
        if (p5.random(100) > 50) num_radians = num_radians * -1;
        break;
      case 5:
        a_rule_object = new Rule('F', 'FF+[+F-F-F]-[-F+F+F]');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        total_iterations = p5.random(2, 4);
        num_radians = p5.random(80, 120);
        if (p5.random(100) > 50) num_radians = num_radians * -1;
        break;

      case 6:
        a_rule_object = new Rule('F', 'F[+F]F[-F]F');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        total_iterations = 5;
        num_radians = p5.random(80, 120); //20
        if (p5.random(0, 100) < 50) num_radians = num_radians * -1;
        break;

      //Wires
      case 7:
        //like cell towers
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F[+X][-X]FX');
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.random(4, 7);
        num_radians = p5.random(80, 90);
        if (p5.random(100) > 50) num_radians = num_radians * -1;
        break;

      case 8: //experimenting with this one!
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F[+XX]F[-XX]+XXXX'); //spiral
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.int(p5.random(5, 6));
        num_radians = 15;
        if (p5.random(0, 100) < 50) num_radians = num_radians * -1;
        break;

      case 9:
        //experimenting with this one!
        a_rule_object = new Rule('F', 'FF');
        ruleset.push(a_rule_object);
        lsys = new LSystem('F', ruleset);
        a_rule_object = new Rule('X', 'F[+X]F[-X]+XXXX');
        ruleset.push(a_rule_object);
        lsys = new LSystem('X', ruleset);
        total_iterations = p5.int(p5.random(5, 7));
        num_radians = 10;
        if (p5.random(0, 100) < 50) num_radians = num_radians * -1;
        break;
      default:
    }

    //adjust height, so that plants get bigger towards the middle of the canvas
    //let max_height = 8;//lower number means taller plant objects
    //scale for size of canvas
    const max_height = p5.int((6 * dim.h) / 250);
    const line_height_divisor = p5.int(
      ((max_seeds - seed_index) * max_height) / max_seeds
    );

    //setting the starting x point for the plant and the length of its initial stem
    const turtle = new Turtle(
      lsys.getSentence(),
      dim.h / line_height_divisor,
      p5.radians(num_radians),
      seed_index,
      colors,
      dim
    );

    //create a fractal object that holds all of this info
    const a_fractalObject = new fractalObject(
      ruleset,
      lsys,
      turtle,
      total_iterations,
      num_radians,
      y_point
    );

    //add that fractal object to the array of fractal objects
    fractalObjects.push(a_fractalObject);
  }

  /**
   * drawHorizon() draws a background polygon that represents a mountain
   */
  function drawHorizon(w, h, this_color) {
    p5.fill(this_color);
    p5.noStroke();
    //shape sits on the bottom half of screen
    p5.beginShape();
    p5.vertex(0, h);
    p5.vertex(0, h - p5.random(h / 4, h / 2));
    p5.vertex(p5.random(w / 4, w / 2), h - p5.random(h / 2, (3 * h) / 4));
    p5.vertex(p5.random(w / 2, (3 * w) / 4), h - p5.random(h / 2, (3 * h) / 4));
    p5.vertex(w, h - p5.random(h / 4, h / 2));
    p5.vertex(w, h);
    p5.endShape(p5.CLOSE);
  }

  /**
   * drawTripTychFrames() draws three frames on top of the scene
   */
  function drawTripTychFrames(w, h) {
    p5.stroke(255);
    p5.noFill();

    //first use sharp edges to get rid of those pesky corners
    //strokeWeight(11);
    //scale strokeWeight
    p5.strokeWeight(p5.int((11 / 750) * w));
    p5.rect(0, 0, w / 4, h);
    p5.rect(w / 4, 0, w / 2, h);
    p5.rect((w * 3) / 4, 0, w / 4, h);

    //now round the edges
    //strokeWeight(9);
    //scale strokeWeight
    p5.strokeWeight(p5.int((9 / 750) * w));
    const curvature = p5.int((30 / 750) * w);
    p5.rect(0, 0, w / 4, h + 50, curvature);
    p5.rect(w / 4, 0, w / 2, h + 50, curvature);
    p5.rect((w * 3) / 4, 0, w / 4, h + 50, curvature);
  }

  /**
   * fractalObject() holds the info for each fractal, like its radians, position, etc.
   */
  class fractalObject {
    constructor(_ruleset, _lsys, _turtle, _iterations, _num_radians, _y_point) {
      this.ruleset = _ruleset;
      this.turtle = _turtle;
      this.lsys = _lsys;
      this.iterations = _iterations;
      this.counter = 0;
      this.num_radians = _num_radians;
      this.y_point = _y_point;
    }
  }

  /**
   * LSystem() holds an axiom, rule and generator of new rules
   */
  class LSystem {
    constructor(axiom, r) {
      this.sentence = axiom;
      this.ruleset = r;
      this.generation = 0;
    }

    generate() {
      let nextgen;
      // For every character in the sentence
      for (let i = 0; i < this.sentence.length; i++) {
        // What is the character
        const curr = this.sentence.charAt(i);
        // We will replace it with itself unless it matches one of our rules
        let replace = '' + curr;
        // Check every rule
        for (let j = 0; j < this.ruleset.length; j++) {
          const a = this.ruleset[j].getA();
          // if we match the Rule, get the replacement String out of the Rule
          if (a == curr) {
            replace = this.ruleset[j].getB();
            break;
          }
        }
        // Append replacement String
        nextgen = nextgen + replace;
      }
      // Replace sentence
      this.sentence = nextgen.toString();
      // Increment generation
      this.generation++;
    }

    getSentence() {
      return this.sentence;
    }

    getGeneration() {
      return this.generation;
    }
  } //end of LSystem()

  /**
   * Rule() is a class that holds the rule that defines a fractal's growth
   */
  class Rule {
    constructor(a_, b_) {
      this.a = a_;
      this.b = b_;
    }

    getA() {
      return this.a;
    }

    getB() {
      return this.b;
    }
  }

  /**
   * Turtle draws the fractal object
   */
  class Turtle {
    constructor(s, l, t, _seed_index, colors, dim) {
      this.todo = s;
      this.len = l;
      this.theta = t;
      this.seed_index = _seed_index;
      //this.color = getColor(this.seed_index);
      this.color = getColor(colors, 2);
      this.thickness = 0.004 * dim.w; //3
    }

    render() {
      const this_color = this.color;
      p5.stroke(this_color);
      p5.strokeWeight(this.thickness);

      for (let i = 0; i < this.todo.length; i++) {
        const c = this.todo.charAt(i);
        if (c == 'F' || c == 'G') {
          p5.line(0, 0, this.len, 0);
          p5.translate(this.len, 0);
        } else if (c == '+') {
          p5.rotate(this.theta);
        } else if (c == '-') {
          p5.rotate(-this.theta);
        } else if (c == '[') {
          p5.push();
        } else if (c == ']') {
          p5.pop();
        }
      }
    }

    setLen(l) {
      this.len = l;
    }

    changeLen(percent) {
      this.len *= percent;
    }

    setToDo(s) {
      this.todo = s;
    }
  }

  /**
   * theGardenOfEarthlyDelights code sets up initial variables, then calls functions to
   * 1. plant fractals into array, and 2. grow and render them
   */
  const max_seeds = 60;
  const fractalObjects = [];

  //first time in, do some initializing
  if (fractalObjects.length == 0) {
    p5.noLoop();
    //get most common color and draw that onto the background
    p5.background(getColor(colors, 0));

    p5.stroke(p5.color(colors[1]));
    p5.ellipse(0, 0, 50, 100);
    //get darkest color and use that for the horizon line
    drawHorizon(dim.w, dim.h, getColor(colors, 3));
  }

  while (fractalObjects.length < max_seeds)
    plantFractal(colors, dim, max_seeds, fractalObjects);

  let still_growing = 1;
  while (still_growing == 1)
    still_growing = growAndDrawFractals(dim, fractalObjects);

  //if planted all the seeds, go ahead and stop looping through this function and draw the triptych frame overlay
  if (fractalObjects.length >= max_seeds) {
    //draw triptych frames on top of everything
    drawTripTychFrames(dim.w, dim.h);
  }
}
