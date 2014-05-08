/**
 * Created by airswoop1 on 5/8/14.
 */
var api = require("./tools/api.js");
var cw_socket = function(server){
    var io = require("socket.io").listen(server);

    io.sockets.on('connection',function(socket){
        console.log("Received Socket Connection...");

        socket.on("get_message",function(data){
            console.log("Received message request");
            console.log(data);

            api.message_lookup.getWalaBasedOnEnv(data.message_id,data.env,function(err,res){
                console.log(res);
                socket.emit("serve_message",{"wala_metadata":res});
            })



        });

    })
}
module.exports = cw_socket;