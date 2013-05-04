var SWMgr = require("./lib/SWModuleMgr.js");


SWMgr.getModule("esv", function (inModule) {
    if (inModule)
        inModule.renderText("Mt 1:1", function (inText) {
            console.log(inText);
        });
});
