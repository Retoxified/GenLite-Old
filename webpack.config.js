const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const TerserPlugin = require("terser-webpack-plugin");

const METADATA = fs.readFileSync('./userscript-banner.txt', 'utf8');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
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
                        preamble: METADATA,
                        comments: false
                    },
                },
                extractComments: true,
            })
        ],
    },
};
