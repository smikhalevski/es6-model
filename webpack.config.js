var webpack = require('webpack');

module.exports = {
  entry: {
    index: './src/main/js/index.js'
  },
  output: {
    path: './target/out',
    filename: '[name].js',
    chunkFilename: './chunks/[name].js'
  },
  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel', exclude: /node_modules/}
    ]
  }
};
