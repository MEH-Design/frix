'use strict';

const createTemplates = require('./create-templates');
const access = require('./access');
const keva = require('keva');
const opt = access.readConfig();

module.exports = {
  prefixes: {},
  render: function(options = {}) {
    access.writeOptions(options);

    return createTemplates().then((data) => {
      this.api.templates = data.templates;
      this.api.structure = data.structure;
      return (req, res, next) => {
        if(req.url.startsWith('/bin/resources/')) {
          res.sendFile(`${opt.root}resources/${req.url.slice('/bin/resources/'.length)}`);
          return;
        } else if(req.url === `/bin/${opt.style}`) {
          res.sendFile(opt.root + req.url);
          return;
        } else if(req.url.startsWith('/bin/')) {
          for (let [key, val] of keva(this.api.templates)) {
            if(val.filename.includes(req.url)) {
              res.redirect(key);
            }
          }
        }
        let target = this.api.templates[req.url];
        if (target) {
          if (target.filename) {
            res.sendFile(target.filename);
            return;
          }
        }
        next();
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
