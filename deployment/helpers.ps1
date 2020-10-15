function Test-AwsStackExists {
    [CmdletBinding()]
    param (
        [Parameter()]
        $StackName
    )

    $stackAlreadyExists = (aws cloudformation list-stacks | ConvertFrom-Json).StackSummaries | Where-Object { $_.StackStatus -ine "DELETE_COMPLETE" -and $_.StackName -ieq $StackName }

    if (!$?) {
        throw "Unable to check if the stack already exists"
    }

    return $stackAlreadyExists
}

function Get-AwsStack {
    [CmdletBinding()]
    param (
        [Parameter()]
        $StackName
    )

    return (aws cloudformation describe-stacks --stack-name $StackName | ConvertFrom-Json).Stacks[0]
}

function Get-AwsStackOutputs
{
    [CmdletBinding()]
    param (
        [Parameter()]
        $StackName
    )

    return (Get-AwsStack -StackName $StackName).Outputs
}

function Get-AwsStackOutput
{
    [CmdletBinding()]
    param (
        [Parameter()]
        $StackName,

        [Parameter()]
        $OutputName
    )

    return (Get-AwsStackOutputs -StackName $StackName | Where-Object { $_.OutputKey -ieq $OutputName }).OutputValue
}