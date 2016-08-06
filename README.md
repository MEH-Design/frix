# atomicms
[![npm version](https://img.shields.io/badge/npm%20package-none-lightgrey.svg)](https://img.shields.io/badge/npm%20package-none-lightgrey.svg)
[![Build Status](https://travis-ci.org/MEH-Design/atomicms.svg?branch=html-syntax)](https://travis-ci.org/MEH-Design/atomicms)
[![Dependency Status](https://david-dm.org/MEH-Design/atomicms/html-syntax.svg)](https://david-dm.org/MEH-Design/atomicms/html-syntax)
[![DevDependency Status](https://david-dm.org/MEH-Design/atomicms/html-syntax/dev-status.svg)](https://david-dm.org/MEH-Design/atomicms/html-syntax?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/MEH-Design/atomicms/badge.svg?branch=html-syntax)](https://coveralls.io/github/MEH-Design/atomicms?branch=html-syntax)
[![License](http://img.shields.io/:license-mit-green.svg?style=flat)](http://opensource.org/licenses/MIT)

<img align="right" height="200" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMTE5LjggNTUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDExOS44IDU1OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0ZGRkZGRjtzdHJva2U6Izk2QTM4NTtzdHJva2Utd2lkdGg6NjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9Cgkuc3Qxe2ZpbGw6I0Y5RjVCRTtzdHJva2U6Izk2QTM4NTtzdHJva2Utd2lkdGg6NztzdHJva2UtbWl0ZXJsaW1pdDoxMDt9Cgkuc3Qye2ZpbGw6I0ZGRkZGRjtzdHJva2U6I0YwNkQ2NTtzdHJva2Utd2lkdGg6NztzdHJva2UtbWl0ZXJsaW1pdDoxMDt9Cjwvc3R5bGU+CjxsaW5lIGlkPSJYTUxJRF82XyIgY2xhc3M9InN0MCIgeDE9IjQ1LjMiIHkxPSI4LjciIHgyPSIyLjciIHkyPSI1MS4zIi8+CjxsaW5lIGlkPSJYTUxJRF84XyIgY2xhc3M9InN0MCIgeDE9IjExNy43IiB5MT0iMy45IiB4Mj0iNzUuOSIgeTI9IjQ1LjciLz4KPGNpcmNsZSBpZD0iWE1MSURfMTBfIiBjbGFzcz0ic3QxIiBjeD0iNjAuMyIgY3k9IjI3LjYiIHI9IjIzLjciLz4KPGNpcmNsZSBpZD0iWE1MSURfN18iIGNsYXNzPSJzdDIiIGN4PSI2MC4zIiBjeT0iMjcuNiIgcj0iMy40Ii8+Cjwvc3ZnPg==">

A lightweight, modular CMS inspired by Brad Frost's [Atomic Design](http://bradfrost.com/blog/post/atomic-web-design) for Express and Node.js

## Basics

With Atomicms there is a number of default components:
  - Pages
  - Templates
  - Organisms
  - Molecules
  - Atoms

#### Templates

Templates consist of organisms but can, like all components, contain normal HTML too. An organism should, as described in Brad Frost's article, be a distinct section of the interface. For example an article.

#### Molecules, Atoms, etc.

Every Component in Atomicms can contain components that are one level lower, for Templates, this would be Organisms, for Organsims Molecules and so on. This goes on until the most basic components - in the default case, this is an Atom - which contains only valid HTML.

#### Pages

Pages are instances of templates using the content from a specified JSON file and resolving all the organisms to valid HTML. This is what the end user sees.

#### Modules

Modules are a number of functions to be executed whenever a specific type of content is set. At the moment `html-content` and `json-content` exist. 
- `html-content` is called everytime the inner HTML of an element is set.
- `json-content` is called for every entry in all content files.

#### So how does it all work out?

There has to be a `key.json` to choose a URL with which a template and JSON file are associated like this:

```js
{
  "/index": {
    "template": "index.html"
    "content": "main.json"
  }
}
```

This serves our `index.html` with inserted content and resolved organisms - so, valid HTML. The templates get resolved when the Node.js server starts, so theres practically no overhead when serving files during runtime.

## Example Usage

#### Server Code

```js
  const express = require('express');
  const Atomicms = require('atomicms');
  let atomicms = new Atomicms();
  let app = express();
  
  app.use(atomicms.requestHandler);
```

Note that the class `Atomicms` takes an optional config as first argument which describes where all dependencies like the `key.json`, templates, content etc. are stored.

#### File System

See the example files at `/test/files`.
The produced output when getting '/page1' is:
```html
  <todo />
```

## Installation

`$ npm install atomicms`

## API Reference

#### new Atomicms([opts])
  - opts `Object` a config to be merged with the default one: 
  
```js
  {
    key: 'key.json',  
    folders: {  
      organism: 'templates/organisms',
      molecule: 'templates/molecules',
      atom: 'templates/atoms'
    },
    content: 'content',
    pages: 'templates/pages',
    attributes: {
      name: 'name',
      type: 'type',
      content: 'content'
  } 
```
Returns a new instance of Atomicms.
  
#### atomicms.addModule(target, module)
  - target `String` the target module(see <a name="Modules">Modules</a>)
  - module `Function` a function to add to the modules Array for the target. The modules array is executed in chronological order.

#### atomicms.addModule({ target, module })
  - target `String` the target module(see <a name="Modules">Modules</a>)
  - module `Function` a function to add to the modules Array for the target. The modules array is executed in chronological order.

#### atomicms.isDone(onLoad)
  - onLoad `Function` a function to be executed when Atomicms has finished resolving all templates and inserting content.
  
## License

MIT
