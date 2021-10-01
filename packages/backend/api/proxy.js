const request = require('request');

module.exports = (req, res) => {
  req.pipe(request(req.query.url)).pipe(res);
};
