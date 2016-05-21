'use strict';

var express = require('express');
var atomic = require('atomicms');

var app = express();

atomic.init({
  key: 'key.json',
  content: '/content',
  template: '/templates',
  organism: '/organisms'
});

app.use(atomic());

app.listen('8080');
console.log('Started..');
