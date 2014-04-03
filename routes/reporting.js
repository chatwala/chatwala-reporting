var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var _ = require('underscore');
var async = require('async');
var util = require('util');


function getNumberOfUsersWithInboxOfSpecificSize(req,res) {

    var startTimestamp = parseFloat(req.query.startTimestamp);
    var endTimestamp = parseFloat(req.query.endTimestamp);
    var range = undefined;
    if(startTimestamp && endTimestamp) {
        range = {"startTimestamp": startTimestamp, "endTimestamp": endTimestamp};
    }
/*
    async.series([
        function(seriesCallback){
            getCountOfEachInbox(range, seriesCallback);
        },
        function(seriesCallback){
            getCountOfFirstMessagesThatWereNeverClicked(range, seriesCallback);
        },
        function(seriesCallback){
            getCountOfFirstMessagesThatWereNeverClicked(range, seriesCallback);
        }

    ],
        function(err, results){
            if(!err){
                var user_inbox_counts = results[0];
                var user_outbox_counts = results[1];
                var count_of_messages_not_replied_to = results[2].length;

                console.log("results");
                console.log(results);

                res.render('inboxSizes',{
                    "inboxCountData" : user_inbox_counts,
                    "outboxCountData" : user_outbox_counts,
                    "totalUsersWithoutInbox" : 0,
                    "totalMessagesSentWithoutReplies": count_of_messages_not_replied_to.length
                });
            }
            else{
                console.log(err);
            }


        });
*/
    getCountOfEachInbox(range, function(err, user_inbox_counts){
        if(!err){
            getCountOfEachOutbox(range, function(oErr, user_outbox_counts){
                if(!oErr){
                    getCountOfFirstMessagesThatWereNeverClicked(range, function(aErr, count_of_messages_not_replied_to){
                        if(!aErr){

                            res.render('inboxSizes',{
                                "inboxCountData" : user_inbox_counts,
                                "outboxCountData" : user_outbox_counts,
                                "totalUsersWithoutInbox" : 0,
                                "totalMessagesSentWithoutReplies": count_of_messages_not_replied_to.length,
                                "range":range
                            });
                        }
                        else{
                            console.log("there was an error on get count of messages sent but not replied to")
                            console.log(aErr);
                            res.send(404);
                        }
                    })
                }
                else{
                    console.log("there was an error on getCountOfEachOutbox");
                    console.log(oErr);
                    console.log(404);
                }
            })
        }
        else{
            console.log("There was an error on getCountOfEachInbox");
            console.log(err);
            res.send(404);
        }


    })

}

function getCountOfEachInbox(range, callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var aggregation = [];
            var match = {"owner_role":"RECIPIENT"};
            if(range && range.startTimestamp && range.endTimestamp){
                match["timestamp"]={ "$gt" : range.startTimestamp, "$lte": range.endTimestamp };
            }
            console.log(range);
            aggregation.push({$match:match});
            aggregation.push({$group:{_id:"$recipient_id", inboxSize:{$sum:1}}});

            console.log(util.inspect(aggregation));

            collection.aggregate(aggregation, function(aErr,inboxes_count){
                if(!aErr){

                    var groupedByInboxCount = _.groupBy(inboxes_count, function(n){
                        return n.inboxSize;
                    })
                    callback(null, groupedByInboxCount);

                }
                else{
                    callback(aErr);
                }
            })

        }
    })
}

function getCountOfEachOutbox(range, callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var aggregation = [];
            var match = {"owner_role":"SENDER"};
            if(range && range.startTimestamp && range.endTimestamp){
                match["timestamp"]={ $gt : range.startTimestamp, $lte : range.endTimestamp };
            }

            aggregation.push({$match:match});
            aggregation.push({$group:{_id:"$sender_id", outboxSize:{$sum:1}}});

            collection.aggregate(aggregation, function(aErr,outbox_count){
                if(!aErr){

                    var groupedByOutboxCount = _.groupBy(outbox_count, function(n){
                        return n.outboxSize;
                    })
                    callback(null, groupedByOutboxCount);

                }
                else{
                    callback(aErr);
                }
            })

        }
    })
}

function messagesWithUnknownRecipient(req,res){
    getCountOfEachOutbox(function(err, total_outbox){
            if(!err){
                console.log(total_outbox);
                res.send(200);
            }
            else{
                console.log("messages with outbox count error!");
                console.log(err);
                res.send(404);
            }
        })
}


function getCountOfFirstMessagesThatWereNeverClicked(range, callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var match = {};

            if(range && range.startTimestamp && range.endTimestamp){
                match["timestamp"]={ $gt : range.startTimestamp, $lte : range.endTimestamp };
            }

            var aggregation = [];
            aggregation.push({$match: match});
            aggregation.push({$group:{_id:"$message_id", messagesCount:{$sum:1}}});

            collection.aggregate(aggregation,function(aErr, total_inboxes){
                if(!aErr){

                   var grouped_total_inboxes = _.groupBy(total_inboxes, function(n){
                       return n.messagesCount
                   })

                   callback(null, grouped_total_inboxes["1"]);

                }
                else{
                    callback(aErr);
                }
            })

        }
    });
}



exports.getNumberOfUsersWithInboxOfSpecificSize = getNumberOfUsersWithInboxOfSpecificSize;
exports.messagesWithUnknownRecipient = messagesWithUnknownRecipient;