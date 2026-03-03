const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  ...webpack.config,
  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "url": false,
      "zlib": false,
      "http": false,
      "https": false,
      "net": false,
      "tls": false,
      "fs": false,
      "path": false,
      "os": false,
      "util": false,
      "dns": false,
      "child_process": false
    }
  },
  plugins: [
    new NodePolyfillPlugin()
  ]
};
