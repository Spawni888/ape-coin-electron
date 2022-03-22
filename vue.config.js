// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['ngrok', 'ws', 'elliptic'],
      nodeIntegration: true,
      builderOptions: {
        asar: false,
        // asarUnpack: ['./node_modules'],
        // unpackDir: './test',
        // extraResources: [
        //   './node_modules/ws',
        //   './node_modules/async-limiter',
        // ],
        extraFiles: [
          // {
          //   from: 'node_modules/ngrok/bin',
          //   to: 'resources/ngrok/bin',
          //   filter: ['**/*'],
          // },
          {
            from: 'src/resources',
            to: 'resources/app',
            filter: ['**/*'],
          },
        ],
        win: {
          icon: path.resolve(__dirname, './src/assets/icon.png'),
        },
        mac: {
          icon: path.resolve(__dirname, './src/assets/icon.icns'),
          type: 'distribution',
        },
      },
    },
  },
  lintOnSave: process.env.NODE_ENV !== 'production',
  css: {
    extract: false,
    loaderOptions: {
      sass: {
        prependData:
          '@import "@/assets/styles/main.scss";',
      },
    },
  },
  configureWebpack: (config) => {
    // eslint-disable-next-line no-param-reassign
    config.entry = {
      app: [
        './src/main.js',
      ],
    };
    // eslint-disable-next-line no-unused-expressions
    config.module.rules = [
      ...config.module.rules,
      {
        test: /node_modules[/\\](iconv-lite)[/\\].+/,
        resolve: {
          aliasFields: ['main'],
        },
      },
    ];
    config.resolve = {
      ...config.resolve,
      mainFields: ['main', 'browser'],
      extensions: [
        '.wasm',
        '.mjs',
        '.js',
        '.jsx',
        '.vue',
        '.json',
      ],
      modules: [
        'node_modules',
        path.resolve(__dirname, './node_modules'),
      ],
    };
    // config.devServer = {
    //   ...config.devServer,
    //   watchOptions: {
    //     poll: true,
    //   },
    //   proxy: {
    //     '/api': {
    //       target: 'http://localhost:3000',
    //     },
    //   },
    // };

    // config.plugins = [
    //   ...config.plugins,
    //   new CopyWebpackPlugin({
    //     patterns: [
    //       {
    //         from: 'frontend/src/static',
    //         to: 'static',
    //       },
    //     ],
    //   }),
    //   new HtmlWebpackPlugin({
    //     filename: 'index.html',
    //     title: 'split-music',
    //     favicon: path.resolve(__dirname, './frontend/public/favicon.png'),
    //     template: path.resolve(__dirname, './frontend/public/index.html'),
    //     inject: true,
    //   }),
    // ];
  },
};
