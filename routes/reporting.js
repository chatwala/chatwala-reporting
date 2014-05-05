var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js');
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
                            getNumMessagesPerThread(range, function(bErr,conversations_per_user,messages_per_conversation){
                                if(!bErr){
                                    res.render('inboxSizes',{
                                        "inboxCountData" : user_inbox_counts,
                                        "outboxCountData" : user_outbox_counts,
                                        "totalUsersWithoutInbox" : 0,
                                        "totalMessagesSentWithoutReplies": count_of_messages_not_replied_to.length,
                                        "range":range,
                                        "convosPerUser":conversations_per_user,
                                        "messagesPerConvo":messages_per_conversation
                                    });
                                }
                                else{
                                    console.log("error on thread query");
                                    console.log(bErr);
                                    res.send(404);
                                }
                            })
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


function getNumMessagesPerThread(range, callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var match = {};
            var project = {};
            var group = {};

            project['owner_user_id'] = 1;
            project['thread_id'] = 1;
            project['owner_role'] = 1;
            project['unknown_recipient_starter'] = 1;
            project['timestamp']=1;

            match["unknown_recipient_starter"] = false;
            match["owner_role"] = "RECIPIENT";
            match["thread_id"]={"$ne":"null"};
            if(range && range.startTimestamp && range.endTimestamp){
                match["timestamp"]={ $gt : range.startTimestamp, $lte : range.endTimestamp };
            }

            group["_id"]="$thread_id";
            group["messages_in_thread"]= {"$sum":1};
            group["user_ids"] = {"$addToSet":"$owner_user_id"};


            var aggregation = [];
            aggregation.push({$project: project});
            aggregation.push({$match: match});
            aggregation.push({$group:group});

            collection.aggregate(aggregation,function(aErr, thread_results){
                if(!aErr){
                    console.log(thread_results);
                    var threadsByUser = {};

                    for(var i= 0;i<thread_results.length;i++){
                        var user1 = thread_results[i].user_ids[0];
                        var user2 = thread_results[i].user_ids[1]

                        if(typeof user1 !== 'undefined' && threadsByUser.hasOwnProperty(user1)){
                            threadsByUser[user1].thread_count += 1;
                        }
                        else{
                            threadsByUser[user1] = {thread_count : 1};
                        }

                        if(typeof user2 !== 'undefined' && threadsByUser.hasOwnProperty(user2)){
                            threadsByUser[user2].thread_count += 1;
                        }
                        else{
                            threadsByUser[user2] = {thread_count : 1};
                        }
                    }

                    //console.log(threadsByUser);

                    var num_threads_for_each_user = _.groupBy(threadsByUser, function(k){
                        return k.thread_count;
                    })


                    var conversations_per_user = [];

                    for(var j in num_threads_for_each_user){
                        console.log(j + " " + num_threads_for_each_user[j].length);
                        var t = num_threads_for_each_user[j].length;
                        conversations_per_user.push({
                            "num_conversations" : j,
                            "num_users_with_x_conversations" : t
                        });

                    }


                    var threads_grouped_by_count = _.groupBy(thread_results, function(n){
                        return n.messages_in_thread;
                    })

                    var messages_per_conversation = [];

                    for(var m in threads_grouped_by_count){
                        console.log(m + " " + threads_grouped_by_count[m].length);
                        var t = threads_grouped_by_count[m].length;
                        messages_per_conversation.push({
                            "num_messages" : m,
                            "num_threads_with_x_messages" : t
                        })

                    }

                    callback(null, conversations_per_user,messages_per_conversation);

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
