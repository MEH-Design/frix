'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const mock = require('mock-fs');
const proxyquire = require('proxyquire');
const atomicms = proxyquire('../lib/atomicms', { 'app-root-path': { path: 'test' } });;
const loremIpsum = require('lorem-ipsum');
const fs = require('fs');
const keva = require('keva');
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
<article>{{content}}</article>
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

    before(function() {
      const express = require('express');
      let app = express();
      let a = new atomicms();
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

    it('should return 404 on wrong request', function(done) {
      chai.request('http://localhost:8080')
        .get('/nothing')
        .end(function(err, res) {
          expect(res.status).to.equal(404);
          done();
        });
    });
  });

  describe('#templates', function() {
    let a = new atomicms();

    it('should create templates with keys from key.json', function() {
      for(let [key,] of keva(keyJson)) {
        expect(a.templates).to.have.property(key);
      }
    });

    describe('organism without content', function() {
      let origIndex = fs.readFileSync('test/templates/index.html', 'utf-8');
      let origBody = fs.readFileSync('test/organisms/oBody.html', 'utf-8');
      let oTest = '<!-- this is an organism for testing -->';

      before(function() {
        fs.writeFileSync('test/templates/index.html', '{{oBody}}');
        fs.writeFileSync('test/organisms/oBody.html', oTest);
        a = new atomicms();
      });

      after(function() {
        fs.writeFileSync('test/templates/index.html', origIndex);
        fs.writeFileSync('test/organisms/oBody.html', origBody);
      });

      it('should be included into html', function() {
        expect(a.templates['/index']).to.contain(oTest);
      });
    });

    describe('multiple organisms', function() {
      let origIndex = fs.readFileSync('test/templates/index.html', 'utf-8');
      let origContentIndex = fs.readFileSync('test/content/index.json', 'utf-8');
      let origContentHome = fs.readFileSync('test/content/home.json', 'utf-8');

      before(function() {
        let contentIndex = { test: JSON.parse(origContentIndex).header };
        let contentHome = { test: JSON.parse(origContentHome).body };
        contentIndex.test.type = 'oHeader';
        contentHome.test.type = 'oBody';
        fs.writeFileSync('test/templates/index.html', '{{[oBody, oHeader] as test}}');
        fs.writeFileSync('test/content/index.json', JSON.stringify(contentIndex))
        fs.writeFileSync('test/content/home.json', JSON.stringify(contentHome));
        a = new atomicms();
      });

      after(function() {
        fs.writeFileSync('test/templates/index.html', origIndex);
        fs.writeFileSync('test/content/index.json', origContentIndex);
        fs.writeFileSync('test/content/home.json', origContentHome);
      });

      it('should work with header type', function() {
        expect(a.templates['/index']).to.contain('<h1>index</h1>');
      });

      it('should work with body type', function() {
        expect(a.templates['/home']).to.contain('<p>');
      });
    });
  });
});
