Write-Host "Starting deployment to AWS"

$templatesFolder = "src/"

if (!(Test-Path $templatesFolder))
{
    throw "Unable to find template folder at $($templatesFolder)"
}

$initialTemplate = "$($templatesFolder)initialTemplate.json"
$template = "$($templatesFolder)template.json"

if (!(Test-Path $initialTemplate -Type Leaf))
{
    throw "Unable to find initial template file at $($initialTemplate)"
}

if (!(Test-Path $template -Type Leaf))
{
    throw "Unable to find template file at $($template)"
}

Write-Host "Finished deployment to AWS"