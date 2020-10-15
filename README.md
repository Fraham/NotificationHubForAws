# NotificationHubForAws

NotificationHubForAws

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
* More Message Consumers
