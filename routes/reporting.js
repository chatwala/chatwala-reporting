var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var _ = require('underscore');
var async = require('async');


function getUsersWithInbox(req, res) { 


	//get max number of messages
	getNumberOfMessages(function(messErr,inboxCountData){
		console.log(inboxCountData);
		if(!messErr && inboxCountData){
			
			getTotalUsersWithoutInbox(function(totErr, totalUsersWithoutInbox){

                if(!totErr && totalUsersWithoutInbox){
					
					console.log(inboxCountData);

					res.render('inboxSizes',{
						"inboxCountData" : inboxCountData,
						"totalUsersWithoutInbox" : totalUsersWithoutInbox 
					});
				}
				else{
					res.render('error', {'status' : totErr});
				}
			});

		}
		else{
			res.render('error', {'status': messErr})
		}

	})


}

function getNumberOfMessages(callback){

	CWMongoClient.getConnection(function (err, db) {
    if (err) {
        callback(err);
    }
    else {
    	var collection = db.collection('users');

    	collection
    		.aggregate(
    			[
		    		{
			    		$unwind : "$inbox"
			    	},
			    	{ $group: {
			    			_id : "$user_id",
			    			inboxSize : {$sum : 1}
			    	}}
			    ],
	    	function(err, retObj){

	    		if(!err && retObj){

		    		var groupedInboxes = _.groupBy(retObj, function(n){
		    			return n.inboxSize;
		    		});

		    		callback(null, groupedInboxes);
		    	}
		    	else{
		    		callback(err);
		    	}
    	})

    }
	});
}	

function getTotalUsersWithoutInbox(callback){
	
	CWMongoClient.getConnection(function (err, db) {
    if (err) {
			callback(err);
    }
    else {	
    	var collection = db.collection('users');
    	var countQuery = collection.find({"user_id" : {$exists:true}, "inbox.1" : {$exists:false}});
    	countQuery.count(function(qErr, numDocs){
    		console.log(numDocs);
    		callback(qErr, numDocs);
    	})
    }
	});
}


function getNumberOfUsersWithInboxOfSpecificSize(req,res) {

    getCountOfEachInbox(function(err, user_inbox_counts){
        if(!err){
            getCountOfEachOutbox(function(oErr, user_outbox_counts){
                if(!oErr){
                    getCountOfMessagesSentButNotRepliedTo(function(aErr, count_of_messages_not_replied_to){
                        if(!aErr){
                            res.render('inboxSizes',{
                                "inboxCountData" : user_inbox_counts,
                                "outboxCountData" : user_outbox_counts,
                                "totalUsersWithoutInbox" : 0,
                                "totalMessagesSentWithoutReplies": count_of_messages_not_replied_to.length
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

function getCountOfEachInbox(callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var aggregation = [];
            aggregation.push({$match:{"owner_role":"RECIPIENT"}});
            aggregation.push({$group:{_id:"$recipient_id", inboxSize:{$sum:1}}});

            collection.aggregate(aggregation, function(aErr,inboxes_count){
                if(!aErr){

                    var groupedByInboxCount = _.groupBy(inboxes_count, function(n){
                        return n.inboxSize;
                    })
                    console.log(groupedByInboxCount);
                    callback(null, groupedByInboxCount);

                }
                else{
                    callback(aErr);
                }
            })

        }
    })
}

function getCountOfEachOutbox(callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var aggregation = [];
            aggregation.push({$match:{"owner_role":"SENDER"}});
            aggregation.push({$group:{_id:"$sender_id", outboxSize:{$sum:1}}});

            collection.aggregate(aggregation, function(aErr,outbox_count){
                if(!aErr){

                    var groupedByOutboxCount = _.groupBy(outbox_count, function(n){
                        return n.outboxSize;
                    })
                    console.log(groupedByOutboxCount);
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


function getCountOfMessagesSentButNotRepliedTo(callback){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(err);
        }
        else {

            var collection = db.collection('messages');

            var aggregation = {$group:{_id:"$message_id", messagesCount:{$sum:1}}};

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



exports.getUsersWithInbox = getUsersWithInbox;
exports.getNumberOfUsersWithInboxOfSpecificSize = getNumberOfUsersWithInboxOfSpecificSize;
exports.messagesWithUnknownRecipient = messagesWithUnknownRecipient;