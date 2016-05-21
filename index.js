'use strict';

var fs = require('fs');
var express = require('express');
var Mark = require('markup-js');

var app = express();

app.get('/', function(req, res) {
  fs.readFile(__dirname + '/templates/index.html', 'utf8', function(err, file) {
    if(err) throw err;

    var template = file;
    fs.readFile(__dirname + '/content/index.json', 'utf8', function(err, file) {
      if(err) throw err;

      var content = JSON.parse(file);
      var organisms = template.match(/{{[A-Za-z\s]+}}/g);
      organisms = organisms.map(function(o) {
        var matches = o.match(/{{([A-Za-z]+)\s+as\s+([A-Za-z]+)}}/);
        return {
          full: matches[0],
          organism: matches[1],
          variable: matches[2]
        };
      });

      console.log(organisms);

      var i = 0;
      organisms.forEach(function(o) {
        markupOrganism(o, function(data) {
          o.markupped = data;
          console.log(o.markupped);
          i++;
          if(i === organisms.length) {
            markupTemplate(template, organisms);
          }
        });
      });

      function markupOrganism(o, cb) {
        fs.readFile(__dirname + '/organisms/' + o.organism + '.html', 'utf8', function(err, file) {
          if(err) throw err;

          cb(Mark.up(file, content[o.variable]));
        });
      }

      function markupTemplate(template, organisms) {
        var markupped = template;
        organisms.forEach(function(o) {
          markupped = markupped.replace(new RegExp(o.full), o.markupped);
        });
        res.send(markupped);
      }
    });
  })
});

app.listen('8080');
console.log('Started..');
