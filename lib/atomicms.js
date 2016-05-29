'use strict';

const fs = require('fs');
const sep = require('path').sep;
const root = require('app-root-path').path + sep;
const mark = require('markup-js');
const og = require('og');

const defaultOpt = {
  key: 'key.json',
  content: 'content',
  template: 'templates',
  organism: 'organisms'
}

class atomicms {
  constructor(opt = defaultOpt) {
    this.opt = opt;
    this.templates = this.createTemplates();
  }

  requestHandler() {
    let cms = this;
    return function(req, res, next) {
      let target = cms.templates[req.url];
      if(target) {
        res.send(target);
      } else {
        next();
      }
    }
  }

  createTemplates() {
    let keyPath = `${root}${this.opt.key}`;
    let keyJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    let templates = {};
    for(let [key, value] of og(keyJson)) {
      templates[key] = this.renderFile(value.template, value.content);
    }
    return templates;
  }

  renderFile(templatePath, contentPath) {
    templatePath = `${root}${this.opt.template}${sep}${templatePath}`;
    contentPath = `${root}${this.opt.content}${sep}${contentPath}`;
    let template = fs.readFileSync(templatePath, 'utf8');
    let content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    let organisms = template.match(/{{.+}}/g).map(this.mapOrganism);
    return this.markup(template, content, organisms);
  }

  mapOrganism(o) {
    let matches = o.match(/{{\[?([A-Za-z,\s]+)\]?\s+as\s+([A-Za-z]+)}}/);
    let noContent = !matches;
    if(noContent) {
      matches = o.match(/{{\[?([A-Za-z,\s]+)\]?\s*}}/);
    }
    let organism = {
      full: matches[0].replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"),
      type: matches[1],
      variable: noContent ? undefined : matches[2]
    };
    if(organism.type.indexOf(',') !== -1) {
      organism.type = organism.type.split(/,\s*/);
    }
    return organism;
  }

  markup(template, content, organisms) {
    let result = template;
    organisms.forEach(o => {
      let oMarkup = this.markupOrganism(o, content[o.variable]);
      result = result.replace(new RegExp(o.full, 'g'), oMarkup);
    });
    return result;
  }

  markupOrganism(o, content) {
    let oPath;
    if(typeof o.type === 'object') {
      oPath = content.type || o.type[0];
    } else {
      oPath = o.type;
    }
    oPath = `${root}${this.opt.organism}${sep}${oPath}.html`;
    let file = fs.readFileSync(oPath, 'utf-8');
    return content ? mark.up(file, content) : file;
  }
}

module.exports = atomicms;
