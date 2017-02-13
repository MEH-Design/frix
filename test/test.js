/* eslint no-console: 0*/
  // in our opinion it is perfectly fine to use console logs for tests :)
/* eslint max-nested-callbacks: 0*/
/* eslint no-unused-vars: 0*/
  // mocha's 'should' is not used
/* eslint max-len: 0 */
  // the html is partially longer than 80 characters
'use strict';

const fs = require('then-fs');
const css = require('css');
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const keva = require('keva');
const noWhitespace = require('no-whitespace');
const express = require('express');
const frix = require('../lib/frix');
let opt = require('../lib/frix.conf.js');
opt.root += 'test/files/';

chai.use(require('chai-http'));
chai.use(require('chai-json-equal'));
chai.use(require('chai-as-promised'));

describe('frix', function() {
  describe('api', function() {
    it('should be able to request all pages', function(done) {
      let root = frix.api.getOpt().root;
      let expectedJson = {
        '/page1': {
          name: 'page',
          filename: root + 'bin/page1.html',
        },
        '/page2': {
          name: 'page',
          filename: root + 'bin/page2.html',
        },
      };
      frix.render().then(() => {
        frix.api.getAllPages().should.jsonEqual(expectedJson);
        done();
      });
    });

    it('should be able to request content structure', function(done) {
      let expectedJson = {
        'title': {
          'value': 'Atomic',
          'type': 'text',
        },
        'article': {
          'attribute': {
            'type': 'text',
            'value': 'something',
          },
          'text': {
            'value': 'An atom is the basic unit that makes up all matter.',
            'type': 'richtext',
          },
          'header': {
            'heading-en': {
              'value': 'Atom',
              'type': 'text',
            },
            'heading-de': {
              'value': 'Atom',
              'type': 'text',
            },
            'author': {
              'name': {
                'value': 'Wikipedia',
                'type': 'text',
              },
              'link': {
                'value': 'https://simple.wikipedia.org/wiki/Atom',
                'type': 'url',
              },
            },
          },
        },
      };
      frix.render().then(() => {
        frix.api.getContentStructure('/page1').should.jsonEqual(expectedJson);
        done();
      });
    });

    it('should be able to request opt', function(done) {
      frix.render().then(() => {
        frix.api.getOpt().should.jsonEqual(require('../lib/frix.conf.js'));
        done();
      });
    });

    it('should be able to watch for content changes', function(done) {
      frix.api.watchReRender((data) => {
        let expectedHtml = noWhitespace(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8"/>
              <title>Woody</title>
            </head>
            <body>
              <article class="article">
                <header class="header">
                  <h1 class="heading">Tree</h1>
                  <h1 class="heading">Baum</h1>
                  <p class="author">written by <a href="https://simple.wikipedia.org/wiki/Tree">Wikipedia</a></p>
                </header>
                <p data-someattribute="something">A tree is a tall plant with a trunk and branches made of wood.</p>
              </article>
            </body>
          </html>
        `);
        expect(noWhitespace(data.render.template)).to.equal(expectedHtml);
        done();
      });
      let fileToRewrite = `${opt.root}${opt.content}/page.json`;
      fs.readFile(fileToRewrite, 'utf8')
        .then((file) => fs.writeFile(fileToRewrite, file));
    });
  });

  describe('express handler', function() {
    it('should create valid function and html', function(done) {
      let expectedHtml = noWhitespace(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>Woody</title>
          </head>
          <body>
            <article class="article">
              <header class="header">
                <h1 class="heading">Tree</h1>
                <h1 class="heading">Baum</h1>
                <p class="author">written by <a href="https://simple.wikipedia.org/wiki/Tree">Wikipedia</a></p>
              </header>
              <p data-someattribute="something">A tree is a tall plant with a trunk and branches made of wood.</p>
            </article>
          </body>
        </html>
      `);
      let app = express();
      frix.render().then((requestHandler) => {
        app.use(requestHandler);
        chai.request(app).get('/page2').end((err, res) => {
          if (err) throw err;
          expect(noWhitespace(res.text)).to.equal(expectedHtml);
          done();
        });
      }, (err) => console.log(err));
    });

    it('should throw an error if there are multiple top-level tags in an element', function() {
      opt.key = 'error-test.json';
      let render = frix.render();
      opt.key = 'key.json';
      return expect(render).to.eventually.be.rejectedWith('Elements must be wrapped in an enclosing tag');
    });

    it('should throw an error if content does not match the prefix', function() {
      opt.key = 'prefix-test.json';
      let render = frix.render();
      opt.key = 'key.json';
      return expect(render).to.eventually.be.rejectedWith('"not an URL" did not match the prefix "url"');
    });

    it('should respect dev flag', function(done) {
      let expectedHtml = noWhitespace(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>Woody</title>
          </head>
        <body>
          <article class="article">
            <header class="header">
              <h1 class="heading" data-dev="article header heading-en" data-dev-targets="text-content">Tree</h1>
              <h1 class="heading" data-dev="article header heading-de" data-dev-targets="text-content">Baum</h1>
              <p class="author">
                written by
                <a href="https://simple.wikipedia.org/wiki/Tree"
                   data-dev="article header author"
                   data-dev-targets="url-href:link text-content:name">Wikipedia</a>
              </p>
            </header>
            <p data-someattribute="something" data-dev="article" data-dev-targets="text-data-someattribute:attribute richtext-content:text">A tree is a tall plant with a trunk and branches made of wood.</p>
          </article>
        </body>
      </html>
      `);
      let app = express();
      frix.render({dev: true}).then((requestHandler) => {
        app.use(requestHandler);
        chai.request(app).get('/page2').end((err, res) => {
          if (err) throw err;
          expect(noWhitespace(res.text)).to.equal(expectedHtml);
          done();
        });
      }, (err) => console.log(err));
    });


    it('should not return anything when url is invalid', function(done) {
      let app = express();
      frix.render().then((requestHandler) => {
        app.use(requestHandler);
        chai.request(app).get('/invalid').end((_, res) => {
          expect(res).to.have.status(404);
          done();
        });
      });
    });
  });

  describe('loops', function() {
    it('should be executed', function(done) {
      let expectedHtml = noWhitespace(`
        <article class="article">
          <header class="header">
            <h1 class="heading">Tree</h1>
            <h1 class="heading">Baum</h1>
            <p class="author">written by <a href="https://simple.wikipedia.org/wiki/Tree">Wikipedia</a></p>
          </header>
          <p data-someattribute="something">A tree is a tall plant with a trunk and branches made of wood.</p>
        </article>
        <br/>
        <cite class="quote">Insert smart-ass quote here.</cite>
        <br/>
      `);
      let app = express();
      opt.key = 'loop-test.json';
      frix.render().then((requestHandler) => {
        app.use(requestHandler);
        chai.request(app).get('/loop-test').end((_, res) => {
          expect(noWhitespace(res.text)).to.equal(expectedHtml);
          done();
        });
      });
    });

    after(function() {
      opt.key = 'key.json';
    });
  });

  describe('modifiers', function() {
    let someFunction = function(html) {
      return html;
    };

    afterEach(function() {
      frix.modifiers.content = [];
    });

    describe('should be added', function() {
      it('using attributes', function() {
        frix.addModifier('content', someFunction);
        expect(frix.modifiers.content.includes(someFunction))
          .to.equal(true);
      });

      it('using object', function() {
        frix.addModifier({
          target: 'content',
          modifier: someFunction,
        });
        expect(frix.modifiers.content.includes(someFunction))
          .to.equal(true);
      });
    });

    it('should be rejected when not a function', function() {
      expect(frix.addModifier.bind(frix, 'content', null))
        .to.throw('Not a function.');
    });

    it('should be rejected when event does not exist', function() {
      expect(frix.addModifier.bind(frix, 'invalid-string', someFunction))
        .to.throw('Event does not exist.');
    });

    it('should all be called', function(done) {
      let promises = [];
      for (let [key] of keva(frix.modifiers)) {
        promises.push(new Promise((resolve) => {
          frix.addModifier(key, (html) => {
            resolve(key);
            return html;
          });
        }));
      }
      Promise.all(promises).then(() => {
        done();
      });
      frix.render();
    });
  });
  describe('css', function() {
    let mainCss;
    let expectedCss = noWhitespace(`
      .header > .author p {
        font-size: 30px;
      }
      .author p {
        font-size: 20px;
      }
      @media (min-width: 800px) {
        .author p {
          font-size: 15px;
        }
      }

    `);
    before(function(done) {
      frix.render().then(() => {
        fs.readFile(`${opt.root}bin/main.css`, 'utf8').then((file) => {
          mainCss = file;
          done();
        });
      });
    });
    it('should create a valid stylesheet', function() {
      expect(css.parse(mainCss).type).to.equal('stylesheet');
    });
    it('should create the correct css', function() {
      expect(noWhitespace(mainCss)).to.equal(expectedCss);
    });
  });
});
