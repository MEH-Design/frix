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
      return this._resolveElements(template, JSON.parse(content));
    });
  }

  _resolveElements(template, content, depth = 0) {
  	if(err) throw err;

    let $ = cheerio.load(template);
    template = this._insertContent(content, $);

    let promises = [];
  	let level = Object.keys(this.opt.folders)[depth];

  	$(level).each(function() {
  		let name = this.attr(`${opt.attributes.name}`);
  		let type = this.attr(`${opt.attributes.type}`);
  		content = content[name || type];

  		for(let [name, value] of $(this).attribs) {
  			let match = name.match(new RegExp(`^${opt.attributes.prefix}-(\w+)`));
  			if(match) content[match[1]] = value;
  		}

  		promises.push(fs.readFile(`${root}/${this.opts.folders[currentKey]}/${type}.html`, 'utf8').then(template => {
				return depth < Object.keys(this.opt.folders).length - 1
					? this._resolveElements(template, content, depth + 1)
					: template;
  		}).then(html => ({node: this, html: html})));
  	});

		return Promise.all(promises).then(data => {
			data.forEach(element => {
				element.replaceWith(element.html);
			});
			return $('body').html();
		});
  };

  _insertContent(data, $) {
    //TODO: consider using .filter for ignoring elements without

  	$('body *[]').each(function() {
  		for([key, value] of $(this).attribs) {
  			let match = name.match(/^cms-(\w+)/);
  			if(match) {
  				this.removeAttr(name);
  				if(match[1] === this.opts.attributes.content) {
  					let html = data[value];
  					html = this._applyModules(html, 'html-content');
  					this.replaceWith(html);
  				} else {
  					this.attr(match[1], data[value]);
  				}
  			}
  		}
  	});

  	return $('body').html();
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
