/**
 * Created by airswoop1 on 5/5/14.
 */
var CWMongoClient = require('../../cw_mongo.js');
var _ = require("underscore");
var config = require("../../config.js");

var videos = (function(){


    var Request = function(){
        this.user_id;
    };


    var index = function(req,res){
        res.render("videos.ejs");
    }

    var inbox = function(req,res){

        var request = new Request();
        request.user_id = req.param("user_id");

        getInbox(request, function(err, inbox){

            if(err){
                console.log("error returning user inbox");
                console.log(err);
                res.send(404);
            }
            else{
                /*var groupByUser = _.groupBy(inbox,function(n){
                    return n["sender_id"]
                })*/
                var groupAndSortByUser = sortedGroupBy(inbox,"sender_id","timestamp")

                console.log(groupAndSortByUser);
                res.render('sorted_videos',
                    {
                    "users":groupAndSortByUser,
                    "profile_url":config.azure.nonShardedBlobStorage.base_url,
                    "message_thumbnail_url":config.azure.blobStorageShard.s1.base_url + config.azure.blobStorageShard.s1.message_thumbnail_container,
                    "blob_url" : config.azure.blobStorageShard.s1.base_url + config.azure.blobStorageShard.s1.container,
                    "my_user_id":request.user_id
                    }
                )
            }

        })

    };



    function getInbox(request, callback){

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                console.log(err);

                callback("failure", null);
            } else {
                var collection = db.collection('messages');
                var query = {};

                query["owner_user_id"] = request.user_id;
                query["owner_role"] = "RECIPIENT";
                query["showable"] = true;

                //always grab 1 extra record so we know there are more pages
                collection.find(
                    query,
                    {"sort":{"_id":-1}},
                    function(err, cursor) {
                        if(err) {
                            console.log(err);
                            callback(err, null);
                        }
                        else {
                            cursor.toArray(function(err, documents) {
                                callback(null,documents);
                            });
                        }
                    }
                );
            }
        });


    }

    function sortedGroupBy(list, groupByIter, sortByIter) {
        if (_.isArray(groupByIter)) {
            function groupBy(obj) {
                return _.map(groupByIter, function(key, value) {
                    return obj[key];
                });
            }
        } else {
            var groupBy = groupByIter;
        }
        if (_.isArray(sortByIter)) {
            function sortBy(obj) {
                return _.map(sortByIter, function(key, value) {
                    return obj[key];
                });
            }
        } else {
            var sortBy = sortByIter;
        }
        var groups = _.groupBy(list, groupBy);
        _.each(groups, function(value, key, list) {
            list[key] = _.sortBy(value, sortBy);
        });
        return groups;
    }

    function setRoutes(app){
        app.get('/user_inbox_tools', index);
        app.post('/getInbox',inbox);
    }

    return {
        "setRoutes":setRoutes
    }


}())

module.exports = videos;