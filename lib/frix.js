'use strict';

const opt = require('./frix.conf.js');
const watchReRender = require('./watch-rerender');
const createTemplates = require('./create-templates');

module.exports = {
  modifiers: {
    content: [],
  },
  prefixes: {},
  render: function(options = {}) {
    return createTemplates(this.modifiers, options.dev).then((data) => {
      this.api.templates = data.templates;
      this.api.structure = data.structure;
      return (req, res, next) => {
        let target = this.api.templates[req.url];
        if (target) {
          if (target.filename) {
            res.sendFile(target.filename);
          }
        } else {
          next();
        }
      };
    });
  },
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
    watchReRender: function(listener) {
      let prefixes = require(`${opt.root}${opt.prefix}`);
      watchReRender(prefixes, module.exports.modifiers, listener);
    },
  },
};
