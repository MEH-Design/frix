const cheerio = require('cheerio');
const keva = require('keva');
const access = require('./access');
const opt = access.readConfig();

module.exports = class HTMLCreator {
  constructor() {
    this.prefixes = access.readPrefixes();
  }

  create(key, value) {
    return this.renderFile(value).then((template) => {
      return {
        key: key,
        template: template.html,
        structure: template.structure,
        file: `${opt.root}bin/` + /(.*)\..*$/.exec(value.content)[1] + '.html',
      };
    });
  }

  renderFile(pageLocation) {
    return access.readPageData(pageLocation).then((data) => {
      let element = {
        template: data.template,
        content: data.content,
        type: pageLocation.name,
      };
      return this.resolveElements(element).then((html) => {
        if(access.readOptions().dev) {
          // replaces dev with data-dev (cheerio seems to bug with data attributes)
          // see http://regexr.com/3eoqv
          html = html.replace(/dev/g, 'data-dev');
          // html = html.replace(/(<.*\s)dev(=*\/?.*>)/g, '$1data-dev$2');
        }
        return {
          structure: data.content,
          html: html,
        };
      });
    });
  }

  resolveElements(element, depth = 0, nextKey, parentKey) {
    let $ = cheerio.load(element.template, {
      xmlMode: true,
    });
    if(parentKey && nextKey) {
      parentKey = `${parentKey} ${nextKey}`;
    } else if(nextKey) {
      parentKey = nextKey;
    }
    let rootChildren = $.root().children();
    if (depth > 0) {
      if (rootChildren.length > 1) {
        throw new Error('Elements must be wrapped in an enclosing tag');
      }
      $(rootChildren[0]).addClass(element.type);
    }
    this.insertContent(element.content, $, {
      key: access.readOptions().dev ? parentKey : null,
    });
    let promises = [];
    let level = Object.keys(opt.structure.folders)[depth];
    $('loop').each((_, loop) => {
      let name = $(loop).attr(`${opt.attributes.name}`);
      let elements = element.content[name];
      for (let i = 0; i < elements.length; i++) {
        if (typeof elements[i].data === 'string') {
          elements[i].data = {
            value: elements[i].data,
            single: true,
          };
        }
        elements[i].generate = true;
      }
      let html = $(loop).html();
      $(loop).empty();

      for (let i = 0; i < elements.length; i++) {
        $(loop).append(html);
        $(loop).find('target')
          .replaceWith(`<${level} loop-count=${i} type="${elements[i].type}">`);
      }
    });
    $(level).each((_, elem) => {
      let name = $(elem).attr(`${opt.attributes.name}`);
      let type = $(elem).attr(`${opt.attributes.type}`);
      let loopParent = $(elem).parents('loop').get(0);
      let currentContent;
      let nextKey;

      if (loopParent) {
        if(access.readOptions().dev) {
          nextKey = $(elem).attr('loop-count');
        }
        let loop = element.content[$(loopParent).attr(`${opt.attributes.name}`)];
        loop = loop.filter((loopElem) => loopElem.generate);
        delete loop[0].generate;
        currentContent = loop[0].data;
      } else {
        nextKey = name || type;
        if (typeof element.content[nextKey] === 'string') {
          element.content[nextKey] = {
            value: element.content[nextKey],
            single: true,
          };
        }
        currentContent = element.content[nextKey];
      }

      for (let [name, value] of keva(elem.attribs)) {
        let match = name.match(new RegExp(`^cms-(\w+)`));
        if (match) currentContent[match[1]] = value;
      }

      promises.push(
        access.readElement(level, `${type}.html`).then((template) => {
          return this.resolveElements({
            type: type,
            template: template,
            content: currentContent,
          }, depth + 1, nextKey, parentKey);
        }).then((html) => ({node: elem, html: html})));
    });

    return Promise.all(promises).then((data) => {
      data.forEach((elem) => {
        $(elem.node).replaceWith(elem.html);
      });
      $('loop').each((_, loop) => $(loop).replaceWith($(loop).html()));
      return $.html();
    });
  }

    insertContent(data, $, options) {
    $('*').each((_, elem) => {
      for (let [name, value] of keva(elem.attribs)) {
        let match = name.match(/^(\w+)-(.+)/);
        if (match && this.prefixes[match[1]]) {
          let toInsert;
          if (data.single) {
            toInsert = data.value;
          } else if(data[value]) {
            if (typeof data[value] === 'string') {
              toInsert = data[value];
            } else {
              toInsert = data[value].value;
            }
          }
          if (!this.prefixes[match[1]].test(toInsert)) {
            throw new Error(
              `"${toInsert}" did not match the prefix "${match[1]}"`
            );
          }
          if (data.single) {
            data.value = toInsert;
            data.type = match[1];
            delete data.single;
          } else if (typeof data[value] === 'string') {
            data[value] = {
              value: toInsert,
              type: match[1],
            };
          }
          $(elem).removeAttr(name);
          if (match[2] === opt.attributes.content) {
            let html = toInsert;
            $(elem).html(html);
          } else {
            $(elem).attr(match[2], toInsert);
          }
          if(options.key) {
            if(!$(elem).attr(`dev`)) {
              $(elem).attr(`dev`, options.key);
            }
            $(elem).attr('dev-targets',
              ($(elem).attr('dev-targets') || '') +
              ' ' +
              name +
              (value ? `:${value}` : '')
            );
          }
        }
      }
    });
    return data;
  }
};
