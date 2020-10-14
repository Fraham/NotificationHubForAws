const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

var helper = require('./helper');

exports.handler = (event, context) => {

    if (!process.env.MESSAGE_TOPIC) {
        throw "Message Topic not set";
    }

    if (!event || !event.Records || event.Records.length == 0) {
        throw "No event records passed";
    }

    let messages = [];

    for (var i = 0; i < event.Records.length; i++) {

        let snsMessage = helper.parseSnsMessage(event.Records[i]);

        let title = "CloudWatch Alarm";
        let colour = "#FFFFFF";

        let colours = {
            "OK": "#2ECC40",
            "ALARM": "#FF4136",
            "INSUFFICIENT_DATA": "#FFDC00"
        };

        if (!snsMessage.AlarmName || !snsMessage.NewStateValue || !snsMessage.OldStateValue) {
            throw "Not valid CloudWatch alarm message data";
        }

        let alarmName = snsMessage.AlarmName;
        let newStatus = snsMessage.NewStateValue;
        let oldStatus = snsMessage.OldStateValue;

        let lines = [
            `Alarm: ${alarmName}`,
            `Old Status: ${oldStatus}`,
            `New Status: ${newStatus}`,
        ];

        if (snsMessage.Trigger) {
            if (snsMessage.Trigger.MetricName) {
                lines.push(
                    `Metric: ${snsMessage.Trigger.MetricName}`
                );
            }
            if (snsMessage.Trigger.Namespace) {
                lines.push(
                    `Namespace: ${snsMessage.Trigger.Namespace}`
                );
            }
        }

        if (snsMessage.AlarmDescription) {
            lines.push(
                `Description: ${snsMessage.AlarmDescription}`
            );
        }


        if (colours.hasOwnProperty(newStatus)) {
            colour = colours[newStatus];
        }

        let items = [
            {
                colour: colour,
                lines: lines
            }
        ];

        messages.push({
            text: title,
            items: items
        });
    }

    if (messages.length == 0) {
        return;
    }

    let fullMessage = {
        "messages": messages
    };

    var snsPublish = new AWS.SNS();
    var params = {
        Message: JSON.stringify(fullMessage),
        Subject: "CloudWatchAlarm",
        TopicArn: process.env.MESSAGE_TOPIC
    };
    snsPublish.publish(params, context.done);
};