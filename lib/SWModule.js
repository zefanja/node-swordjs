/** Module */
fs = require("fs");
path = require("path");
SWMgr = require("./SWModuleMgr.js");
vkey = require("./VerseKey.js");
ztext = require("./zTextReader.js");

var mod = module.exports = function (inName, inCallback) {
    this.configData = {};
    loadConfig(inName, function (inData) {
        this.configData = inData;
        inCallback();
    }.bind(this));

    this.getConfigEntry = function (inKey) {
        //TODO
    };

    //* Render the text at `inVerseKey`. `inVerseKey` can be a vkey object or a string.
    this.renderText = function (inVerseKey, inCallback) {
        if (typeof inVerseKey === "string")
            inVerseKey = new vkey(inVerseKey);
        console.log(inVerseKey);
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
        }

    });
}

/*new mod("GerNeUe", function() {
    console.log(this.configData);
});*/
