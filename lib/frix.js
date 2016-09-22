'use strict';

const path = require('path');
const createTemplates = require('./create-templates');

module.exports = {
  modifiers: {
    content: []
  },
  render: function() {
    return createTemplates(this.modifiers).then(data => {
      this.templates = data.templates;
      return (req, res, next) => {
        let target = this.templates[req.url];
        if (target) {
          res.sendFile(path.join(__dirname, '..', target));
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
  }
};
