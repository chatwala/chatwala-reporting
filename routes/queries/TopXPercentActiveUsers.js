/**
 * Created by airswoop1 on 4/28/14.
 */


var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var _ = require('underscore');
var async = require('async');
var util = require('util');


var TopXPercentActiveUsers = (function(){



    var execute = function(percentage, date_range, callback){

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


    return {
        "execute" : execute
    };


}());

module.exports = TopXPercentActiveUsers;