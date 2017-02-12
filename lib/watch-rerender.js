const opt = require('./frix.conf.js');
const watchdirectory = require('watchdirectory');
const keva = require('keva');
const HTMLCreator = require('./html-creator');
const access = require('./access');

function reRenderFile(keyJson, key, prefixes, modifiers) {
  let htmlCreator = new HTMLCreator(prefixes, modifiers);
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

function watchReRender(prefixes, modifiers, listener) {
  watchdirectory.watchDirectory(opt.root + opt.content, {}, function(filename, curr, prev, change) {
    if (change === 'modified') {
      let changed = filename.slice(filename.lastIndexOf('/') + 1);
      access.readKey().then((keyJson) => {
        for(let [key, value] of keva(keyJson)) {
          if(value.template.includes(changed) || value.content.includes(changed)) {
            reRenderFile(keyJson, key, prefixes, modifiers)
              .then((info) => listener(info));
          }
        }
      });
    }
  });
}
module.exports = watchReRender;
