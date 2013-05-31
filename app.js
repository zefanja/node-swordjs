var SWMgr = require("./lib/SWModuleMgr.js");

SWMgr.getModule("gerneue", function (inModule) {
    if (inModule)
        inModule.renderText("Mt 1:1", {footnotes: false}, function (inText) {
            console.log(inText);
        });
});
