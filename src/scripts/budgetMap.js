const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

var helper = require('./helper');



exports.handler = (event, context) => {

    if (event.includes("SNS Topic Verified")){
        return;
    }

    if (!process.env.MESSAGE_TOPIC) {
        throw "Message Topic not set";
    }

    helper.checkRecordsInSns(event);

    let messages = [];

    for (var i = 0; i < event.Records.length; i++) {
        let snsMessage = helper.parseSnsMessage(event.Records[i]);

        console.log(snsMessage);   
    }

    helper.sendMessagesToSns(messages, "Budget", process.env.MESSAGE_TOPIC, context);
};