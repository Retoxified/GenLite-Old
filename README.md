# GenLite 0.2.21 - For GenFanad

GenLite installation instructions
1. Install [TamperMonkey(All Browsers)](https://www.tampermonkey.net/) in your browser of choice.
2. Change Tampermonkey Inject Mode
    1. Go to Tampermonkey -> Dashboard -> Settings tab
    2. At the top, change Config Mode to "Advanced"
    3. At the bottom under Experimental, change Inject Mode to "Instant"
3. Click [here](https://github.com/GenLite-Org/GenLite/raw/release/dist/genlite.user.js) to install GenLite
4. Enjoy! GenLite should automatically update whenever there is a new version. We will announce new versions in our discord server.

Join us on Discord: https://discord.gg/Jn7s7pArdg

# Source Code & Distribution
The main file to run as a UserScript can be found in the "dist" folder.

The file "userscript-banner.txt" can be edited with new version numbers and other userscript specific metadata.

This repository contains submodules as such, when cloning normally `git clone https://github.com/GenLite-Org/GenLite.git` will need to be followed by `git submodule init` and `git submodule update`. 

Alternatively you can make the initial clone with `git clone --recurse-submodules https://github.com/GenLite-Org/GenLite.git` to automatically pull in the submodules.

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

`npm run build:dev`

Development builds are slightly less minimized and do not increment the genlite version number.
This outputs two files the Loader (genlite.user.js), and a runable version of the Client (genlite.dev.user.js)
To use the loader you will need to create a file in the root of the project named configStuff.json with the content
```json
{
    "repository_owner": "YOUR_GIT_USER_HERE"
}
```
which will point your loader to your github (or any other fork you put there)

Production runs of github are setup to be only ran though GitHub Actions. They generate a Loader with a userscript banner which will automatically get the correct urls to load the Client from the repo. However if you want to run these commands locally you have to set an env variable.

Bash
```bash
repoOwner = "YOUR_GIT_USER_HERE" && export repoOwner
```
Power Shell
```ps1
$Env:repoOwner = "YOUR_GIT_USER_HERE"
```
As mentioned though the Loader will not work without the Client in a GitHub Repo, but you can add a user script banner to the Client manually.

Commands:

`npm run build:prodbeta`

`npm run build:prodrelease`


# IDE & Setup
If you're using a well known IDE, we suggest [enabling coding assistance](https://blog.jetbrains.com/webstorm/2015/11/node-js-coding-assistance-in-webstorm-11/) for Node.JS.
