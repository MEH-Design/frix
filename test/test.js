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

frix.setOptions({
  root: 'test/files/'
});
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
            <article>
              <header>
                <h1>Tree</h1>
                <h1>Baum</h1>
                <p>written by <a href="https://simple.wikipedia.org/wiki/Tree">Wikipedia</a></p>
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

  describe('options', function() {
    it('should be merged', function(done) {
      let app = express();
      frix.setOptions({key: 'opt-test.json'});
      frix.render().then(requestHandler => {
        app.use(requestHandler);
        chai.request(app).get('/opt-test').end((_, res) => {
          expect(res).to.have.status(200);
          done();
        });
      });
    });

    after(function() {
      frix.setOptions({key: 'key.json'});
    });
  });

  describe('loops', function() {
    it('should be executed', function(done) {
      let expectedHtml = noWhitespace(`
        <article>
          <header>
            <h1>Tree</h1>
            <h1>Baum</h1>
            <p>written by <a href="https://simple.wikipedia.org/wiki/Tree">Wikipedia</a></p>
          </header>
          <p>A tree is a tall plant with a trunk and branches made of wood.</p>
        </article>
        <br/>
        <cite>Insert smart-ass quote here.</cite>
        <br/>
      `);
      let app = express();
      frix.setOptions({key: 'loop-test.json'});
      frix.render().then(requestHandler => {
        app.use(requestHandler);
        chai.request(app).get('/loop-test').end((_, res) => {
          expect(noWhitespace(res.text)).to.equal(expectedHtml);
          done();
        });
      });
    });

    after(function() {
      frix.setOptions({key: 'key.json'});
    });
  });

  describe('modules', function() {
    let someFunction = function(html) {
      return html;
    };

    afterEach(function() {
      frix.modules.content = [];
    });

    describe('should be added', function() {
      it('using attributes', function() {
        frix.addModule('content', someFunction);
        expect(frix.modules.content.includes(someFunction))
          .to.equal(true);
      });

      it('using object', function() {
        frix.addModule({
          target: 'content',
          module: someFunction
        });
        expect(frix.modules.content.includes(someFunction))
          .to.equal(true);
      });
    });

    it('should be rejected when not a function', function() {
      expect(frix.addModule.bind(frix, 'content', null))
        .to.throw('Not a function.');
    });

    it('should be rejected when event does not exist', function() {
      expect(frix.addModule.bind(frix, 'invalid-string', someFunction))
        .to.throw('Event does not exist.');
    });

    it('should all be called', function(done) {
      let promises = [];
      for (let [key] of keva(frix.modules)) {
        promises.push(new Promise(resolve => {
          frix.addModule(key, html => {
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
