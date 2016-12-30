const keva = require('keva');
const HTMLCreator = require('./html-creator');
const CSSCreator = require('./css-creator');
const access = require('./access.js');
const opt = require('./frix.conf.js');

function createTemplates(modifiers, dev) {
  let prefixes = require(`${opt.root}${opt.prefix}`);
  let htmlCreator = new HTMLCreator(prefixes, modifiers);
  let cssCreator = new CSSCreator();
  let promises = [];

  promises.push(cssCreator.create());
  return access.readKey().then((keyJson) => {
    for (let [key] of keva(keyJson)) {
      promises.push(htmlCreator.create(key, keyJson[key], dev));
    }

    return Promise.all(promises).then((rendered) => {
      let structure = {};
      let output = new access.Output(true);
      rendered.forEach((render) => {
        if (render.key) {
          keyJson[render.key] = {
            name: keyJson[render.key].name,
            filename: render.file,
          };
          structure[render.key] = render.structure;
        }
        output.add(render);
      });
      return output.waitForFinish().then(() => ({
        templates: keyJson,
        structure: structure,
      }));
    });
  });
}

module.exports = createTemplates;
