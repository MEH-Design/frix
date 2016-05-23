'use strict';
require('use-strict');

const fs = require('fs');
const root = require('app-root-path');
const sep = require('path').sep;
const mark = require('markup-js');
const og = require('og');

const defaultOpt = {
  key: 'key.json',
  content: 'content',
  template: 'templates',
  organism: 'organisms'
}

module.exports = class {
  constructor(opt = defaultOpt) {
    this.opt = opt;
    this.templates = createTemplates();
  }

  get requestHandler() {
    return requestHandler;
  }

  get templates() {
    return templates;
  }

  requestHandler(req, res, next) {
    let target = templates[req.url];
    if(target) {
      res.send(target.html);
    } else {
      next();
    }
  }

  createTemplates() {
    let keyPath = '${root}${sep}${opt.key}';
    let keyJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    let templates = {};
    for(let [key, value] of og(keyJson)) {
      templates[key] = renderFile(value.template, value.content);
    }
    return templates;
  }

  renderFile(templatePath, contentPath) {
    let templatePath = '${root}${sep}${opt.template}${sep}${templatePath}';
    let contentPath = '${root}${sep}${opt.content}${sep}${contentPath}';
    let template = fs.readFileSync(templatePath, 'utf8');
    let content = fs.readFileSync(contentPath, 'utf8');
    let organisms = template.match(/{{.+}}/g).map(mapOrganism);
    return markup(template, content, organisms);
  }

  mapOrganism(o) {
    let matches = o.match(/{{\[?([A-Za-z,\s]+)\]?\s+as\s+([A-Za-z]+)}}/);
    let organism = {
      full: matches[0],
      type: matches[1],
      variable: matches[2]      
    };
    if(organsim.type.indexOf(',')) {
      organism.type = organism.type.split(/,\s*/);
    }
    //escape characters to prevent misinterpretation by RegExp
    organsim.full = organsim.full.split('').map(c => {
      return (/[\[\]]/.test(c) ? '\\' : '') + c;
    });
    return organism;
  }

  markup(template, content, organisms) {
    let r = template;
    organisms.forEach(o => {
      let oMarkup = markupOrganism(o, content[o.variable]);
      result = result.replace(new RegExp(o.full, 'g'), oMarkup);
    });
    return result;
  }

  markupOrganism(o, content) {
    let oPath;
    if(typeof o.organism === 'object') {
      oPath = content.organism || o.organism[0];   
    } else {
      oPath = o.organism;
    }
    oPath = '${root}${sep}${opt.organism}${sep}${oPath}.html';
    let file = fs.readFileSync(oPath, 'utf-8');
    return mark.up(file, content);
  }
}
