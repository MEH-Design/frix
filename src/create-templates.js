const keva = require('keva');
const HTMLCreator = require('./html-creator');
const CSSCreator = require('./css-creator');
const access = require('./access.js');

function createTemplates() {
  let htmlCreator = new HTMLCreator();
  let cssCreator = new CSSCreator();
  let keyJson;
  let structure = {};
  return access.readKey().then((json) => {
    let promises = [];
    keyJson = json;
    promises.push(cssCreator.create());
    for (let [key] of keva(keyJson)) {
      promises.push(htmlCreator.create(key, keyJson[key]));
    }
    return Promise.all(promises);
  }).then((rendered) => {
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
    return output.waitForFinish();
  }).then(() => ({
    templates: keyJson,
    structure,
  }));
}

module.exports = createTemplates;
