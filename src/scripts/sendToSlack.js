var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
const https = AWSXRay.captureHTTPs(require('https'));

exports.handler = async (event) => {

    console.log(event);
};