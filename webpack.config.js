/*
    Copyright (C) 2023 dpeGit, KKonaOG
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/
const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const XMLHttpRequest = require('./node_modules/xmlhttprequest');

const TerserPlugin = require("terser-webpack-plugin");
const PACKAGE = require('../GenLite/package.json');
let METADATA = fs.readFileSync('./userscript-banner.txt', 'utf8').replace('${version}', PACKAGE.version);

// Open README.md and replace version string
let readme = fs.readFileSync('./README.md', 'utf8');

// Version String in README
// # GenLite 0.1.28 - For GenFanad
// Look for match on the last set of numbers and increment by 1
let versionString = readme.match(/# GenLite [0-9.]+(-[0-9]+)? - For GenFanad/)[0];

// PACKAGE.version = 0.1.28
let newVersionString = versionString.replace(/[0-9.]+(-[0-9]+)?/, PACKAGE.version);

// Update README with latest version
readme = readme.replace(versionString, newVersionString);

// Write README.md
fs.writeFileSync('./README.md', readme);

module.exports = (env, argv) => {
  let modules = [];
  if (argv.mode === 'production') {
    modules.push(
      {
        mode: 'production',
        resolve: {
          extensions: ['.ts', '.js', '.json']
        },
        module: {
          rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              exclude: /node_modules/,
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
              test: /\.js$/,
              loader: "source-map-loader"
            }
          ]
        },
        entry: './src/Client/index.ts',
        output: {
          filename: 'genliteClient.user.js',
          path: path.resolve(__dirname, 'dist'),
        },
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                output: {
                  beautify: false,
                  comments: false
                },
              },
              extractComments: true,
            })
          ],
        },
      });
  } else {
    modules.push(
      {
        mode: 'development',
        resolve: {
          extensions: ['.ts', '.js', '.json']
        },
        module: {
          rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              exclude: /node_modules/,
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
              test: /\.js$/,
              loader: "source-map-loader"
            }
          ]
        },
        entry: './src/Client/index.ts',
        output: {
          filename: 'genlite.dev.user.js',
          path: path.resolve(__dirname, 'dist'),
        },
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                output: {
                  beautify: false,
                  preamble: METADATA,
                  comments: false
                },
              },
              extractComments: true,
            })
          ],
        },
        plugins: [
          new webpack.BannerPlugin({
            raw: true,
            banner: METADATA
          })
        ]
      });
  };

  let configStuff
  if (env.type == "development") {
    configStuff = require('./configStuff.json');
  }
  let repoOwner;
  if (env.type == 'development') {
    repoOwner = configStuff.repository_owner;
  } else {
    repoOwner = process.env.repoOwner;
  }
  let githubConfig = {};
  githubConfig.type = env.type;
  githubConfig.repoOwner = repoOwner;
  fs.writeFileSync('./src/Loader/githubConfig.json', JSON.stringify(githubConfig));
  modules.push(
    {
      mode: 'production',
      resolve: {
        extensions: ['.ts', '.js', '.json']
      },
      module: {
        rules: [
          // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
          },
          // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
          {
            test: /\.js$/,
            loader: "source-map-loader"
          }
        ]
      },
      entry: './src/Loader/',
      output: {
        filename: 'genlite.user.js',
        path: path.resolve(__dirname, 'dist'),
      },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              output: {
                beautify: false,
                preamble: METADATA,
                comments: false
              },
            },
            extractComments: true,
          })
        ],
      },
      plugins: [
        new webpack.BannerPlugin({
          raw: true,
          banner: METADATA
        })
      ]
    });
  return modules;
};
