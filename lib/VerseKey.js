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

/*Copyright (c) 2011 Stephen Smith (bible reference parser)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

var mappings = require("./mappings.js");
var bcv_parser = require("./en_bcv_parser.js");
var bcv = new bcv_parser.bcv_parser();

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
    var tmpKey = bcv.parse(inKeyText).osis();
    vkey.osis = tmpKey;
    vkey.book = tmpKey.split(".")[0];
    vkey.chapter = parseInt(tmpKey.split(".")[1], 10);
    vkey.verse = parseInt(tmpKey.split(".")[2], 10);
    vkey.absoluteChapterNum = mappings.data.OsisBibeNamesToAbsoluteChapterNum[vkey.book.toLowerCase()] + vkey.chapter-1;
    vkey.testament = (vkey.absoluteChapterNum < 929) ? "ot" : "nt";
    vkey.testamentChapterNum = (vkey.testament === "nt") ? vkey.absoluteChapterNum - 929 : vkey.absoluteChapterNum;
    return vkey;
}