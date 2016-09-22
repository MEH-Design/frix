const opt = require('./frix.conf.js');
const css = require('css');
const access = require('./access.js');

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

    Object.keys(opt.structure.folders).forEach(level => {
      directoryContent.push(
        access.readFilesAtLevel(level, filename => /\.css$/.test(filename))
        .then(files => {
          files = files
            .map(filename => access.readElement(level, filename).then(content => ({
              name: filename.match(/(\w+)\./)[1],
              content: content,
              level: level
            })));
          return Promise.all(files);
        })
      );
    });
    return Promise.all(directoryContent).then(files => {
      // flatten the 2d file content array
      files = files.reduce((a, b) => {
        return a.concat(b);
      }, []);
      let render = {};
      render.file = `${opt.root}bin/${opt.style}`;
      render.template = files
        .map(replaceElementTags)
        .reduce((a, b) => {
          return a + b + "\n";
        }, "");
      return render;
    });
  }
};
