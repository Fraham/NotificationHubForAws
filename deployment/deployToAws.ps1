Write-Host "Starting deployment to AWS"

$environment = "environment" #todo: make this as an arg
$stackName = "notificationHub" #todo: make this as an arg

$runningStatuses = @(
    "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
    "UPDATE_ROLLBACK_IN_PROGRESS",

    "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",

    "ROLLBACK_IN_PROGRESS",
    "DELETE_IN_PROGRESS",
    "CREATE_IN_PROGRESS",
    "UPDATE_IN_PROGRESS"
)

$successStatuses = @(
    "UPDATE_COMPLETE",
    "CREATE_COMPLETE"
)

Write-Host "Starting validating files"

$templatesFolder = "src/"

if (!(Test-Path $templatesFolder)) {
    throw "Unable to find template folder at $($templatesFolder)"
}

$initialTemplate = "$($templatesFolder)initialTemplate.json"
$template = "$($templatesFolder)template.json"

if (!(Test-Path $initialTemplate -Type Leaf)) {
    throw "Unable to find initial template file at $($initialTemplate)"
}

if (!(Test-Path $template -Type Leaf)) {
    throw "Unable to find template file at $($template)"
}

$parameterFilesFolder = "deployment/parameterFiles/"

if (!(Test-Path $parameterFilesFolder)) {
    throw "Unable to find parameter files folder at $($parameterFilesFolder)"
}

$parameterFile = "$($parameterFilesFolder)$($environment).json"

if (!(Test-Path $parameterFile -Type Leaf)) {
    throw "Unable to find parameter file at $($parameterFile)"
}


Write-Host "Finished validating files"

$stackAlreadyExists = (aws cloudformation list-stacks | ConvertFrom-Json).StackSummaries | Where-Object { $_.StackStatus -ine "DELETE_COMPLETE" -and $_.StackName -ieq $stackName }

if (!$?) {
    throw "Unable to check if the stack already exists"
}

if (!($stackAlreadyExists)) {
    Write-Host "Stack doesn't exist. Creating stack with initial template: $($initialTemplate)"

    aws cloudformation create-stack --stack-name $($stackName) --template-body "file://$($initialTemplate)" --no-verify-ssl

    if (!$?) {
        throw "Unable to create stack $($stackName)"
    }

    $deploying = $true

    while ($deploying) 
    {
        $currentStatus = ((aws cloudformation describe-stacks --stack-name $stackName | ConvertFrom-Json).Stacks[0]).StackStatus

        if (!$?) {
            throw "Unable to get the status of the stack $($stackName)"
        }

        Write-Host "Current status is $($currentStatus)"

        if ($runningStatuses -icontains $currentStatus) 
        {
            Start-Sleep -Seconds 5
        }
        else 
        {
            $deploying = $false
        }
    }

    if (!($successStatuses -icontains $currentStatus))
    {
        throw "CloudFormaton was not successful"
    }

    Write-Host "CloudFormation complete"
}
else {
    Write-Host "Stack does exist."
}

$bucketDomain = ((((aws cloudformation describe-stacks --stack-name $stackName | ConvertFrom-Json).Stacks[0]).Outputs) | Where-Object { $_.OutputKey -ieq "deploymentBucket" }).OutputValue
$bucket = ($bucketDomain -split '\.')[0]

Push-Location .\src

Push-Location .\dependencies\nodejs\

npm install

Pop-Location

sam package --template-file template.json --s3-bucket $bucket --output-template-file out.yaml

sam deploy --template-file ./out.yaml --stack-name $stackName --capabilities CAPABILITY_IAM

Pop-Location

Write-Host "Finished deployment to AWS"