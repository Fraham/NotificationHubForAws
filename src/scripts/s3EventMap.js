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

        if ((snsMessage.event && snsMessage.event === "s3:TestEvent") || (snsMessage.Event && snsMessage.Event === "s3:TestEvent")){
            /* 
                S3 sends out this test event when a new event configuration is setup
                It doesn't conform to the same standard so I just move past it
            */
            continue;
        }

        console.log(snsMessage);

        for (var j = 0; j < snsMessage.Records.length; j++) {
            let s3Message = snsMessage.Records[j];

            console.log(s3Message);

            if (!s3Message.eventSource || s3Message.eventSource !== "aws:s3") {
                throw "Incorrect source";
            }
    
            let title = "S3 Events";
            let colour = "#0074D9";
    
            let lines = [
                `Event Name: ${s3Message.eventName}`,
                `Event Time: ${s3Message.eventTime}`,
            ];
    
            if (s3Message.s3) {
                let s3 = s3Message.s3;
                if (s3.bucket){
                    let bucket = s3.bucket;
    
                    if (bucket.name){
                        lines.push(
                            `Bucket Name: ${bucket.name}`
                        );
                    }
    
                    if (bucket.arn){
                        lines.push(
                            `Bucket ARN: ${bucket.arn}`
                        );
                    }
                }
                if (s3.object && s3.object.key){
                    lines.push(
                        `Object Key: ${s3.object.key}`
                    );
                }
            }
    
            if (s3Message.requestParameters && s3Message.requestParameters.sourceIPAddress){
                lines.push(
                    `Source Ip: ${s3Message.requestParameters.sourceIPAddress}`
                );
            }
    
            if (s3Message.userIdentity && s3Message.userIdentity.principalId){
                lines.push(
                    `User Identity: ${s3Message.userIdentity.principalId}`
                );
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
    }

    helper.sendMessagesToSns(messages, "S3Events", process.env.MESSAGE_TOPIC, context);
};