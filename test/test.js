'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const proxyquire = require('proxyquire');
const atomicms = proxyquire('../lib/atomicms', {
  'app-root-path': { path: 'test/files' }
});
const fs = require('fs');
const keva = require('keva');
const express = require('express');


describe('atomicms', function() {
  let cms;

  beforeEach(function() {
    cms = new atomicms();
  });

  describe('modules', function() {

    let someFunction = function() {
      return 'someValue';
    };

    it('should be added', function() {
      cms.addModule('html-content', someFunction);
      expect(cms._modules['html-content'].includes(someFunction))
        .to.be.true;
    });

    it('should be rejected when not a function', function() {
      expect(cms.addModule.bind(cms, 'html-content', null))
        .to.throw('Not a function.');
    });

    it('should be rejected when event does not exist', function() {
      expect(cms.addModule.bind(cms, 'invalid-string', someFunction))
        .to.throw('Event does not exist.');
    });

    it('should all be called', function(done) {
      let promises = [];
      for (let [key,] of keva(cms._modules)) {
        promises.push(new Promise(resolve => {
          cms.addModule(() => {
            resolve(key);
          });
        }));
      }
      Promise.all(promises).then(() => {
        done();
      });
    });
  });
});
