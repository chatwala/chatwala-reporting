/**
 * Created by Kevin Miller on 4/23/14.
 */

var azure = require("azure");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var _ = require('underscore');
var async = require('async');
var util = require('util');
var QueriesApi = require('./QueriesApi.js');

var Notification = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"Notification has been successfully sent."
        },
        "failureBadData": {
            "code":-100,
            "message":"Error there was an issue validating the message metadata or wala file"
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request"
        }

    };

    var Request = function() {
        this.wala_file_name = undefined;
        this.message_metadata = undefined;
        this.query = undefined;
        this.query_label = undefined;
    }

    var Response = function() {
        response_code = undefined;
    }

    //pre - upload wala and prepare message metadata
    var confirm_wala_ready = function(req, callback){
        if(validateWala(req) && validateMetadata(req)){
            callback(null);
        }
        else{
            var response = new Response();
            response.response_code = responseCodes["failureBadData"];
            callback(response);
        }
    }

    //1. target users - get query from Queries
    var initializeQuery = function(req, callback){

    }


    //2. look up this query in the user_group collection

    //3. check sent_user_notification collection and pull in all users that match that query_id

    /*4. Send the notification and message
        a. for each user in the query filter by whether they have been sent the notification yet
        b. insert new message for that user in mongodb
        c. send notification
        d. update sent_user_notification
    */


    function validateWala() {

    }

    function validateMetadata() {

    }


    return {

    }

}());

module.exports = Notification