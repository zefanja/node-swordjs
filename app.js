console.log("Starting ZText Reader...");
var zlib = require('zlib');
var zip = require('zip');
var unzip = require("unzip");
var fs = require('fs');
var async = require('async');
//var forEachAsync = require('Array.prototype.forEachAsync');
var mappings = require("./mappings.js");
var fileName = "esv/ot.bzz";
var ntIndex = "esv/ot.bzs";
var ntIndexV = "esv/ot.bzv";
var bookPositions = [];
var chapters = [];



console.log(mappings.data.BooksInBible);
reloadIndex(ntIndex);

function reloadIndex(fileName) {
    fs.exists(fileName, function(exists) {
        console.log(fileName, exists);
        if (exists) {
            fs.open(fileName, "r", function (err, fd) {
                if(!err)
                    handleReadZsFile(fd, handleReadZvFile);
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
            reloadZvFile(ntIndexV);
        }
    );
}

function reloadZvFile(fileName) {
    fs.exists(fileName, function(exists) {
        console.log(fileName, exists);
        if (exists) {
            fs.open(fileName, "r", function (err, fd) {
                if(!err)
                    handleReadZvFile(fd, handleReadZvFile);
            });
        }
    });
}

function handleReadZvFile (fd, inCallback) {
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
                        console.log(z);
                        callback(null);
                    });
                }
            ],
            function (err, results) {
                console.log("async.series", err, results);
                callbackW();
            });
        },
        function (err) {
            console.log("passed series and whilst");
            if (z==4)
                readBooksAndChapters(fd);
        }
    );
}

function readBooksAndChapters (fd) {
    console.log("readBooksAndChapters...", bookPositions.length);
    var booksZ = 0; //mappings.data.BooksInOt;
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
            return booksZ<mappings.data.BooksInOt;
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
            getChapterBytes(1);
        }
    );

}

function getChapterBytes(chapterNumber) {
    var versesForChapterPositions = chapters[chapterNumber];
    var bookStartPos = versesForChapterPositions.bookStartPos;
    var blockStartPos = versesForChapterPositions.startPos;
    var blockLen = versesForChapterPositions.Length;

    console.log(versesForChapterPositions);

    var chapterBuffer = new Buffer(blockLen);
    var totalBytesRead = 0;
    var totalBytesCopied = 0;
    var len = 0;

    fs.exists(fileName, function(exists) {
        if (exists)
            fs.stat(fileName, function(error, stats) {
                var readStream = fs.createReadStream(fileName, {start: 122309, end: 122309+100000});
                readStream.on("readable", function () {
                    console.log("opened file");
                    zlib.unzip(readStream.read(121284), function (err, result) {
                        console.log(err, result.toString());
                    });

                });
                readStream.on("error", function (err) {
                    console.log("ERROR:", err);
                });
                /*fs.open(fileName, "r", function (err, fd) {
                    console.log("opened file:", err, fd, stats.size);
                    var buffer = new Buffer(blockLen);
                    fs.read(fd, buffer, 0, buffer.length, bookStartPos, function (err, bytesRead, buffer) {
                        var nt = zip.Reader(buffer);
                        //nt.toObject("utf8");
                        nt.forEach(function (entry) {
                            console.log(entry);
                        });
                        zlib.inflate(buffer, function (err, result) {
                            console.log(err, result);
                        });
                    });
                });*/
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



/*function getChapter() {
    fs.exists(fileName, function(exists) {
        console.log(exists);
        if (exists)
            fs.stat(fileName, function(error, stats) {
                fs.open(fileName, "r", function (err, fd) {
                    var buf = new Buffer(stats.size);
                    console.log("opened file:", err, fd, stats.size);
                    for (var i=0; i<1000; i++) {
                        fs.read(fd, buf, 0, buf.length, i, function (err, bytesRead, buffer) {
                            //var nt = zip.Reader(buffer);
                            //nt.toObject("utf8");
                            /*nt.forEach(function (entry) {
                                console.log(entry);
                            });
                            /*zlib.inflate(buffer, function (err, result) {
                                console.log(err, result);
                            });
                            //console.log(buf, buffer);
                        });
                    }
                });
            });
    });
} */