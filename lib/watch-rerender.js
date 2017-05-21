const opt = require('./frix.conf.js');
const watchdirectory = require('watchdirectory');
const keva = require('keva');
const HTMLCreator = require('./html-creator');
const access = require('./access');

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
    if (change === 'modified') {
      let changed = filename.slice(filename.lastIndexOf('/') + 1);
      access.readKey().then((keyJson) => {
        for(let [key, value] of keva(keyJson)) {
          if(changed.includes(value.template) || changed.includes(value.content)) {
            reRenderFile(keyJson, key)
              .then((info) => listener(info));
          }
        }
      });
    }
  });
}
module.exports = watchReRender;
