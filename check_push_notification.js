/**
 * Created by airswoop1 on 5/8/14.
 */
var config = require("./config.js");
var azure = require("azure");
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint, config.azure.hub_keyname, config.azure.hub_key);
var util = require("util");

function testpush(){
    console.log("testpush being called!");
    var user_id = "482e0d1f-5e7e-4ddf-b7ee-25355ec6d91b";

    hub.listRegistrationsByTag(user_id, function (error, existingRegs) {
        console.log("coming back from list registrations by tag")
        if(error){
            console.log("list registrations by tag error: ");
            console.log(error);
        }

        console.log(existingRegs);
        /*if(existingRegs && existingRegs.length > 0){

            hub.deleteRegistration(existingRegs[0].RegistrationId, null, function(){
                console.log("Deleted registration for " + user_id);
            });

        }*/

        /*var firstRegistration = true;
        if (existingRegs && existingRegs.length > 0) {
            for (var i = 0; i < existingRegs.length; i++) {
                if (firstRegistration) {
                    existingRegs[i].DeviceToken = push_token;
                    hub.updateRegistration(existingRegs[i], registrationComplete);
                    firstRegistration = false;
                } else {
                    // We shouldn't have any extra registrations; delete if we do.
                    hub.deleteRegistration(existingRegs[i].RegistrationId, null);
                }
            }
        } else {
            // Create a new registration.
            if (platform_type === 'ios') {

                var template = '{\"aps\":{\"alert\":\"$(message)\", \"content-available\":\"1\"}}';
                hub.apns.createTemplateRegistration(push_token,
                    [user_id], template, registrationComplete);
            }
            else if (platform_type === 'android') {

                var template = '{\"message\":\"$(message)\"}';
                hub.gcm.createTemplateRegistration(push_token,
                    [user_id], template, registrationComplete);
            }
        }*/
    });

}

testpush();