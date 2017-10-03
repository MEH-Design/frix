module.exports = {
    "plugins": [
      "promise"
    ],
    "extends": ["eslint:recommended", "google", "plugin:promise/recommended"],
    "env": {
      "es6": true,
      "mocha": true,
      "node": true
    },
    "rules": {
      "max-len": 0,
      "no-loop-func": 0,
      "require-jsdoc": 0,
    }
};
