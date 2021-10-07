const p5 = require('p5js-node');

module.exports = (renderer, res) => {
  new p5((p) => {
    p.setup = function () {
      p.createCanvas(1500, 500);
    };

    p.draw = function () {
      let error = null;
      try {
        renderer({
          p5: p,
          dim: { w: 1500, h: 500 },
          colors: [
            [20, 30, 40],
            [80, 80, 80],
            [100, 100, 100],
            [150, 150, 150],
            [175, 175, 175],
            [200, 200, 200],
            [220, 220, 220],
            [250, 250, 250]
          ]
        });

        setTimeout(() => {
          if (error) return;
          res.set('Content-Type', 'image/png');
          res.status(200);
          res.send(p.canvas.toBuffer());
        }, 250);
      } catch (e) {
        error = e;
        res.status(500).end();
      }
    };
  });
};
