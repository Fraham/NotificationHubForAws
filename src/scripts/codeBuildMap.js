const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

var helper = require('./helper');

const colours = {
    "SUCCEEDED": "#2ECC40",
    "FAILED": "#FF4136",
    "STOPPED": "#FF4136",
    "STARTED": "#0074D9",
    "IN_PROGRESS": "#0074D9"
};

function parsePhaseChange(stateMessage) {
    let colour = "#FFFFFF";
    var title = stateMessage.detailType;

    var buildStatus = stateMessage.detail["completed-phase-status"];

    let lines = [
        `Project Name: ${stateMessage.detail["project-name"]}`,
        `Build Status: ${buildStatus}`,
        `Phase: ${stateMessage.detail["completed-phase"]}`
    ];

    if (stateMessage.detail['additional-information'] && stateMessage.detail['additional-information']['build-number']) {
        lines.push(
            `Build Number: ${stateMessage.detail['additional-information']['build-number']}`
        );
    }

    if (colours.hasOwnProperty(buildStatus)) {
        colour = colours[buildStatus];
    }

    items = [
        {
            colour: colour,
            lines: lines
        }
    ];

    return [{
        text: title,
        items: items
    }];
}

function parseStateChange(stateMessage) {
    let colour = "#FFFFFF";
    var title = stateMessage.detailType;

    var buildStatus = stateMessage.detail["build-status"];

    let lines = [
        `Project Name: ${stateMessage.detail["project-name"]}`,
        `Build Status: ${buildStatus}`
    ];

    if (stateMessage.detail['additional-information'] && stateMessage.detail['additional-information']['build-number']) {
        lines.push(
            `Build Number: ${stateMessage.detail['additional-information']['build-number']}`
        );
    }

    if (colours.hasOwnProperty(buildStatus)) {
        colour = colours[buildStatus];
    }

    items = [
        {
            colour: colour,
            lines: lines
        }
    ];

    return [{
        text: title,
        items: items
    }];
}

exports.handler = (event, context) => {

    if (!process.env.MESSAGE_TOPIC) {
        throw "Message Topic not set";
    }

    helper.checkRecordsInSns(event);

    let messages = [];

    for (var i = 0; i < event.Records.length; i++) {

        let snsMessage = helper.parseSnsMessage(event.Records[i]);

        if (!snsMessage.source || snsMessage.source !== "aws.codebuild") {
            throw "Incorrect source";
        }

        if (!snsMessage.detailType) {
            throw "DetailType not declared";
        }

        var newMessages = [];

        if (snsMessage.detailType === "CodeBuild Build State Change") {
            newMessages = parseStateChange(snsMessage);
        }
        else if (snsMessage.detailType === "CodeBuild Build Phase Change") {
            newMessages = parsePhaseChange(snsMessage);
        }
        else {
            throw `Unknown DetailType: ${snsMessage.detailType}`;
        }

        if (newMessages.length > 0) {
            messages = messages.concat(newMessages);
        }
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
        Subject: "CodeBuild",
        TopicArn: process.env.MESSAGE_TOPIC
    };
    snsPublish.publish(params, context.done);
};