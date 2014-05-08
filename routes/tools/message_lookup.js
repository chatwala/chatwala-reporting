/**
 * Created by airswoop1 on 5/8/14.
 */
var MongoClient = require('mongodb').MongoClient;



var message_lookup = (function(){

    var serveMessageLookup = function(req,res) {
      res.render('lookup_walas');
    };

    var getWalaBasedOnEnv = function(message_id,env,callback) {

        var config_file = '../../configs/' + env + '.js';
        var config;
        try {
            config= require(config_file);
        } catch(e) {
            console.log("error loading config module for environment");
            callback(e,null);
        }

        var mongo_url = config.db.mongodb;

        MongoClient.connect(mongo_url, function(err,db){

            if(err) {
                console.log("error connecting to db during getWalaBasedOnEnv");
                console.log(err);
                callback(err,null);
            }
            else {
                var collection = db.collection('messages');

                var query = {};
                query['owner_role'] = "RECIPIENT";
                query['message_id'] = message_id;

                collection.findOne(query,function(error,doc){
                    if(err){
                        console.log("error seaching for file in db during getWalaBasedOnEnv");
                        console.log(error);
                        callback(error,null);
                    }
                    else{
                        console.log(doc);
                        callback(null,doc);
                    }
                });
            }
        })




    }


    function setRoutes(app) {
        app.get('/message_lookup_tool', serveMessageLookup);
    };

    return {
        "setRoutes":setRoutes,
        "getWalaBasedOnEnv":getWalaBasedOnEnv
    }

}())

module.exports = message_lookup;