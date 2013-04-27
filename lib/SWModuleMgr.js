/*### BEGIN LICENSE
# Copyright (C) 2013 Stephan Tetzel <info@zefanjas.de>
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License version 3, as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranties of
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR
# PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program.  If not, see <http://www.gnu.org/licenses/>.
### END LICENSE*/

/** SWModuleMgr */
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
    var m = new SWModule(inName, function (exists) {
        if (exists)
            inCallback(m);
        else
            inCallback(null);
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