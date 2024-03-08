#! /bin/bash
set -euo pipefail

if [ -z "$PROJECT_ID" ]; 
then 
    echo "Project ID is not set"
    exit 1
fi
echo "Project ID: $PROJECT_ID"

if [ -z "$CLUSTER_ID" ]; 
then 
    echo "Cluster ID is not set"
    exit 1
fi
echo "Cluster ID: $CLUSTER_ID"

if [ -z "$CURRENT_INSTANCE_TYPE" ]; 
then 
    echo "Current instance type is not set"
    exit 1
fi
echo "Current instance type: $CURRENT_INSTANCE_TYPE"

if [ -z "$NEXT_INSTANCE_TYPE" ]; 
then 
    echo "Next instance type is not set"
    exit 1
fi
echo "Next instance type: $NEXT_INSTANCE_TYPE"

echo "Deleting cluster"
ccp-cli manage contract delete --project-id $PROJECT_ID --cluster-id $CLUSTER_ID

NEXT_TYPE=$CURRENT_INSTANCE_TYPE
CURRENT_TYPE=$NEXT_INSTANCE_TYPE
CLUSTER_ID=0

echo "Updating values in Porter"

envsubst < template-porter.yaml > porter.yaml
porter apply -f porter.yaml