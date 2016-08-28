'use strict';

const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const keva = require('keva');
const express = require('express');
const frix = proxyquire('../lib/frix', {
  'app-root-path': {
    path: 'test/files'
  }
});

chai.use(require('chai-http'));

describe('frix', function() {

  describe('express handler', function() {

    it('should create valid function and html', function(done) {
      let app = express();
      frix.render().then(requestHandler => {
        app.use(requestHandler);
        chai.request(app).get('/page1').end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
      });
    });

    it('should not return anything when url is invalid', function(done) {
      let app = express();
      frix.render().then(requestHandler => {
        app.use(requestHandler);
        chai.request(app).get('/invalid').end((err, res) => {
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
        chai.request(app).get('/opt-test').end((err, res) => {
          expect(res).to.have.status(200);
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
      frix.modules['content'] = [];
    });

    describe('should be added', function() {

      it('using attributes', function() {
        frix.addModule('content', someFunction);
        expect(frix.modules['content'].includes(someFunction))
          .to.be.true;
      });

      it('using object', function() {
        frix.addModule({
          target: 'content',
          module: someFunction
        });
        expect(frix.modules['content'].includes(someFunction))
          .to.be.true;
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
      for (let [key,] of keva(frix.modules)) {
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
