const glob = require("glob");

module.exports = {
  entry: glob.sync("./templates/**/*.css"),
  output: {
    filename: "bin/style.css"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  }
};
