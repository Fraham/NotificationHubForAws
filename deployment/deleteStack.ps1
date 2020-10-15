$stackName = "notificationHub" #todo: make this as an arg

. "$($PSScriptRoot)/helpers.ps1"

$stackExists = Test-AwsStackExists -StackName $stackName

if (!($stackExists)){
    Write-Host "Stack doesn't exist"
    return
}

$bucket = ((Get-AwsStackOutput -StackName $stackName -OutputName "deploymentBucket") -split '\.')[0]

Write-Host "Bucket name: $($bucket)"

aws s3 rm "s3://$($bucket)" --recursive

aws cloudformation delete-stack --stack-name $stackName