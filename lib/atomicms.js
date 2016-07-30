'use strict';

const proxyquire = require('proxyquire');
const fs = proxyquire('then-fs', { promise: Promise });
const cheerio = require('cheerio');
const root = require('app-root-path').path + '/';
const keva = require('keva');
const merge = require('merge');


const modules = {
  'html-content': [],
  'json-content': []
}
const defaultOpt = {
  key: 'key.json',
  folders: {
    'organism': 'templates/organisms',
	  'molecule': 'templates/molecules',
	  'atom': 'templates/atoms'
  },
  content: 'content',
  pages: 'templates/pages',
  attributes: {
    name: 'name',
    type: 'type',
    content: 'content',
    prefix: 'cms'
  }
};

module.exports = class Atomic {
  constructor(opt) {
    this.opt = opt ? merge.recursive(defaultOpt, opt) : defaultOpt;
    this._modules = modules;
    this._createRequestHandler();
    this._createTemplates().then(templates => {
      this.templates = templates;
      this.onLoad();
    });
  }

  isDone(onLoad) {
    this.onLoad = onLoad;
  }

  _createRequestHandler() {
    let cms = this;
    this.requestHandler = function(req, res, next) {
      let target = cms.templates[req.url];
      console.log(cms.templates, req.url);
      if(target) {
        res.send(target);
      } else {
        next();
      }
    }
  }

  addModule() {
  	let target;
  	let module;
  	if(typeof arguments[0] === 'object') {
  		target = arguments[0].target;
  		module = arguments[0].module;
  	} else {
  		target = arguments[0];
  		module = arguments[1];
  	}

  	this._modules[target].push(module);
  }

  _createTemplates() {
    let keyPath = `${root}${this.opt.key}`;
    return fs.readFile(keyPath, 'utf8').then(keyJson => {
      let templates = {};
      let promises = [];
      for(let [key, value] of keva(keyJson)) {
        promises.push(this._renderFile(value.template, value.content).then(template => {
          return {key: key, template: template};
        }));
      }

      return Promise.all(promises).then(rendered => {
        rendered.forEach(render => {
          templates[render.key] = render.template;
        })
        return templates;
      });
    });
  }

  _renderFile(templatePath, contentPath) {
    templatePath = `${root}${this.opt.pages}/${templatePath}`;
    contentPath = `${root}${this.opt.content}/${contentPath}`;
    return Promise.all([
      fs.readFile(templatePath, 'utf8'),
      fs.readFile(contentPath, 'utf8')
    ]).then(([template, content]) => {
      return this._resolveElements(template, JSON.parse(content), cheerio.load(template));
    });
  }

  _resolveElements(template, content, $, depth = 0) {
  	jsdom.env(template, (err, window) => {
  		if(err) throw err;

  		let promises = [];
  		let currentKey = Object.keys(this.opt.folders)[depth];

  		Array.from(document.querySelectorAll(currentKey)).forEach(query => {
  			let name = query.getAttribute(`${opt.attributes.name}`);
  			let type = query.getAttribute(`${opt.attributes.type}`);
  			let currentContent = content[name || type];

  			Array.from(query.attributes).forEach(attribute => {
  				let match = attribute.name.match(new RegExp(`^${opt.attributes.prefix}-(\w+)`));
  				if(match) currentContent[match[1]] = attribute.value;
  			});

  			promises.push(fs.readFile(`${root}/${this.opts.folders[currentKey]}/${type}.html`, 'utf8').then(template => {
          let $ = cheerio.load(template);
          template = this._insertContent(template, currentContent, $);

					return depth < Object.keys(this.opt.folders).length - 1
						? this._resolveElements(template, currentContent, $, depth + 1)
						: template;
  			}).then(html => ({node: query, html: html})));
  		});

  		return Promise.all(promises).then((data) => {
  			data.forEach(element => {
  				element.node.outerHTML = element.html;
  			});
  			window.close();
  			return document.querySelector('body').innerHTML;
  		});
  	});
  };

  _insertContent(template, data, $) {
    //TODO: body *[cms-] ?
    let elements = document.querySelectorAll('body *');

  	Array.from(elements).forEach(element => {
  		Array.from(element.attributes).forEach(attribute => {
  			let match = attribute.name.match(/^cms-(\w+)/);
  			if(match) {
  				element.removeAttribute(attribute.name);
  				if(match[1] === this.opts.attributes.content) {
  					let html = data[attribute.value];
  					html = this._applyModules(html, 'html-content');
  					element.innerHTML = html;
  				} else {
  					element.setAttribute(match[1], data[attribute.value]);
  				}
  			}
  		});
  	});
  	return template;
  };

  _applyModules(target, name) {
  	if(this._modules[name].length > 0) {
  		return this._modules[name].reduce((a, b) => {
  			return b(a);
  		}, target);
  	}
  	return target;
  }

};
