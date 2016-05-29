'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const mock = require('mock-fs');
const proxyquire = require('proxyquire');
const atomicms = proxyquire('../lib/atomicms', { 'app-root-path': { path: 'test' } });;
const loremIpsum = require('lorem-ipsum');
const fs = require('fs');
const og = require('og');
const express = require('express');

let keyJson = {
  '/index': {
    'template': 'index.html',
    'content': 'index.json'
  },
  '/home': {
    'template': 'index.html',
    'content': 'home.json'
  }
};

let template = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test</title>
  </head>
  <body>
    <h1>This is a Test.</h1>
    {{oHeader as header}}
    <p>This is in the template.</p>
    {{oBody as body}}
  </body>
</html>
`;

let oBody = '<p>{{paragraph}}</p>';

let oHeader = `
<h1>{{title}}</h1>
<img src={{img}}>
<p><strong>{{content}}</strong></p>
`;

let indexJson = {
  'header': {
    'title': 'index',
    'img': 'https://unsplash.it/200/300?image=0',
    'content': loremIpsum({count: 3, units: 'sentences'})
  },
  'body': {
    'paragraph': loremIpsum({count: 3, units: 'paragraphs'})
  }
}

let homeJson = {
  'header': {
    'title': 'home',
    'img': 'https://unsplash.it/200/300?image=1',
    'content': loremIpsum({count: 3, units: 'sentences'})
  },
  'body': {
    'paragraph': loremIpsum({count: 3, units: 'paragraphs'})
  }
}

describe('atomicms', function() {
  mock({
    'test': {
      'key.json': JSON.stringify(keyJson),
      'templates': {
        'index.html': template
      },
      'organisms': {
        'oBody.html': oBody,
        'oHeader.html': oHeader
      },
      'content': {
        'index.json': JSON.stringify(indexJson),
        'home.json': JSON.stringify(homeJson)
      }
    }
  });

  after(function() {
    mock.restore();
  });

  describe('#opts', function() {
    let a = new atomicms();

    it('should have default key', function() {
      expect(a.opt).to.have.property('key');
    });

    it('should have default content', function() {
      expect(a.opt).to.have.property('content');
    });

    it('should have default template', function() {
      expect(a.opt).to.have.property('template');
    });

    it('should have default organism', function() {
      expect(a.opt).to.have.property('organism');
    });
  });

  describe('#requestHandler', function() {
    let app, a;

    before(function() {
      const express = require('express');
      app = express();
      a = new atomicms();
      app.get('*', a.requestHandler());
      app.listen('8080');
    });

    it('should handle a request on /index correctly', function(done) {
      chai.request('http://localhost:8080')
        .get('/index')
        .end(function(err, res) {
          expect(res.status).to.not.equal(404);
          done();
        });
    });
  });

  describe('#templates', function() {
    let a = new atomicms();

    it('should create templates with keys from key.json', function() {
      for(let [key,] of og(keyJson)) {
        expect(a.templates).to.have.property(key);
      }
    });

    describe('organism without content', function() {
      let origIndex = fs.readFileSync('test/templates/index.html', 'utf-8');
      let origTest = fs.readFileSync('test/organisms/oBody.html', 'utf-8');

      before(function() {
        let oTest = '<!-- this is an organism for testing -->';
        fs.writeFileSync('test/templates/index.html', '{{oBody}}');
        fs.writeFileSync('test/organisms/oBody.html', oTest);
        a = new atomicms();
      });

      after(function() {
        fs.writeFileSync('test/templates/index.html', origIndex);
        fs.writeFileSync('test/organisms/oBody.html', origTest);
      });

      it('should be included into html', function() {
        expect(a.templates['/index']).to.contain(oTest);
      });
    });
  });
});
