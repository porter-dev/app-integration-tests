#! /bin/bash

if [ -z "$PROJECT_ID" ]; 
then 
    echo "Project ID is not set"
    exit 1
fi

ccp-cli manage cloud update-permissions --project-id $PROJECT_ID