const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const https = AWSXRay.captureHTTPs(require('https'));

var helper = require('./helper');

var discordApiToken = "";
var groupOverrideUsername = "";
var groupOverrideIcon = "";

const doPostRequest = (body) => {

    let promise = new Promise((resolve, reject) => {

        if (body.Message) {
            body = helper.parseJsonString(body.Message);
        }

        if (body.responsePayload) {
            body = helper.parseJsonString(body.responsePayload);
        }

        let username = process.env.USERNAME;
        let icon = process.env.ICON;
        let embeds = [];
        let text = "";

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

                let embedText = item.text;

                if (item.lines) {
                    embedText = item.lines.join('\n');
                }

                let embed = {
                    color: parseInt(item.colour.replace("#", "0x")),
                    title: embedText
                };

                embeds.push(embed);
            }
        }

        const discordBody = {
            "content": text,
            "username": username,
            "avatar_url": icon,
            "embeds": embeds
        };

        const options = {
            'method': 'POST',
            'hostname': 'discordapp.com',
            'path': `/api/webhooks/${discordApiToken}`,
            'headers': {
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

        req.write(JSON.stringify(discordBody));

        req.end();
    });

    return promise;
};

exports.handler = async (event) => {

    helper.checkRecordsInSns(event);

    if (!process.env.SECRET_NAME) {
        throw "Secret Arn not set in environment";
    }

    await helper.getSecret(process.env.SECRET_NAME).then(
        result => {
            discordApiToken = result;
        }
    ).catch(err => {
        console.error(err);
        throw err;
    });

    for (var i = 0; i < event.Records.length; i++) {
        try {
            let snsMessage = helper.parseSnsMessage(event.Records[i]);

            if (snsMessage && snsMessage.messages) {
                groupOverrideUsername = snsMessage.username;
                groupOverrideIcon = snsMessage.icon;

                for (let j = 0; j < snsMessage.messages.length; j++) {

                    let element = helper.parseJsonString(snsMessage.messages[j]);

                    await doPostRequest(element)
                        .then(result => {
                            if (result != 204) {
                                throw "Discord didn't respond with a 204";
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