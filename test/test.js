'use strict';

const expect = require('chai').expect;
const mock = require('mock-fs');
const proxyquire = require('proxyquire');
const atomicms = proxyquire('../lib/atomicms', { 'app-root-path': { path: 'test' } });;
const loremIpsum = require('lorem-ipsum');
const fs = require('fs');

let keyJson = {
  '/index': {
    'template': 'index.html',
    'content': 'index.json'
  },
  '/home': {
    'template': 'index.html',
    'content': 'home.json'
  }
};

let template = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test</title>
  </head>
  <body>
    <h1>This is a Test.</h1>
    {{oHeader as header}}

    <p>This is in the template.</p>
    {{oBody as body}}
  </body>
</html>
`;

let oBody = '<p>{{paragraph}}</p>';

let oHeader = `
<h1>{{title}}</h1>
<img src={{img}}>
<p><strong>{{content}}</strong></p>
`;

let indexJson = {
  'header': {
    'title': 'index',
    'img': 'https://unsplash.it/200/300?image=0',
    'content': loremIpsum({count: 3, units: 'sentences'})
  },
  'body': {
    'paragraph': loremIpsum({count: 3, units: 'paragraphs'})
  }
}

let homeJson = {
  'header': {
    'title': 'home',
    'img': 'https://unsplash.it/200/300?image=1',
    'content': loremIpsum({count: 3, units: 'sentences'})
  },
  'body': {
    'paragraph': loremIpsum({count: 3, units: 'paragraphs'})
  }
}

mock({
  'test': {
    'key.json': JSON.stringify(keyJson),
    'templates': {
      'index.html': template
    },
    'organisms': {
      'oBody.html': oBody,
      'oHeader.html': oHeader
    },
    'content' : {
      'index.json': JSON.stringify(indexJson),
      'home.json': JSON.stringify(homeJson)
    }
  }
});

describe('#atomicms', () => {
  it('should have default key', () => {
    let a = new atomicms();
    expect(a.opt).to.have.property('key');
  });
  it('should have default content', () => {
    let a = new atomicms();
    expect(a.opt).to.have.property('content');
  });
  it('should have default template', () => {
    let a = new atomicms();
    expect(a.opt).to.have.property('template');
  });
  it('should have default organism', () => {
    let a = new atomicms();
    expect(a.opt).to.have.property('organism');
  });
});
