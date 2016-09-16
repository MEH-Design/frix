const opt = require('./frix.conf.js');
const fs = require('then-fs');
const keva = require('keva');
const css = require('css');

function replaceElementTags(file) {
  let obj = css.parse(file.content);
  obj.stylesheet.rules = obj.stylesheet.rules.map(rule => {
    rule.selectors =
      rule.selectors.map(selector => selector.replace(new RegExp(`[^\\.#]${file.level}|^${file.level}\\b`), `.${file.name}`));
    return rule;
  });
  return css.stringify(obj);
}

module.exports = class CSSCreator {
  create() {
    let directoryContent = [];
    opt.structure.folders.pages = opt.structure.pages;
    for (let [level, dirname] of keva(opt.structure.folders)) {
      directoryContent.push(
        fs.readdir(`${opt.root}${dirname}`, 'utf8').then(files => {
          files = files
            .filter(filename => /\.css$/.test(filename))
            .map(filename => fs.readFile(`${opt.root}${dirname}/${filename}`, 'utf8').then(content => ({
              name: filename.match(/(\w+)\./)[1],
              content: content,
              level: level
            })));
          return Promise.all(files);
        })
      );
    }
    return Promise.all(directoryContent).then(files => {
      // flatten the 2d file content array
      files = files.reduce((a, b) => {
        return a.concat(b);
      }, []);
      let render = {};
      render.file = `${opt.root}bin/main.css`;
      render.template = files
        .map(replaceElementTags)
        .reduce((a, b) => {
          return a + b + "\n";
        }, "");
      return render;
    });
  }
};
