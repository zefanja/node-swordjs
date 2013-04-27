/** ModuleMgr */
var path = require("path");
var fs = require("fs");
var async = require("async");
var SWModule = require("./SWModule.js");

//* @protected
//*path to the sword directory. On Linux systems it is $HOME/.sword
var globalPath = getSwordPath();

//*get sword path
function getSwordPath() {
    var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    return path.join(home, ".sword");
}

//* @public
//* get global sword path
exports.getGlobalPath = function () {
    return globalPath;
};

//* set global sword path
exports.setGlobalPath = function (inPath) {
    globalPath = inPath;
};

//* get a module by its module name (e.g. "kjv", "esv")
var getModule = exports.getModule = function (inName, inCallback) {
    var m = new SWModule(inName, function () {
        inCallback(m);
    });
};

//* get a list of all installed modules
var getModules = exports.getModules = function (inOptions, inCallback) {
    fs.readdir(path.join(globalPath, "mods.d"), function (err, files) {
        var i = 0;
        var m = null;
        var modules = [];
        async.whilst(
            function () { return i<files.length; },
            function (callback) {
                m = new SWModule(files[i].replace(".conf", ""), function () {
                    modules.push(m);
                    i++;
                    callback();
                });
            },
            function (err) {
                inCallback(modules);
            }
        );
    });
};