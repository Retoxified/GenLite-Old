const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const METADATA = fs.readFileSync('./userscript-banner.txt', 'utf8');

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
