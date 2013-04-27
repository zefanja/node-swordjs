/*### BEGIN LICENSE
# Copyright (C) 2013 Stephan Tetzel <info@zefanjas.de>
# This code is based on the zTextReader class from cross-connect, Copyright (C) 2011 Thomas Dilts
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

var zlib = require('zlib');
var fs = require('fs');
var async = require('async');
var path = require("path");

var mappings = require("./mappings.js");

var bookPositions = [];
var chapters = [];
var testament = "";
var vkey = null;
var dataPath = "";
var finalCallback = null;

exports.getChapterBytes = function (inDataPath, inVkey, inCallback) {
    //console.log(path.join(inDataPath, inVkey.getTestament()+".bzz"));
    finalCallback = inCallback;
    dataPath = inDataPath;
    vkey = inVkey;
    testament = inVkey.getTestament();
    reloadIndex(path.join(inDataPath, inVkey.getTestament()+".bzs"));
};

function reloadIndex(fileName) {
    fs.exists(fileName, function(exists) {
        if (exists) {
            fs.open(fileName, "r", function (err, fd) {
                if(!err)
                    handleReadZsFile(fd);
            });
        }
    });
}

function handleReadZsFile (fd) {
    var startPos = 0;
    var length = 0;
    var unused = 0;
    var end = false;

    async.whilst(
        function () {return !end;},
        function (callbackB) {
            async.series([
                function (callback) {
                    getIntFromStream(fd, function (value, isEnd) {
                        end = isEnd;
                        startPos = value;
                        if (!isEnd)
                            callback(null);
                        else
                            callback(isEnd);

                    });
                },
                function (callback) {
                    getIntFromStream(fd, function (value, isEnd) {
                        end = isEnd;
                        length = value;
                        if (!isEnd)
                            callback(null);
                        else
                            callback(isEnd);
                    });
                },
                function (callback) {
                    getIntFromStream(fd, function (value, isEnd) {
                        end = isEnd;
                        unused = value;
                        //console.log("startPos, length, unused:", startPos, length, unused);
                        bookPositions.push({startPos: startPos, length: length, unused: unused});
                        if (!isEnd)
                            callback(null);
                        else
                            callback(isEnd);
                    });
                }
            ],
            function (err) {
                callbackB();
            });
        },
        function (err) {
            //console.log("passed whilst handleReadZsFile", bookPositions);
            //getChapterBytes();
            reloadZvFile(path.join(dataPath,testament+".bzv"));
        }
    );
}

function reloadZvFile(fileName) {
    fs.exists(fileName, function(exists) {
        if (exists) {
            fs.open(fileName, "r", function (err, fd) {
                if(!err)
                    handleReadZvFile(fd);
            });
        }
    });
}

function handleReadZvFile (fd) {
    var z=0;
    async.whilst(
        function () {return z<4;},
        function (callbackW) {
            async.series([
                function (callback) {
                    getShortIntFromStream(fd, function () {
                        callback(null);
                    });
                },
                function (callback) {
                    getInt48FromStream(fd, function () {
                        callback(null);
                    });
                },
                function (callback) {
                    getShortIntFromStream(fd, function () {
                        z++;
                        callback(null);
                    });
                }
            ],
            function (err, results) {
                //console.log("async.series", err, results);
                callbackW();
            });
        },
        function (err) {
            if (z==4)
                readBooksAndChapters(fd);
        }
    );
}

function readBooksAndChapters (fd) {
    //console.log("readBooksAndChapters...", bookPositions.length);
    var booksZ = (vkey.vkey.testament === "ot") ? 0 : mappings.data.BooksInOt;
    var booksEnd = (vkey.vkey.testament === "ot") ? mappings.data.BooksInOt : mappings.data.BooksInOt+mappings.data.BooksInNt;
    var chapterZ = 0;
    var verseZ = 0;
    var chapterStartPos = 0;
    var lastNonZeroStartPos = 0;
    var length = 0;
    var bookStartPos = 0;
    var chapt = {};

    var booknum = 0;
    var startPos = 0;

    async.whilst(
        function () {
            return booksZ<booksEnd;
            //return booksZ<40;
        },
        function (callbackB) {
            chapterZ = 0;
            //console.log("Chapters in Book", mappings.data.ChaptersInBook[booksZ]);
            async.whilst(
                function () {
                    //console.log("Chapters in Book:", chapterZ, mappings.data.ChaptersInBook[booksZ]);
                    return chapterZ<mappings.data.ChaptersInBook[booksZ];},
                function (callbackC) {
                    chapterStartPos = 0;
                    lastNonZeroStartPos = 0;
                    chapt = {};
                    length = 0;

                    async.whilst(
                        function () {
                            //console.log("verseZ", verseZ < mappings.data.VersesInChapter[booksZ][chapterZ], verseZ, mappings.data.VersesInChapter[booksZ][chapterZ]);
                            return verseZ < mappings.data.VersesInChapter[booksZ][chapterZ];
                        },
                        function (callbackV) {
                            async.series([
                                function (callback) {
                                    getShortIntFromStream(fd, function (value) {
                                        //console.log("booknum", value);
                                        booknum = value;
                                        callback(null);
                                    });

                                },
                                function (callback) {
                                    getInt48FromStream(fd, function(value) {
                                        //console.log("startPos", value, booknum, booksZ, chapterZ, verseZ);
                                        startPos = value;
                                        if (startPos !== 0)
                                            lastNonZeroStartPos = startPos;
                                        callback(null);
                                    });
                                },
                                function (callback) {
                                    getShortIntFromStream(fd, function (value) {
                                        length = value;
                                        if (verseZ === 0) {
                                            chapterStartPos = startPos;
                                            bookStartPos = 0;
                                            if (booknum < bookPositions.length) {
                                                //console.log("bookPositions.startPos", bookPositions[booknum].startPos, booknum, bookPositions.length);
                                                bookStartPos = bookPositions[booknum].startPos;
                                            }

                                            /*if (this.BlockType === IndexingBlockType.Chapter)
                                                chapterStartPos = 0; */

                                            chapt["startPos"] = chapterStartPos;
                                            chapt["booknum"] = booksZ;
                                            chapt["bookRelativeChapterNum"] = chapterZ;
                                            chapt["bookStartPos"] = bookStartPos;
                                        }
                                        if (booknum === 0 && startPos === 0 && length === 0) {
                                            if (chapt !== {}) {
                                                chapt["verses"] = [];
                                                chapt["verses"].push({startPos: 0, length: 0, booknum: booksZ});
                                            }
                                        } else {
                                            if (chapt !== {}) {
                                                chapt["verses"] = [];
                                                chapt["verses"].push({startPos: startPos - chapterStartPos, length: length, booknum: booksZ});
                                            }
                                        }

                                        callback(null);
                                    });
                                }
                            ],
                            function (err, results) {
                                //console.log("async.series", err, results);
                                verseZ++;
                                callbackV();
                            });

                        },
                        function (err) {
                            //console.log("passed whilst verses");
                            // update the chapter length now that we know it
                            if (chapt != {}) {
                                chapt["Length"] = lastNonZeroStartPos - chapterStartPos + length;
                                chapters.push(chapt);
                            }
                            async.series([
                                function (callback) {
                                    getShortIntFromStream(fd, function () {
                                        callback(null);
                                    });
                                },
                                function (callback) {
                                    getInt48FromStream(fd, function () {
                                        callback(null);
                                    });
                                },
                                function (callback) {
                                    getShortIntFromStream(fd, function () {
                                        callback(null);
                                    });
                                }
                            ], function (err) {
                                verseZ = 0;
                                chapterZ++;
                                callbackC();
                            });
                        }
                    );
                },
                function (err) {
                    //console.log("passed whilst chapters", chapterZ);
                    async.series([
                        function (callback) {
                            getShortIntFromStream(fd, function () {
                                callback(null);
                            });
                        },
                        function (callback) {
                            getInt48FromStream(fd, function () {
                                callback(null);
                            });
                        },
                        function (callback) {
                            getShortIntFromStream(fd, function () {
                                callback(null);
                            });
                        }
                    ], function (err) {
                        booksZ++;
                        callbackB();
                    });
                }
            );
        },
        function (err) {
            //console.log("passed whilst books", chapters);
            getChapterBytes(path.join(dataPath,testament+".bzz"), vkey.vkey.testamentChapterNum);
        }
    );

}

