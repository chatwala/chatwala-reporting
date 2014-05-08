/**
 * Created by airswoop1 on 5/8/14.
 */

var message_compilations = (function(){


    var single_conversation = function(req,res){
        res.render('single_conversation');
    };

    var happy_birthday = function(req,res){
        res.render('happy_birthday');
    };



    function setRoutes(app){
        app.get('/single_conversation',single_conversation);
        app.get('/happy_birthday',happy_birthday);
    }

    return {
       "setRoutes":setRoutes
    }


}())

module.exports = message_compilations;