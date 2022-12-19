const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const METADATA = fs.readFileSync('./userscript-banner.txt', 'utf8');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                uglifyOptions: {
                    output: {
                        beautify: false,
                        preamble: METADATA,
                    },
                },
            }),
        ],
    },
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: METADATA
        })
    ]
};
