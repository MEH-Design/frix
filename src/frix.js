const createTemplates = require('./create-templates');
const secureSites = require('./secure-sites');
const access = require('./access');
const keva = require('keva');
const opt = access.readConfig();

class Frix {
  constructor() {
    this.prefixes = {};
    // TODO: babel in order to write arrow functions instead
    this.requestHandler = this.requestHandler.bind(this);
    this.render = this.render.bind(this);
    this.addModifier = this.addModifier.bind(this);
    this.secureSites = secureSites;
    this.api = {
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
    };
  }

  requestHandler(req, res, next) {
    if (req.url.startsWith('/bin/resources/')) {
      res.sendFile(`${opt.root}resources/${req.url.slice('/bin/resources/'.length)}`, {}, (err) => {
        if (err) {
          res.status(err.status).end();
        }
      });
      return;
    } else if (req.url === `/bin/${opt.style}`) {
      res.sendFile(opt.root + req.url);
      return;
    } else if (req.url.startsWith('/bin/')) {
      for (let [key, val] of keva(this.api.templates)) {
        if (val.filename.includes(req.url)) {
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
  }

  render(options = {}) {
    access.writeOptions(options);
    this.api.keys = access.readKey().then((keys) => {
      return keys;
    });

    return createTemplates().then((data) => {
      this.api.templates = data.templates;
      this.api.structure = data.structure;

      return this.requestHandler;
    });
  }

  addModifier(...args) {
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
  }
}

module.exports = new Frix();
