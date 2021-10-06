const p5 = require('p5js-node');

module.exports = (req, res) => {
  new p5((p) => {
    p.setup = function () {
      p.createCanvas(1920, 1080);
    };

    p.draw = function () {
      p.background(0);
      p.fill(80);
      p.rect(10, 10, 50, 50);
      p.noLoop();
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(p.canvas.toBuffer());
    };
  });
};
