# NotificationHubForAws

Notification Hub For Aws is a service that takes events from different Aws services, converts the event into a common message format and then sends out the event to message consumers.

For each of the supported service there is a SNS topic ARN outputted by the CloudFormation script. Adding the ARN to the service SNS logging will push out all the events to the configured message consumers.

## Post deployment tasks

* Add CloudWatchLambdaInsightsExecutionRolePolicy to the lambdas roles
* Add slack API token in secrets manager
* Add discord API token in secrets manager

## Supported service

This is a list of the services that are currently supported in the hub. Split into two sections, event creators are the services that generate the notifications and message consumers are the services that display the notification.

### Event Creators
* CloudWatch Alarms
* CodeBuild
* CodePipeline
* Config

### Message Consumers
* Slack
* Discord

## Future extends
* Events through ApiGateway
* More Event Creators
    * RDS
    * EC2 scaling
    * WAF
    * S3 events
        * https://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html
* More Message Consumers
