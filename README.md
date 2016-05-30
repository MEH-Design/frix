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

const atomicms = require('atomicms');
let cms = new atomicms();

app.get('*', cms.requestHandler());
````

## API
Atomicms takes an `opts` object specifing the paths of `key.json`, templates, organisms and content.

**Default `opts` object:**
````
{
  key: 'key.json',
  content: 'content',
  template: 'templates',
  organism: 'organisms'
}
````

### key.json
`key.json` is where it comes all together. One `template` and `content` are assigned to one url respectively.

**Example:**
````
{
  '/index': {
    'template': 'index.html',
    'content': 'index.json'
  }
}
````

### Organisms
Organisms can reside in templates and are referenced using ``markup-js`` syntax.

**Example:**

*template [index.html]*
````
<body>
    {{oHeader as header}}
</body>
````

*organism [oHeader.html]*
````
<h1>{{title}}</h1>
<img src={{img}}>
<p><strong>{{content}}</strong></p>
````

*content [index.json]*
````
{
  'header': {
    'title': ...,
    'img': ...,
    'content': ...
  }
}
````

## Installation
````
npm install atomicms
````
