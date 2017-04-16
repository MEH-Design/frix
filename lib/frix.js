'use strict';

const createTemplates = require('./create-templates');
const access = require('./access');

module.exports = {
  prefixes: {},
  render: function(options = {}) {
    access.writeOptions(options);

    return createTemplates().then((data) => {
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
  api: {
    templates: {},
    structure: {},
    getOpt: function() {
      return access.readConfig();
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
