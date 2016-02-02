var webpack = require('webpack');

module.exports = {
  entry: {
    index: './src/main/js/index.js'
  },
  output: {
    path: './target/out',
    filename: '[name].js',
    library: 'ES6Model',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel', exclude: /node_modules/}
    ]
  }
};
