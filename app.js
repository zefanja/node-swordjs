var SWMgr = require("./lib/SWModuleMgr.js");

SWMgr.getModule("gerneue", function (inModule) {
    inModule.renderText("Neh 1", function (inText) {
        console.log(inText);
    });
});
