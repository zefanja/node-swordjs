var SWMgr = require("./lib/SWModuleMgr.js");

SWMgr.getModule("gerneue", function (inModule) {
    if (inModule)
        inModule.renderText("Ps 23:1", function (inText) {
            console.log(inText);
        });
});
