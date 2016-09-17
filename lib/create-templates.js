const keva = require('keva');
const opt = require('./frix.conf.js');
const HTMLCreator = require('./html-creator');
const CSSCreator = require('./css-creator');
const access = require('./access.js');

function createTemplates(modifiers) {
  let prefixes = require(`../${opt.root}${opt.prefix}`);
  let htmlCreator = new HTMLCreator(prefixes, modifiers);
  let cssCreator = new CSSCreator();
  let promises = [];

  promises.push(cssCreator.create());
  return access.readKey().then(JSON.parse).then(keyJson => {
    for (let [key, value] of keva(keyJson)) {
      if (typeof value === 'string') {
        value = {
          name: value,
          template: value + '.html',
          content: value + '.json'
        };
      } else {
        value.type = value.template.match(/(\w+)\./)[1];
      }
      promises.push(htmlCreator.create(key, value));
    }

    return Promise.all(promises).then(rendered => {
      let templates = {};
      let output = new access.Output();
      rendered.forEach(render => {
        if (render.key) {
          templates[render.key] = render.file;
        }
        output.add(render);
      });
      return output.waitForFinish().then(() => templates);
    });
  });
}

module.exports = createTemplates;
