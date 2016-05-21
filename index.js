'use strict';

var fs = require('fs');
var express = require('express');
var Mark = require('markup-js');
var templates = {};
var app = express();

app.use(function(req, res, next) {
  var targetTemplate = templates[req.url];
  if(targetTemplate) {
    res.send(targetTemplate.html);
  } else {
    next();
  }
});

fs.readFile(__dirname + '/key.json', 'utf8', function(err, file) {
  if(err) throw err;

  var data = JSON.parse(file);
  for(var key in data) {
    renderFile(data[key].template, data[key].content, function(data) {
      templates[key] = { html: data };
    });
  }
});

function renderFile(filename, keyname, callback) {
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

      var i = 0;
      organisms.forEach(function(o) {
        markupOrganism(o, function(data) {
          o.markupped = data;
          i++;
          if(i === organisms.length) {
            markupTemplate(template, organisms, function(data) {
              callback(data);
            });
          }
        });
      });

      function markupOrganism(o, cb) {
        fs.readFile(__dirname + '/organisms/' + o.organism + '.html', 'utf8', function(err, file) {
          if(err) throw err;

          cb(Mark.up(file, content[o.variable]));
        });
      }

      function markupTemplate(template, organisms, cb) {
        var markupped = template;
        organisms.forEach(function(o) {
          markupped = markupped.replace(new RegExp(o.full), o.markupped);
        });
        cb(markupped);
      }
    });
  })
}

app.listen('8080');
console.log('Started..');
