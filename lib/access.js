const fs = require('then-fs');
const mkdirp = require('mkdirp-then');
var opt = require('./frix.conf.js');

module.exports = {
  readPageData: function(pageLocation) {
    let templatePath = `${opt.root}${opt.structure.pages}/${pageLocation.template}`;
    let contentPath = `${opt.root}${opt.content}/${pageLocation.content}`;
    return Promise.all([
      fs.readFile(templatePath),
      fs.readFile(contentPath)
    ]).then(data => ({
      template: data[0],
      content: JSON.parse(data[1])
    }));
  },
  readFilesAtLevel: function(level, filter) {
    return fs.readdir(`${opt.root}${opt.structure.folders[level]}`, 'utf8').then(files => {
      return filter ? files.filter(filter) : files;
    });
  },
  readElement: function(level, filename) {
    return fs.readFile(`${opt.root}${opt.structure.folders[level]}/${filename}`, 'utf8');
  },
  readKey: function() {
    return fs.readFile(`${opt.root}${opt.key}`, 'utf8');
  },
  Output: class Output {
    constructor() {
      this.promises = [mkdirp(`${opt.root}bin`)];
    }
    add(render) {
      this.promises.push(fs.writeFile(render.file, render.template));
    }
    waitForFinish() {
      return Promise.all(this.promises);
    }
  }
};
