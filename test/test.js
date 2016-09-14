/* eslint max-nested-callbacks: 0*/
/* eslint no-unused-vars: 0*/
  // mocha's 'should' is not used
/* eslint max-len: 0 */
  // the html is partially longer than 80 characters
'use strict';

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const keva = require('keva');
const noWhitespace = require('no-whitespace');
const express = require('express');
const frix = require('../lib/frix');
let opt = require('../lib/frix.conf.js');
opt.root = 'test/files/';

chai.use(require('chai-http'));

describe('frix', function() {
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
              <p>A tree is a tall plant with a trunk and branches made of wood.</p>
            </article>
          </body>
        </html>
      `);
      let app = express();
      frix.render().then(requestHandler => {
        app.use(requestHandler);
        chai.request(app).get('/page1').end((err, res) => {
          if (err) throw err;
          expect(noWhitespace(res.text)).to.equal(expectedHtml);
          done();
        });
      }, err => console.log(err));
    });

    it('should not return anything when url is invalid', function(done) {
      let app = express();
      frix.render().then(requestHandler => {
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
          <p>A tree is a tall plant with a trunk and branches made of wood.</p>
        </article>
        <br/>
        <cite class="quote">Insert smart-ass quote here.</cite>
        <br/>
      `);
      let app = express();
      opt.key = 'loop-test.json';
      frix.render().then(requestHandler => {
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
          modifier: someFunction
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
        promises.push(new Promise(resolve => {
          frix.addModifier(key, html => {
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
});
