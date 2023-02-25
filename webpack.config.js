const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const TerserPlugin = require("terser-webpack-plugin");
const PACKAGE = require('./package.json');
let METADATA = fs.readFileSync('./userscript-banner.txt', 'utf8').replace('${version}', PACKAGE.version);

module.exports = {
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
    entry: './src/index.ts',
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
};
