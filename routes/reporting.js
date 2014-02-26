var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var _ = require('underscore')


function getUsersWithInbox(req, res) { 


	//get max number of messages
	getNumberOfMessages(function(messErr,inboxCountData){
		
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



exports.getUsersWithInbox = getUsersWithInbox