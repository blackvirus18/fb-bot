var express = require('express');
var router = express.Router();
var senderIntent={};
var request= require('request');
/* GET users listing. */
router.get('/', function (req, res) {
  if (req.query['hub.verify_token'] === 'my_name_is_deepesh') {
    res.send(req.query['hub.challenge']);
    return;
  }
  res.send('hi i am webhook');
});

router.post('/', function (req, res) {
	console.log("messaging_events===",messaging_events)
	var messaging_events = req.body.entry[0].messaging;
	
	for (i = 0; i < messaging_events.length; i++) {
	    event = req.body.entry[0].messaging[i];
	    sender = event.sender.id;
	    console.log("sender====",sender)
	    if(!senderIntent[sender]){
	      senderIntent[sender]={};
	    }
	    if (event.message && event.message.text) {
	      text = event.message.text;
	}
}
    respondUser(sender);
});

function respondUser(sender,intentObj,usermessage){
  sendTextMessage(sender,getWelcomeMessage()['message'],'generic');
}
function sendTextMessage(sender, message,type) {
  console.log("sender====",sender);
  console.log("message====",message);
  console.log("type====",global.config.facbookBaseApi);
  var token = "EAAJ7ZBAF5xnIBADufc6wp4jkGHSJLRf00kcJWZCeyyFrpijY5oQ2ofcEBsE8xJybqozJHrH1qtzfMqWoEzANrl8ZAPZBvt1iP5J1lE7oFs45KI3BgW6Ap6fHblTZAnybEKpZAbeBFSZAB1cg8Qnh2KaPHhvhQcubLuRYuoXqIcDRVWQkH8GUPFa";
  var messageData='';
  if(type){
    messageData=message;
  }
  else{
    messageData = {
      text:message
    }
  }
  request({
    url: global.config.facbookBaseApi+'/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
  	console.log("err===",error)
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
    return true;
  });
}

function getWelcomeMessage(){
  var welcomePayload={
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements":[
              {
                "title":"Welcome to Rehlat",
                "item_url":"https://www.rehlat.com",
                "subtitle":"Hi, there I can help you with following things. Pick an option.",
                "buttons":[
                  {
                    "type":"postback",
                    "title":"Cancel your ticket",
                    "payload":"crm"
                  },
                  {
                    "type":"postback",
                    "title":"Print Your Ticket",
                    "payload":"printTicket"
                  },
                  {
                    "type":"postback",
                    "title":"Book a flight",
                    "payload":"askcommunity"
                  }
                ]
              }
            ]
          }
      }
    }
  }
  return welcomePayload;
}

module.exports = router;
