const express = require('express');
const Render = require('./lib/render');
const app = express();
const { Renderers } = require('@splicenft/common');

const port = process.env.PORT || 5999;
app.get('/render/:algo', (req, res) => {
  const renderer = Renderers[req.params.algo];
  console.log(req.params.algo, renderer);
  Render(renderer, res);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
