# atomicms
[![npm version](https://badge.fury.io/js/atomicms.svg)](https://badge.fury.io/js/atomicms)
[![Build Status](https://travis-ci.org/MEH-Design/atomicms.svg?branch=master)](https://travis-ci.org/MEH-Design/atomicms)
[![Dependency Status](https://david-dm.org/MEH-Design/atomicms.svg)](https://david-dm.org/MEH-Design/atomicms)
[![Coverage Status](https://coveralls.io/repos/github/MEH-Design/atomicms/badge.svg?branch=master)](https://coveralls.io/github/MEH-Design/atomicms?branch=master)
[![Code Climate](https://codeclimate.com/repos/574aba91f72f49005f005790/badges/268fb0b8734cc5e8c008/gpa.svg)](https://codeclimate.com/repos/574aba91f72f49005f005790)
[![License](http://img.shields.io/:license-mit-green.svg?style=flat)](http://opensource.org/licenses/MIT)

CMS module inspired by [atomic design](http://bradfrost.com/blog/post/atomic-web-design)

## Example
````
const express = require('express');
let app = express();

const atomic = new require('atomicms')();

app.use(atomic.requestHandler);
````

## API
Atomicms takes an `opts` object specifing the paths of `key.json`, templates, organisms and content, as well as identifiers for attributes.

#### Default
````
{
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
}
````

### Components
Organisms, molecules and atoms can be used in templates using "normal" html syntax, they are located in the folders specified in the `opts` object.

#### Example
##### templates/pages/page.html
````
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title cms-content="title"></title>
  </head>
  <body>
    <organism type="article"/>
  </body>
</html>
````
##### templates/organisms/article.html
````
<article>
  <molecule name="header-en" type="header"/>
  <molecule name="header-de" type="header"/>
  <p cms-content="text"></p>
</article>
````
##### templates/molecules/header.html
````
<header>
  <atom name="heading-en" type="heading"/>
  <atom name="heading-de" type="heading"/>
  <atom type="author"/>
</header>
````
##### templates/atoms/heading.html
````
<h1 cms-content/>
````
##### templates/atoms/author.html
````
<p>written by <span cms-content/></p>
````

### Content
HTML tags in components can contain attributes with a certain prefix (`cms` per default). These attributes can be set in a **content JSON**. Per default `cms-content` refers to the text within the html tag.
#### Example
##### content/page1.json
````
{
  "title" : "atomic",
  "article" : {
    "text": "An atom is the basic unit that makes up all matter.",
    "header": {
      "heading-en": "Atom",
      "author": "https://simple.wikipedia.org/wiki/Atom"
    }
  }
}
````

### Key
`key.json` is where it comes all together. One `template` and `content` are assigned to one url respectively. Both can be used multiple times.
#### Example
##### key.json
````
{
  "/page1": {
    "template": "page",
    "content": "page1"
  },
  "/page2": {
    "template": "page",
    "content": "page2"
  }
}
````

## Installation
````
npm install atomicms
````
