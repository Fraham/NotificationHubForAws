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

        let pipelineStatus = "";
        let title = "CodePipeline";
        let colour = "#FFFFFF";

        let colours = {
            "SUCCEEDED": "#2ECC40",
            "FAILED": "#FF4136",
            "STARTED": "#0074D9"
        };

        let stateTable = {
            "STARTED": {
                "Approval": "Pipeline is waiting approval to release",
                "*": "Pipeline has started",
            },
            "SUCCEEDED":
            {
                "Approval": "Pipeline has been approved to release",
                "*": "Pipeline has finished successfully",
            },
            "FAILED":
            {
                "*": "Pipeline has failed",
            },
            "*": "Unknown state"
        };

        let state = snsMessage.detail.state;

        if (stateTable.hasOwnProperty(state) &&
            snsMessage.detail.type &&
            snsMessage.detail.type.category &&
            stateTable[state].hasOwnProperty(snsMessage.detail.type.category)) {
            pipelineStatus = stateTable[state][snsMessage.detail.type.category];
        } else if (stateTable.hasOwnProperty(state)) {
            pipelineStatus = stateTable[state]["*"];
        } else {
            pipelineStatus = stateTable["*"];
        }

        if (colours.hasOwnProperty(state)) {
            colour = colours[state];
        }

        let lines = [
            `Pipeline: ${snsMessage.detail.pipeline}`,
            `Status: ${pipelineStatus}`
        ];

        if (snsMessage.additionalAttributes && snsMessage.additionalAttributes && snsMessage.additionalAttributes.failedActions) {
            for (let j = 0; j < snsMessage.additionalAttributes.failedActions.length; j++) {
                const action = snsMessage.additionalAttributes.failedActions[j];

                if (action.additionalInformation) {
                    lines.push(`Reason: ${action.additionalInformation}`);
                }
            }
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
        Subject: "CodePipeline",
        TopicArn: process.env.MESSAGE_TOPIC
    };
    snsPublish.publish(params, context.done);
};