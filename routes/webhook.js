var express = require('express');
var router = express.Router();
var senderIntent = {};
var request = require('request');
var promised = require("promised-io/promise");
/* GET users listing. */
router.get('/', function(req, res) {
    if (req.query['hub.verify_token'] === 'my_name_is_deepesh') {
        res.send(req.query['hub.challenge']);
        return;
    }
    res.send('hi i am webhook');
});

router.post('/', function(req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        console.log("sender====", sender)
        if (!senderIntent[sender]) {
            senderIntent[sender] = {};
        }
        if (event.message && event.message.text) {
            text = event.message.text;
            parseTextMessage(text, sender, function(error, context) {

            })
        } else if (event.postback && event.postback.payload) {
            var postbackPayload = event.postback.payload;
            var intentValue = postbackPayload;
            console.log("postbackPayload====", postbackPayload)
            senderIntent[sender]['intentValue'] = intentValue;
            respondUser(sender);
        }
    }
    //respondUser(sender);
    res.sendStatus(200);
});

function respondUser(sender, intentObj, usermessage) {
    var intentValue = senderIntent[sender]['intentValue'];
    console.log("respondUser intentValue=====", intentValue)
    switch (intentValue) {
        case 'welcome':
            sendTextMessage(sender, getWelcomeMessage()['message'], 'generic');
            break;
        case "printTicket":
            if (intentObj && intentObj.entities.email) {
                var email = intentObj.entities.email[0].value;
                senderIntent[sender]['email'] = email;
                var bookingId = usermessage.match(/HTL[0-9]*\b/g);
                if (bookingId && bookingId.length) {
                    bookingId = bookingId[0];
                }
                if (bookingId && bookingId.length && email && email.length) {
                    printTicket(sender, email, bookingId);
                    senderIntent[sender]['bookingId'] = bookingId;
                } else {
                    sendTextMessage(sender, "Hey please enter your email and booking id");
                }
                console.log("phone_number===", email)
                console.log("bookingid===", bookingId)
                    //sendOtp(sender,phone_number,profileInfo);
            } else {
                sendTextMessage(sender, "Hey please enter your email and booking id");
            }
            break;
    }

}

function sendTextMessage(sender, message, type) {
    var token = "EAAJ7ZBAF5xnIBADufc6wp4jkGHSJLRf00kcJWZCeyyFrpijY5oQ2ofcEBsE8xJybqozJHrH1qtzfMqWoEzANrl8ZAPZBvt1iP5J1lE7oFs45KI3BgW6Ap6fHblTZAnybEKpZAbeBFSZAB1cg8Qnh2KaPHhvhQcubLuRYuoXqIcDRVWQkH8GUPFa";
    var messageData = '';
    if (type) {
        messageData = message;
    } else {
        messageData = {
            text: message
        }
    }
    request({
        url: global.config.facbookBaseApi + '/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: messageData,
        }
    }, function(error, response, body) {
        console.log("err===", error)
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        return true;
    });
}

function parseTextMessage(usermessage, sender, cb) {
    console.log("parseTextMessage===", usermessage)
    var authToken = 'Bearer RUIE534PUI2MK4VQIPIWC5FBJ3UYRWZB';
    var Deferred = promised.Deferred;
    var deferredObj = {
        "getConversationfromAi": new Deferred()
    };
    var getIntent = promised.all(deferredObj["getConversationfromAi"].promise);

    request({
        headers: {
            'Authorization': authToken
        },
        url: 'https://api.wit.ai/converse?q=' + encodeURI(usermessage) + '&session_id=' + sender,
        json: true,
        method: 'POST'
    }, function(err, res, body) {
        deferredObj["getConversationfromAi"].resolve(body);
    });
    getIntent.then(function(resolveArr) {
        var intentObj = resolveArr[0];
        console.log("intentObj=====", intentObj)
        if (intentObj && intentObj.entities && intentObj.entities.intent) {
            var intentValue = intentObj.entities.intent[0].value;
            senderIntent[sender]['intentValue'] = intentValue;
        }
        console.log(JSON.stringify(intentObj));
        respondUser(sender, intentObj, usermessage);
    });
}

function getWelcomeMessage() {
    var welcomePayload = {
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Welcome to Rehlat",
                        "item_url": "https://www.rehlat.com",
                        "subtitle": "Hi, there I can help you with following things. Pick an option.",
                        "buttons": [{
                            "type": "postback",
                            "title": "Cancel your ticket",
                            "payload": "crm"
                        }, {
                            "type": "postback",
                            "title": "Print Your Ticket",
                            "payload": "printTicket"
                        }, {
                            "type": "postback",
                            "title": "Book a flight",
                            "payload": "askcommunity"
                        }]
                    }]
                }
            }
        }
    }
    return welcomePayload;
}

function printTicket(sender, email, bookingId) {
    var bookingApiUrl = global.config.hotelBookingApi;
    var postBody = {
        "BookingId": bookingId,
        "Email": email
    }
    request({
        url: bookingApiUrl,
        json: true,
        method: 'POST',
        body: postBody
    }, function(err, res, body) {
        console.log("body=====", body);
        sendTicketMessage(sender,body)
        return true;
    });
}
function sendTicketMessage(sender,booking){
	var hotelsTemplatePayload = createHotelsTemplatePayload(booking);
	sendTextMessage(sender,hotelsTemplatePayload.message,"generic");
}
function createHotelsTemplatePayload(booking) {
    var hotelsPayload = [];
    var payloadSkeleton = {
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": booking.Name,
                        "subtitle": booking.Location,
                        "image_url": booking.ImageUrl,
                        "buttons": [{
                            "type": "web_url",
                            "url": "http://stage.rehlat.com/ar/hotels/Voucher/VrsF1dWe37mhcYReQ9ZCMQ2",
                            "title": "View Ticket"
                        }]
                    }]
                }
            }
        }
    }
    return payloadSkeleton;
}
module.exports = router;