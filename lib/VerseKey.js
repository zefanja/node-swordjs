var mappings = require("./mappings.js");

//* VerseKey Class. Manage all kind of verse keys.

var verseKey = module.exports = function (inKeyText) {
    this.vkey = parse(inKeyText);

    this.getTestament = function () {
        return (this.vkey.absoluteChapterNum < 929) ? "ot" : "nt";
    };
};

//*Very simple key text parser. Booknames have to be in OSIS book names
function parse(inKeyText, inCallback) {
    var vkey = {};
    vkey.book = inKeyText.split(" ")[0];
    vkey.chapter = parseInt(inKeyText.split(" ")[1].split(":")[0], 10);
    vkey.verse = parseInt(inKeyText.split(" ")[1].split(":")[1], 10);
    vkey.absoluteChapterNum = mappings.data.OsisBibeNamesToAbsoluteChapterNum[vkey.book.toLowerCase()] + vkey.chapter-1;
    vkey.testament = (vkey.absoluteChapterNum < 929) ? "ot" : "nt";
    vkey.testamentChapterNum = (vkey.testament === "nt") ? vkey.absoluteChapterNum - 929 : vkey.absoluteChapterNum;
    return vkey;
}