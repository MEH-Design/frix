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
          type: value,
          template: value + '.html',
          content: value + '.json'
        };
      } else {
        value.type = value.template.match(/(\w+)\./g)[1];
      }
      promises.push(htmlCreator.create(key, value));
    }

    return Promise.all(promises).then(rendered => {
      let templates = {};
      let promises = [];
      promises.push(mkdirp(`${opt.root}bin`));
      rendered.forEach(render => {
        if (render.key) {
          templates[render.key] = render.file;
        }
        promises.push(fs.writeFile(render.file, render.template));
      });
      return Promise.all(promises).then(() => {
        return templates;
      });
    });
  });
}

module.exports = createTemplates;
