var zlib = require('zlib');
var zip = require('zip');
var unzip = require("unzip");
var fs = require('fs');
var async = require('async');

var mappings = require("./lib/mappings.js");
var SWMgr = require("./lib/SWModuleMgr.js");

var fileName = "esv/nt.bzz";
var ntIndex = "esv/nt.bzs";
var ntIndexV = "esv/nt.bzv";

SWMgr.getModule("gerneue", function (inModule) {
    inModule.renderText("Neh 1");
});
