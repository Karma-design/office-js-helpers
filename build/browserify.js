// Credit to Basarat/typescript-collections
// https://github.com/basarat/typescript-collections/blob/release/browserify-umd.js

"use strict;"

var browserify = require("browserify");
var fs = require("fs");
var path = require('path');
var projectRoot = path.resolve(__dirname, '../');

if (!fs.existsSync(`${projectRoot}/dist`)) {
    fs.mkdirSync(`${projectRoot}/dist`);
}

var distOutFileUnversioned = `${projectRoot}/dist/office.helpers.js`;
var distOutUnversioned = fs.createWriteStream(distOutFileUnversioned, { encoding: "utf-8", flags: "wx" })

var bundled = browserify({
    extensions: [".js"],
    standalone: 'OfficeHelpers'
})
    .require("./bundle/index.js", { expose: "office-js-helpers" })
    .bundle();

bundled.pipe(distOutUnversioned);