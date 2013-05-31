/*### BEGIN LICENSE
# Copyright (C) 2013 Stephan Tetzel <info@zefanjas.de>
#
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
var sax = require("sax");
var parser = sax.parser(true); //strict = true
var bcv_parser = require("./en_bcv_parser.js");
var bcv = new bcv_parser.bcv_parser();

//* SWFilter Options
var swFilterOptions = {
    headings: false,
    footnotes: false,
    strongsNumbers: false,
    wordsOfChristInRed: false
};

exports.processText = function (inRaw, inOptions) {
    if (!inOptions || inOptions === {}) {
        inOptions = swFilterOptions;
    } else {
        inOptions.headings = (inOptions.headings) ? inOptions.headings : swFilterOptions.headings;
        inOptions.footnotes = (inOptions.footnotes) ? inOptions.footnotes : swFilterOptions.footnotes;
        inOptions.strongsNumbers = (inOptions.strongsNumbers) ? inOptions.strongsNumbers : swFilterOptions.strongsNumbers;
        inOptions.wordsOfChristInRed = (inOptions.wordsOfChristInRed) ? inOptions.wordsOfChristInRed : swFilterOptions.wordsOfChristInRed;
    }
    var lastTag = "";
    //Note
    //var isNote = false;
    var currentNode = null;
    var currentRef = null;
    var noteText = "";
    var outText = "";
    inRaw = "<xml>"+inRaw+"</xml>";

    //console.log(inRaw);

    //Handle Parsing errors
    parser.onerror = function (e) {
        console.log("ERROR parsing XML", e);
    };

    //Text node
    parser.ontext = function (t) {
        //console.log("TEXT:", t);
        if (inOptions.footnotes && currentNode) {
            if (currentNode && currentNode.attributes.type === "crossReference") {
                console.log(t);
                if (lastTag !== "reference")
                    outText += processCrossReference(t, currentNode);
                else {
                    console.log(currentRef, t, lastTag);
                    outText += "<a href=\"?type=crossReference&osisRef=" + currentRef.attributes.osisRef + "&n=" + currentNode.attributes.n + "\">" + t + "</a>";
                }
            }
        } else if (!currentNode)
            outText += t;
    };

    //Handle opening tags
    parser.onopentag = function (node) {
        //console.log(node);
        lastTag = node.name;
        switch (node.name) {
            case "title":
                if (node.attributes.type === "section")
                    outText += "<h1>";
            break;
            case "note":
                //console.log(node, isNote, lastTag);
                if (node.attributes.type === "crossReference" && inOptions.footnotes)
                    outText += "[";
                currentNode = node;
            break;
            case "reference":
                currentRef = node;
            break;
        }
    };

    parser.onclosetag = function (tagName) {
        //console.log("CLOSE:", tagName);
        switch (tagName) {
            case "title":
                outText += "</h1>";
            break;
            case "note":
                if (currentNode.attributes.type === "crossReference" && inOptions.footnotes)
                    outText += "] ";
                noteText = "";
                currentNode = null;
            break;
            case "reference":
                currentRef = null;
            break;
        }
        lastTag = "";
    };

    //Handling Attributes
    parser.onattribute = function (attr) {
        //console.log(attr);
    };

    //End of parsing
    parser.onend = function () {
        console.log("Finished parsing XML!");
    };

    parser.write(inRaw);

    return outText;
};

function processCrossReference(inText, inNode) {
    var outText = "";
    if (bcv.parse(inText).osis() !== "")
        outText = "<a href=\"?type=crossReference&osisRef=" + bcv.parse(inText).osis() + "&n=" + inNode.attributes.n + "\">" + inText + "</a>";
    else
        outText = inText;
    return outText;
}