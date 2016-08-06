# atomicms
[![npm version](https://badge.fury.io/js/atomicms.svg)](https://badge.fury.io/js/atomicms)
[![Build Status](https://travis-ci.org/MEH-Design/atomicms.svg?branch=master)](https://travis-ci.org/MEH-Design/atomicms)
[![Dependency Status](https://david-dm.org/MEH-Design/atomicms.svg)](https://david-dm.org/MEH-Design/atomicms)
[![Coverage Status](https://coveralls.io/repos/github/MEH-Design/atomicms/badge.svg?branch=master)](https://coveralls.io/github/MEH-Design/atomicms?branch=master)
[![Code Climate](https://codeclimate.com/repos/574aba91f72f49005f005790/badges/268fb0b8734cc5e8c008/gpa.svg)](https://codeclimate.com/repos/574aba91f72f49005f005790)
[![License](http://img.shields.io/:license-mit-green.svg?style=flat)](http://opensource.org/licenses/MIT)

A lightweight, modular CMS inspired by Brad Frost's [Atomic Design](http://bradfrost.com/blog/post/atomic-web-design) for Express and Node.js

## Basics

With Atomicms there is a number of default components:
  - Pages
  - Templates
  - Organisms
  - Molecules
  - Atoms

### Templates

Templates consist of organisms but can, like all components, contain normal HTML too. An organism should, as described in Brad Frost's article, be a distinct section of the interface. For example an article.

### Molecules, Atoms, etc.

Every Component in Atomicms can contain components that are one level lower, for Templates, this would be Organisms, for Organsims Molecules and so on. This goes on until the most basic components - in the default case, this is an Atom - which contains only valid HTML.

### Pages

Pages are instances of templates using the content from a specified JSON file and resolving all the organisms to valid HTML. This is what the end user sees.

### Modules

Modules are a number of functions to be executed whenever a specific type of content is set. At the moment `html-content` and `json-content` exist. 
- `html-content` is called everytime the inner HTML of an element is set.
- `json-content` is called for every entry in all content files.

###So how does it all work out?

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

```js
  const express = require('express');
  const Atomicms = require('atomicms');
  let atomicms = new Atomicms();
  let app = express();
  
  app.use(atomicms.requestHandler);
```

Note that the class `Atomicms` takes an optional config as first argument which describes where all dependencies like the `key.json`, templates, content etc. are stored.

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
