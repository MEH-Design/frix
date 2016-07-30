'use strict';

const fs = require('fs');
const sep = require('path').sep;
const root = require('app-root-path').path + sep;
const keva = require('keva');
const jsdom = require('jsdom');

const defaultOpt = {
  key: 'key.json',
  folders: {
    'cms-organism': 'templates/organisms',
	  'cms-molecule': 'templates/molecules',
	  'cms-atom': 'templates/atoms'
  },
  content: 'content',
  pages: 'templates/pages',
  attributes: {
    name: 'name',
    type: 'type',
    prefix: 'cms'
  }
};

//TODO: remove hardcoded attributes
module.exports = class Atomic {
  constructor(opt = defaultOpt) {
    //TODO: accept partial opt (maybe with keva)
    this.opt = opt;
    this._createTemplates().then(templates => {
      this.templates = templates;
      this.onLoad();
    });
  }

  isDone(onLoad) {
    this.onLoad = onLoad;
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

  	modules[target].push(module);
  }

  _createTemplates() {
    let keyPath = `${root}${this.opt.key}`;
    let keyJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
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
  }

  _renderFile(templatePath, contentPath) {
    templatePath = `${root}${this.opt.template}${sep}${templatePath}`;
    contentPath = `${root}${this.opt.content}${sep}${contentPath}`;
    let template = fs.readFileSync(templatePath, 'utf8');
    let content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

	  jsdom.env(template, (err, window) => {
		  if(err) throw err;

		  content = this._applyModules(content, 'json-content');
		  return this._resolveElements(template, content, window.document);
	  });
  }

  _resolveElements(template, content, document, depth = 0) {
  	jsdom.env(template, (err, window) => {
  		if(err) throw err;

  		let promises = [];
  		let currentKey = Object.keys(config)[depth];

  		Array.from(document.querySelectorAll(currentKey)).forEach(query => {
        //TODO: take values from opt
  			let name = query.getAttribute(`${opt.attributes.name}`);
  			let type = query.getAttribute(`${opt.attributes.type}`);
  			let currentContent = content[name];

  			Array.from(query.attributes).forEach(attribute => {
          //TODO: take prefix from opt
  				let match = attribute.name.match(new RegExp(`^${opt.attributes.prefix}-(\w+)`));
  				if(match) currentContent[match[1]] = attribute.value;
  			});

  			promises.push(new Promise((resolve, reject) => {
  				fs.readFile(__dirname + `/../templates/${config[currentKey]}/${type}.html`, 'utf8', (err, template) => {
  					if(err) reject(err);

  					jsdom.env(template, (err, window) => {
  						if(err) reject(err);

  						let document = window.document;
  						template = this._insertContent(template, currentContent, document);

  						resolve(depth < Object.keys(config).length - 1
  							? this._resolveElements(template, currentContent, document, depth + 1)
  							: template);
  					});
  				});
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

  _insertContent(template, data, document) {
    //TODO: body *[cms-] ?
    let elements = document.querySelectorAll('body *');

  	Array.from(elements).forEach(element => {
  		Array.from(element.attributes).forEach(attribute => {
  			let match = attribute.name.match(/^cms-(\w+)/);
  			if(match) {
  				element.removeAttribute(attribute.name);
  				if(match[1] === 'content') {
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
  	if(modules[name].length > 0) {
  		return modules[name].reduce((a, b) => {
  			return b(a);
  		}, target);
  	}
  	return target;
  }

};
