const p5 = require('p5js-node');

/**
 * @param {*} renderer
 * @param {*} drawProps {colors: number[][], dim:{w, h}, randomness: number }
 * @param {*} callback
 */
module.exports = (renderer, drawProps, callback) => {
  new p5((p5) => {
    p5.setup = function () {
      p5.createCanvas(drawProps.dim.w, drawProps.dim.h);
      if (drawProps.randomness) {
        p5.randomSeed(drawProps.randomness);
      }
    };

    p5.draw = function () {
      try {
        renderer({
          p5,
          dim: drawProps.dim,
          colors: drawProps.colors
        });

        //setTimeout(() => {
        callback(null, p5.canvas.toBuffer('image/png'));
        //}, 250);
      } catch (e) {
        callback(e, null);
      }
    };
  });
};
