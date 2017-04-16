'use strict';

const createTemplates = require('./create-templates');
const access = require('./access');
const fs = require('then-fs');
const keva = require('keva');
const opt = access.readConfig();


module.exports = {
  prefixes: {},
  promises: [],
  render: function(options = {}) {
    access.writeOptions(options);
    this.api.resources = {};
    let resourcePath = opt.root + "resources";
    let resourcePromise = fs.readdir(resourcePath).then(files => {
      let resources
      files.forEach(file => {
        this.promises.push(fs.stat(`${resourcePath}/${file}`).then(stat => {
          if(!stat.isDirectory()) {
            return [`/bin/resources/${file}`, `${resourcePath}/${file}`];
          }
        }));
      });
      Promise.all(this.promises).then((resources) => {
        resources.forEach((resource) => {
          if(resource) this.api.resources[resource[0]] = resource[1];
        });
      });
    });

    return createTemplates().then((data) => {
      this.api.templates = data.templates;
      this.api.structure = data.structure;
      return (req, res, next) => {
        if(req.url.startsWith('/bin/resources')) {
          resourcePromise.then(() => {
            let resource = this.api.resources[req.url];
            if(resource) {
              res.sendFile(this.api.resources[req.url]);
              return true;
            }
            return false;
          }).then(isfound => {
            if(!isfound) {
              next();
            }
          });
        } else if (req.url === `/bin/${opt.style}`) {
          res.sendFile(`${opt.root}bin/${opt.style}`);
        } else {
          if(req.url.startsWith('/bin/')) {
            for (let [key, val] of keva(this.api.templates)) {
              if(val.filename.includes(req.url)) {
                res.redirect(key);
              }
            }
          } else if (this.api.templates[req.url]) {
            let target = this.api.templates[req.url];
            if (target) {
              if (target.filename) {
                res.sendFile(target.filename);
              }
            }
          } else {
            next();
          }
        }
      };
    });
  },
  api: {
    templates: {},
    structure: {},
    getOpt: function() {
      return opt;
    },
    getContentStructure: function(key) {
      return this.structure[key];
    },
    getAllPages: function() {
      return this.templates;
    },
    watchReRender: require('./watch-rerender'),
  },
};
