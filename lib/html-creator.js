const cheerio = require('cheerio');
const decb = require('decb');
const opt = require('./frix.conf.js');
const fs = decb(require('fs'), {
  use: ['readFile', 'writeFile']
});
const keva = require('keva');

module.exports = class HTMLCreator {
  constructor(prefixes, modifiers) {
    this.prefixes = prefixes;
    this.modifiers = modifiers;
  }

  create(key, value) {
    return this.renderFile(value.template, value.content)
    .then(template => {
      return {
        key: key,
        template: template,
        file: `${opt.root}bin/` + value.template
      };
    });
  }

  renderFile(templatePath, contentPath) {
    templatePath = `${opt.root}${opt.structure.pages}/${templatePath}`;
    contentPath = `${opt.root}${opt.content}/${contentPath}`;
    return Promise.all([
      fs.readFile(templatePath, 'utf8'),
      fs.readFile(contentPath, 'utf8')
    ]).then(values => {
      let [template, content] = values;
      return this.resolveElements(template, JSON.parse(content));
    });
  }

  resolveElements(template, content, depth = 0) {
    let $ = cheerio.load(template, {
      xmlMode: true
    });
    template = this.insertContent(content, $);

    if (depth > Object.keys(opt.structure.folders).length - 1) {
      return template;
    }

    let promises = [];
    let level = Object.keys(opt.structure.folders)[depth];
    $('loop').each((_, loop) => {
      let name = $(loop).attr(`${opt.attributes.name}`);
      let elements = content[name];
      let html = $(loop).html();
      $(loop).empty();

      for (let i = 0; i < elements.length; i++) {
        $(loop).append(html);
        $(loop).find('target')
          .replaceWith(`<${level} type="${elements[i].type}">`);
      }
    });
    $(level).each((_, elem) => {
      let name = $(elem).attr(`${opt.attributes.name}`);
      let type = $(elem).attr(`${opt.attributes.type}`);
      let loopParent = $(elem).parents('loop').get(0);
      let currentContent;

      if (loopParent) {
        let loop = content[$(loopParent).attr(`${opt.attributes.name}`)];
        currentContent = loop.shift().data;
      } else {
        currentContent = content[name || type];
      }

      for (let [name, value] of keva(elem.attribs)) {
        let match = name.match(new RegExp(`^cms-(\w+)`));
        if (match) currentContent[match[1]] = value;
      }

      promises.push(
        fs.readFile(`${opt.root}${opt.structure.folders[level]}/${type}.html`, 'utf8')
        .then(template => {
          return this.resolveElements(template, currentContent, depth + 1);
        }).then(html => ({node: elem, html: html})));
    });

    return Promise.all(promises).then(data => {
      data.forEach(elem => {
        $(elem.node).replaceWith(elem.html);
      });
      $('loop').each((_, loop) => $(loop).replaceWith($(loop).html()));
      return $.html();
    });
  }

  insertContent(data, $) {
    $('*').each((_, elem) => {
      for (let [name, value] of keva(elem.attribs)) {
        let match = name.match(/^(\w+)-(\w+)/);
        let toInsert = typeof data === 'string' ? data : data[value];
        if (match) {
          if (!this.prefixes[match[1]].test(toInsert)) {
            throw new Error(
              `"${toInsert}" did not match "${this.prefixes[match[1]]}"`
            );
          }
          $(elem).removeAttr(name);
          if (match[2] === opt.attributes.content) {
            let html = toInsert;
            html = this.applyModifiers(html, 'content');
            $(elem).html(html);
          } else {
            $(elem).attr(match[2], toInsert);
          }
        }
      }
    });
    return $.html();
  }

  applyModifiers(target, name) {
    if (this.modifiers[name].length > 0) {
      return this.modifiers[name].reduce((a, b) => {
        return b(a);
      }, target);
    }
    return target;
  }
};
