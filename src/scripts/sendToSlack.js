var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
const https = AWSXRay.captureHTTPs(require('https'));

var slackApiToken = "";
var groupOverrideUsername = "";
var groupOverrideChannel = "";
var groupOverrideIcon = "";

async function getSecret(secretName) {

    var client = new AWS.SecretsManager({
        region: process.env.AWS_REGION
    });

    return new Promise((resolve, reject) => {
        client.getSecretValue({ SecretId: secretName }, (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            var secret = "NotSet";

            if ('SecretString' in data) {
                secret = data.SecretString;

            }
            else {
                let buff = new Buffer(data.SecretBinary, 'base64');
                secret = buff.toString('ascii');
            }

            if (secret === "NotSet") {
                reject(`${secretName} not set in Secrets Manager. The default needs to be overwritten`);
                return;
            }

            resolve(secret);
        });
    });
}

const doPostRequest = (body) => {

    let promise = new Promise((resolve, reject) => {

        if (body.Message) {
            if (typeof body.Message === 'string') {
                body = JSON.parse(body.Message);
            }
            else {
                body = body.Message;
            }
        }

        if (body.responsePayload) {
            if (typeof body.responsePayload === 'string') {
                body = JSON.parse(body.responsePayload);
            }
            else {
                body = body.responsePayload;
            }
        }

        let channel = process.env.CHANNEL;
        let username = process.env.USERNAME;
        let icon = process.env.ICON;
        let attachments = [];
        let text = "";

        if (groupOverrideChannel) {
            channel = groupOverrideChannel;
        }
        if (body.channel) {
            channel = body.channel;
        }

        if (groupOverrideUsername) {
            username = groupOverrideUsername;
        }
        if (body.username) {
            username = body.username;
        }

        if (groupOverrideIcon) {
            icon = groupOverrideIcon;
        }
        if (body.icon) {
            icon = body.icon;
        }

        text = body.text;

        if (body.items) {
            for (let i = 0; i < body.items.length; i++) {
                const item = body.items[i];

                let attachmentText = item.text;

                if (item.lines) {
                    attachmentText = item.lines.join('\n');
                }

                let attachment = {
                    color: item.colour,
                    text: attachmentText
                };

                attachments.push(attachment);
            }
        }

        const slackBody = {
            "channel": channel,
            "text": text,
            "username": username,
            "icon_url": icon,
            "attachments": attachments
        };

        const options = {
            'method': 'POST',
            'hostname': 'slack.com',
            'path': '/api/chat.postMessage',
            'headers': {
                'Authorization': `Bearer ${slackApiToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            //add check that res.ok is true
            resolve(JSON.stringify(res.statusCode));
        });

        req.on('error', (e) => {
            reject(e.message);
        });

        req.write(JSON.stringify(slackBody));

        req.end();
    });

    return promise;
};

exports.handler = async (event) => {

    if (!process.env.SECRET_NAME) {
        throw "Secret Arn not set in environment";
    }

    await getSecret(process.env.SECRET_NAME).then(
        result => {
            slackApiToken = result;
        }
    ).catch(err => {
        console.error(err);
        throw err;
    });

    if (!event || !event.Records || event.Records.length == 0) {
        throw "No event records passed";
    }

    for (var i = 0; i < event.Records.length; i++) {
        try {
            let sns = event.Records[i].Sns;

            if (typeof sns === 'string') {
                sns = JSON.parse(sns);
            }

            if (typeof sns.Message === 'string') {
                sns.Message = JSON.parse(sns.Message);
            }

            if (sns.Message && sns.Message.messages) {
                groupOverrideUsername = sns.Message.username;
                groupOverrideChannel = sns.Message.channel;
                groupOverrideIcon = sns.Message.icon;

                for (let j = 0; j < sns.Message.messages.length; j++) {
                    let element = sns.Message.messages[j];

                    if (typeof element === 'string') {
                        element = JSON.parse(element);
                    }

                    await doPostRequest(element)
                        .then(result => {
                            if (result != 200) {
                                throw "Slack didn't respond with a 200";
                            }
                        })
                        .catch(err => {
                            throw err;
                        });
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    }
};