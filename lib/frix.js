'use strict';

const path = require('path');
const opt = require('./frix.conf.js');
const createTemplates = require('./create-templates');

module.exports = {
  modifiers: {
    content: []
  },
  render: function() {
    return createTemplates(this.modifiers).then(data => {
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
  addModifier: function() {
    let target;
    let modifier;
    if (typeof arguments[0] === 'object') {
      target = arguments[0].target;
      modifier = arguments[0].modifier;
    } else {
      target = arguments[0];
      modifier = arguments[1];
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
    }
  }
};
