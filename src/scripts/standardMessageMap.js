const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

var helper = require('./helper');

exports.handler = (event, context, callback) => {

    if (!process.env.MESSAGE_TOPIC) {
        throw "Message Topic not set";
    }

    let messages = [];

    let body = helper.parseJsonString(event.body);

    console.log(body);
    console.log(body.messages);

    messages = helper.parseJsonString(body.messages);

    helper.sendMessagesToSns(messages, "StandardNotifications", process.env.MESSAGE_TOPIC, context);

    var response = {
        "statusCode": 204,
        "body": JSON.stringify({}),
        "isBase64Encoded": false
    };
    callback(null, response);
};