function getChapterBytes(inFile, inChapterNumber) {
    if (inChapterNumber) {
        var versesForChapterPositions = chapters[inChapterNumber];
        var bookStartPos = versesForChapterPositions.bookStartPos;
        var blockStartPos = versesForChapterPositions.startPos;
        var blockLen = versesForChapterPositions.Length;

        //console.log(versesForChapterPositions);

        var chapterBuffer = new Buffer(blockLen);
        var totalBytesRead = 0;
        var totalBytesCopied = 0;
        var len = 0;
    }

    fs.exists(inFile, function(exists) {
        if (exists)
            fs.stat(inFile, function(error, stats) {
                var readStream = fs.createReadStream(inFile, {start: bookStartPos});
                readStream.on("readable", function () {
                    zlib.unzip(readStream.read(), function (err, result) {
                        if(result)
                            finalCallback(result.toString("utf8", blockStartPos, blockStartPos+blockLen));
                    });

                });
                readStream.on("error", function (err) {
                    console.log("ERROR:", err);
                });
            });
    });
}

function getIntFromStream(fd, inCallback) {
    //console.log("getIntFromStream");
    var buf = new Buffer(4);
    var isEnd = false;
    var value = null;
    fs.read(fd, buf, 0, 4, null, function (err, bytesRead, buffer) {
        if (bytesRead != 4)
            isEnd = true;
        if (inCallback)
            inCallback(buf[3] * 0x100000 + buf[2] * 0x10000 + buf[1] * 0x100 + buf[0], isEnd);
    });
}

function getShortIntFromStream(fd, inCallback) {
    var buf = new Buffer(2);
    var isEnd = false;
    var value = null;
    fs.read(fd, buf, 0, 2, null, function (err, bytesRead, buffer) {
        //console.log("getShortIntFromStream", buf[1] * 0x100 + buf[0]);
        if (bytesRead != 2)
            isEnd = true;
        if (inCallback)
            inCallback(buf[1] * 0x100 + buf[0], isEnd);
    });
}

function getInt48FromStream(fd, inCallback) {
    //console.log("getInt48FromStream");
    var buf = new Buffer(6);
    var isEnd = false;
    var value = null;
    fs.read(fd, buf, 0, 6, null, function (err, bytesRead, buffer) {
        if (bytesRead != 6)
            isEnd = true;
        if (inCallback)
            inCallback(buf[1] * 0x100000000000 + buf[0] * 0x100000000 + buf[5] * 0x1000000 + buf[4] * 0x10000 + buf[3] * 0x100 + buf[2], isEnd);
    });
}