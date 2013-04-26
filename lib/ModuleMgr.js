/** ModuleMgr */
var path = require("path");
var fs = require("fs");

//* @protected
//path to the mods.d directory. On Linux systems it is $HOME/.sword
var globalPath = getHomeDir();

function getHomeDir() {
    var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    return path.join(home, ".sword");
}

//* @public
exports.getGlobalPath = function () {
    return globalPath;
};

exports.setGlobalPath = function (inPath) {
    globalPath = inPath;
};

var getModules = exports.getModules = function (inOptions) {
    fs.readdir(path.join(globalPath, "mods.d"), function (err, files) {
        console.log(files);
    });
};

//getModules();