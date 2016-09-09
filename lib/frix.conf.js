module.exports = {
  root: require('app-root-path').path + '/',
  key: 'key.json',
  prefix: 'prefix.js',
  structure: {
    folders: {
      organism: 'templates/organisms',
      molecule: 'templates/molecules',
      atom: 'templates/atoms'
    },
    pages: 'templates/pages'
  },
  content: 'content',
  attributes: {
    name: 'name',
    type: 'type',
    content: 'content'
  }
};
