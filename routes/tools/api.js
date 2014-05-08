/**
 * Created by airswoop1 on 5/5/14.
 */
var reporting = require("./reporting.js");
var videos = require("./videos.js");
var message_compilations = require("./message_compilations.js");
var message_lookup = require("./message_lookup.js");

var api = {
    "reporting":reporting,
    "videos":videos,
    "message_compilations":message_compilations,
    "message_lookup":message_lookup
}

module.exports = api;