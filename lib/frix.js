'use strict';

const createTemplates = require('./create-templates');
const secureSites = require('./secure-sites');
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
  secureSites: secureSites,
  addModifier: function(...args) {
    let target;
    let modifier;
    if (typeof args[0] === 'object') {
      target = args[0].target;
      modifier = args[0].modifier;
    } else {
      target = args[0];
      modifier = args[1];
    }

    if (!this.modifiers[target]) throw new Error('Event does not exist.');
    if (typeof modifier !== 'function') throw new Error('Not a function.');
    this.modifiers[target].push(modifier);
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
