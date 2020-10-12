$stackName = "notificationHub" #todo: make this as an arg

$stackExists = (aws cloudformation list-stacks | ConvertFrom-Json).StackSummaries | Where-Object { $_.StackStatus -ine "DELETE_COMPLETE" -and $_.StackName -ieq $stackName }

if (!$?) {
    throw "Unable to check if the stack exists"
}

if (!($stackExists)){
    Write-Host "Stack doesn't exist"

    return
}

$bucketDomain = ((((aws cloudformation describe-stacks --stack-name $stackName | ConvertFrom-Json).Stacks[0]).Outputs) | Where-Object { $_.OutputKey -ieq "deploymentBucket" }).OutputValue

Write-Host "Bucket Domain: $($bucketDomain)"

$bucket = ($bucketDomain -split '\.')[0]

Write-Host "Bucket name: $($bucket)"

aws s3 rm "s3://$($bucket)" --recursive

aws cloudformation delete-stack --stack-name $stackName