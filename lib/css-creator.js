const css = require('css');
const access = require('./access.js');
const opt = access.readConfig();

function replaceElementTags(file) {
  let obj = css.parse(file.content);
  replaceSelectors(obj.stylesheet, file);
  return css.stringify(obj);
}

function replaceSelectors(json, file) {
  Object.keys(json).forEach((key) => {
    if(key === 'selectors') {
      json[key] = json[key].map((selector) => {
        selector = selector.replace(new RegExp(`\\b[^\\.#]${file.level}\\b`), ` .${file.name}`);
        selector = selector.replace(new RegExp(`^${file.level}\\b`), `.${file.name}`);
        return selector;
      });
    }
    if(typeof json[key] === 'object') {
      replaceSelectors(json[key], file);
    }
  });
}

module.exports = class CSSCreator {
  create() {
    let directoryContent = [];
    opt.structure.folders.pages = opt.structure.pages;

    Object.keys(opt.structure.folders).forEach((level) => {
      directoryContent.push(
        access.readFilesAtLevel(level, (filename) => /\.css$/.test(filename))
        .then((files) => {
          files = files
            .map((filename) => access.readElement(level, filename).then((content) => {
              return {
                // see http://stackoverflow.com/questions/9001557/match-filename-and-file-extension-from-single-regex
                name: filename.match(/^([^\\]*)\.(\w+)$/)[1],
                content: content,
                level: level,
              };
            }));
          return Promise.all(files);
        })
      );
    });
    return Promise.all(directoryContent).then((files) => {
      // flatten the 2d file content array
      files = files.reduce((a, b) => {
        return a.concat(b);
      }, []);
      let render = {};
      render.file = `${opt.root}bin/${opt.style}`;
      render.template = files
        .map(replaceElementTags)
        .reduce((a, b) => {
          return a + b + '\n';
        }, '');
      return render;
    });
  }
};
