/** Module */
fs = require("fs");
path = require("path");
mgr = require("./ModuleMgr.js");

var configData = {};

var mod = module.exports = function (inName, inCallback) {
    console.log(mgr.getGlobalPath());
    loadConfig(inName);

    this.getConfigEntry = function (inKey) {

    };

};

function loadConfig(inName) {
    var fileName = path.join(mgr.getGlobalPath(), "mods.d", inName.toLowerCase()+".conf");
    fs.exists(fileName, function (exists) {
        if(exists) {
            fs.readFile(fileName, function(err, data) {
                if(err) throw err;
                var array = data.toString().split("\n");
                for(var i in array) {
                    console.log(array[i]);
                }
            });
        }

    });
}

new mod("GerNeUe");
