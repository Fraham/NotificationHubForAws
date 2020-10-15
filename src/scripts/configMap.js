const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

var helper = require('./helper');

exports.handler = (event, context) => {

    if (!process.env.MESSAGE_TOPIC) {
        throw "Message Topic not set";
    }

    helper.checkRecordsInSns(event);

    let messages = [];

    for (var i = 0; i < event.Records.length; i++) {

        let snsMessage = helper.parseSnsMessage(event.Records[i]);

        let title = "";
        let items = [];

        let colours = {
            "COMPLIANT": "#2ECC40",
            "NON_COMPLIANT": "#FF4136",
            "NOT_APPLICABLE": "#0074D9"
        };

        switch (snsMessage.messageType) {
            case "ConfigurationItemChangeNotification":
            case "ConfigurationSnapshotDeliveryStarted":
                continue;
            case "ComplianceChangeNotification":
                let resourceId = snsMessage.resourceId;
                let newCompliance = snsMessage.newEvaluationResult.complianceType;
                let rule = snsMessage.configRuleName;
                let colour = "#FFFFFF";

                let lines = [
                    `Resource: ${resourceId}`,
                    `Compliance: ${newCompliance}`,
                    `Rule: ${rule}`
                ];

                if (colours.hasOwnProperty(newCompliance)) {
                    colour = colours[newCompliance];
                }

                items = [
                    {
                        colour: colour,
                        lines: lines
                    }
                ];

                break;
            case "ConfigurationSnapshotDeliveryCompleted":
                title = "Configuration snapshot delivered";
                break;
            case "ConfigurationHistoryDeliveryCompleted":
                title = "Configuration history delivered";
                break;
            case "ConfigRulesEvaluationStarted":
                attachments = [];

                title = "Evaluating rules";

                items = [
                    {
                        colour: "#0074D9",
                        lines: snsMessage.configRuleNames
                    }
                ];

                break;
        }

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
        Subject: "Config",
        TopicArn: process.env.MESSAGE_TOPIC
    };
    snsPublish.publish(params, context.done);
};