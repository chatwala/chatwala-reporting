/**
 * Module dependencies.
 */

console.log("Initializing node: " + new Date());
var config = require('./config.js');

"use strict";
var express = require('express');
var api = require('./routes/api.js');
var mongoClient = require('./cw_mongo.js');

var clientID = "58041de0bc854d9eb514d2f22d50ad4c";
var clientSecret = "ac168ea53c514cbab949a80bebe09a8a";

var http = require('http');
var path = require('path');

var app = express();
var queue = [];
// all environments

mongoClient.getConnection(function (err, db) {
    if (err) {
        console.log("Unable to connect to mongo DB.");
        queue.forEach(function (object) {
            object.res.send(500);
        });
    } else {
        console.log("Launching queued requests");
        queue.forEach(function (object) {
            object.next();
        });
    }

    queue = [];
});

app.set('port', process.env.PORT || 1337);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(function (req, res, next) {
    if (mongoClient.isConnected()) {
        next();
    }
    else {
        console.log("Database not connected yet, queuing request");
        queue.push({ req: req, res: res, next: next});
    }
});


app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.multipart());


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//app.get('/getNumberOfUsersWithInbox', reporting.getUsersWithInbox);
app.get('/reporting2', api.reporting.getNumberOfUsersWithInboxOfSpecificSize);
app.get('/outbox', api.reporting.messagesWithUnknownRecipient);
app.get('/videos', api.videos.index);
app.post('/getInbox',api.videos.inbox);


var server = http.createServer(app);

server.listen(app.get('port'), function () {
    console.log('listening on port ' + app.get('port') + " started:  ");
    console.log("Completed Node initialization: " + new Date());
});

