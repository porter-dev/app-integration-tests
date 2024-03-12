#! /bin/bash

if [ -z "$PROJECT_ID" ]; 
then 
    echo "Project ID is not set"
    exit 1
fi

echo "Running permissions update for project $PROJECT_ID"
ccp-cli manage cloud update-permissions --project-id $PROJECT_ID
echo "Permissions updated for project $PROJECT_ID - exit code: $?"