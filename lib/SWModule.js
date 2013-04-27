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

/** SWModule */
fs = require("fs");
path = require("path");
SWMgr = require("./SWModuleMgr.js");
vkey = require("./VerseKey.js");
ztext = require("./zTextReader.js");

var mod = module.exports = function (inName, inCallback) {
    this.configData = null;
    loadConfig(inName, function (inData) {
        if (inData) {
            this.configData = inData;
            inCallback(true);
        } else {
            inCallback(false);
        }
    }.bind(this));

    this.getConfigEntry = function (inKey) {
        //TODO
    };

    //* Render the text at `inVerseKey`. `inVerseKey` can be a vkey object or a string.
    this.renderText = function (inVerseKey, inCallback) {
        if (typeof inVerseKey === "string")
            inVerseKey = new vkey(inVerseKey);
        //.log(inVerseKey);
        ztext.getChapterBytes(path.join(SWMgr.getGlobalPath(), this.configData.DataPath), inVerseKey, function (inData) {
            inCallback(inData);
        });

    };

};

function loadConfig(inName, inCallback) {
    var fileName = path.join(SWMgr.getGlobalPath(), "mods.d", inName.toLowerCase()+".conf");
    fs.exists(fileName, function (exists) {
        if(exists) {
            fs.readFile(fileName, function(err, data) {
                if(err) throw err;
                var configData = {};
                var lines = data.toString().split("\n");
                var line = "";
                for(var i in lines) {
                    line = lines[i].split("=");
                    if (line[0] !== "")
                        if (line[0].search(/\[.*\]/) !== -1)
                            configData["moduleKey"] = line[0].replace("[", "").replace("]", "");
                        else
                            configData[line[0]] = line[1];
                }
                inCallback(configData);
            });
        } else {
            inCallback();
        }

    });
}

/*new mod("GerNeUe", function() {
    console.log(this.configData);
});*/
