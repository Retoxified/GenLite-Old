# GenLite 0.2.17 - For GenFanad

GenLite installation instructions
1. Install [TamperMonkey(All Browsers)](https://www.tampermonkey.net/) in your browser of choice.
2. Change Tampermonkey Inject Mode
    1. Go to Tampermonkey -> Dashboard -> Settings tab
    2. At the top, change Config Mode to "Advanced"
    3. At the bottom under Experimental, change Inject Mode to "Instant"
3. Click [here](https://github.com/Retoxified/GenLite/raw/release/dist/genlite.user.js) to install GenLite
4. Enjoy! GenLite should automatically update whenever there is a new version. We will announce new versions in our discord server.

Join us on Discord: https://discord.gg/Jn7s7pArdg

# Source Code & Distribution
The main file to run as a UserScript can be found in the "dist" folder.

The file "userscript-banner.txt" can be edited with new version numbers and other userscript specific metadata.

# Documentation
This project uses [JSDoc](https://jsdoc.app/)

To generate the latest documentation run:

`npm run docs`

# Node.JS - v18.12.1
This project uses [Node.JS v18.12.1](https://nodejs.org/download/release/v18.12.1/)

This project is built using [Webpack](https://webpack.js.org/)

Commands can be found in package.json for building or running the project.

To install Node.JS dependencies from package.json run:

`npm i`

To build the project for development run:
Development builds are slightly less minimized and do not increment the genlite version number.
`npm run build:dev`

To build the project for production run:
Production development results in fully minimized output and increments the version number.
`npm run build:prod`

# IDE & Setup
If you're using a well known IDE, we suggest [enabling coding assistance](https://blog.jetbrains.com/webstorm/2015/11/node-js-coding-assistance-in-webstorm-11/) for Node.JS.
