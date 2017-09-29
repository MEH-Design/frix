/* eslint-disable */

const authorize = require('./authorize');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const access = require('./access');
access.readKey().then((keyJson) => {
  key = keyJson;
});

module.exports = (authorizeURL = '/login') => {
  return [cookieParser(), urlencodedParser, function(req, res, next) {
    if (req.url.startsWith(authorizeURL) && req.method === 'POST') {
      authorize(req, res, key);
    }
    if (key[req.url] && key[req.url].password) {
      if(key[req.url].password === req.cookies[req.url]) {
        next();
      } else {
        res.redirect(`${authorizeURL}?site=${req.url.slice(1)}`);
      }
    } else {
      next();
    }
  }];
};
