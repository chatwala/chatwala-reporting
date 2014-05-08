/**
 * Created by airswoop1 on 5/8/14.
 */

//var socket = io.connect('http://chatwala-reporting.azurewebsites.net/');
var socket = io.connect('http://localhost:1337/');

socket.on("connection", function(data){

    console.log("connected to socket");


})

socket.on("serve_message",function(data){
    console.log("received served message")
    console.log(data);

    var output = JSON.stringify(data.wala_metadata,undefined,2);

    document.getElementById("json_div").innerHTML = output;
    document.getElementById("status").innerHTML = ""


})


var getMessageData = function(){
    var message_id = $('#message_id_input').val();
    var env = "";
    $('#status').text("Working...");
    env = $("#environment_div input[type='radio']:checked")[0];

    if(message_id == ""){
        alert("you must enter a message id");
    }

    socket.emit("get_message",{
        "message_id":message_id,
        "env":env.value
    })

}
