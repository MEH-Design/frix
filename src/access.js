const fs = require('then-fs');
const mkdirp = require('mkdirp-then');
const keva = require('keva');
const path = require('path');
let opt = require('./frix.conf.js');

module.exports = {
  writeOptions(options) {
    this.options = options;
  },
  readOptions() {
    return this.options;
  },
  readPrefixes: function() {
    return require(`${opt.root}${opt.prefix}`);
  },
  readConfig: function() {
    return opt;
  },
  readPageData: function(pageLocation) {
    let templatePath = `${opt.root}${opt.structure.pages}/${pageLocation.template}`;
    let contentPath = `${opt.root}${opt.content}/${pageLocation.content}`;
    return Promise.all([
      fs.readFile(templatePath),
      fs.readFile(contentPath),
    ]).then((data) => ({
        template: data[0],
        content: JSON.parse(data[1]),
    }));
  },
  readGlobalJson: function(path) {
    let JsonPath = `${opt.root}${opt.content}/${path}.global.json`;
    return fs.readFile(JsonPath).then(JSON.parse);
  },
  readFilesAtLevel: function(level, filter) {
    return fs.readdir(`${opt.root}${opt.structure.folders[level]}`, 'utf8').then((files) => {
      return filter ? files.filter(filter) : files;
    });
  },
  readElement: function(level, filename) {
    return fs.readFile(`${opt.root}${opt.structure.folders[level]}/${filename}`, 'utf8');
  },
  readKey: function() {
    return fs.readFile(`${opt.root}${opt.key}`, 'utf8')
      .then(JSON.parse)
      .then((keyJson) => {
        for (let [key, value] of keva(keyJson)) {
          if (typeof value === 'string') {
            keyJson[key] = {
              name: value,
              template: value + '.html',
              content: value + '.json',
            };
          } else {
            keyJson[key].name = keyJson[key].template.match(/(\w+)\./)[1];
          }
        }
        return keyJson;
      });
  },
  Output: class Output {
    constructor(createDir = false) {
      this.promises = createDir ? [mkdirp(`${opt.root}bin`)] : [];
    }
    add(render) {
      let folderPath = path.dirname(render.file);
      this.promises.push(mkdirp(folderPath));
      this.promises.push(fs.writeFile(render.file, render.template));
    }
    waitForFinish() {
      return Promise.all(this.promises);
    }
  },
};
