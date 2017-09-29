const opt = require('./frix.conf.js');
const watchdirectory = require('watchdirectory');
const keva = require('keva');
const HTMLCreator = require('./html-creator');
const access = require('./access');
const upath = require('upath');

function reRenderFile(keyJson, key) {
  let htmlCreator = new HTMLCreator();
  return htmlCreator.create(key, keyJson[key], false)
    .then((render) => {
      let output = new access.Output();
      output.add(render);
      return output.waitForFinish()
        .then(() => ({
          status: 'success',
          render: render,
        }));
    });
}

function watchReRender(listener) {
  watchdirectory.watchDirectory(opt.root + opt.content, {}, function(filename, curr, prev, change) {
    const name = upath.normalize(filename);
    if (change === 'modified') {
      access.readKey().then((keyJson) => {
        for (let [key, value] of keva(keyJson)) {
          if (name.endsWith(upath.normalize(value.template)) || name.endsWith(upath.normalize(value.content))) {
            reRenderFile(keyJson, key)
              .then((info) => listener(info));
          }
        }
      });
    }
  });
}
module.exports = watchReRender;
