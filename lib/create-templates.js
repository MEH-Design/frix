const fs = require('then-fs');

const mkdirp = require('mkdirp-then');
const keva = require('keva');
const opt = require('./frix.conf.js');
const HTMLCreator = require('./html-creator');
const CSSCreator = require('./css-creator');

function createTemplates(modifiers) {
  let prefixes = require(`../${opt.root}${opt.prefix}`);
  let htmlCreator = new HTMLCreator(prefixes, modifiers);
  let cssCreator = new CSSCreator();
  let promises = [];

  promises.push(cssCreator.create());
  return fs.readFile(`${opt.root}${opt.key}`, 'utf8')
  .then(JSON.parse).then(keyJson => {
    for (let [key, value] of keva(keyJson)) {
      if (typeof value === 'string') {
        value = {
          template: value + '.html',
          content: value + '.json'
        };
      }
      promises.push(htmlCreator.create(key, value));
    }

    return Promise.all(promises).then(rendered => {
      let templates = {};
      let promises = [];
      rendered.forEach(render => {
        if (render.key) {
          templates[render.key] = render.file;
        }
        promises.push(mkdirp(`${opt.root}bin`));
        promises.push(fs.writeFile(render.file, render.template));
      });
      return Promise.all(promises).then(() => {
        return templates;
      });
    });
  });
}

module.exports = createTemplates;
