const express = require('express');
const Render = require('./lib/render');
const app = express();
const { Renderers } = require('@splicenft/common');

const port = process.env.PORT || 5999;
app.get('/render/:algo', (req, res) => {
  const renderer = Renderers[req.params.algo];
  if (!renderer) return res.status(404).send('algorithm not found');
  try {
    Render(renderer, res);
  } catch (e) {
    res.status(500).send(`rendering failed ${e.message}`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
