'use strict';

const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const keva = require('keva');
const frix = proxyquire('../lib/frix', {
  'app-root-path': {
    path: 'test/files'
  }
});

chai.use(require('chai-http'));

describe('frix', function() {

  before(frix.render);

  describe('html', function() {

    it('should be rendered', function() {
      expect(frix.templates)
        .to.not.be.null;
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
