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

echo "Deleting cluster"
ccp-cli manage contract delete --project-id $PROJECT_ID --cluster-id $CLUSTER_ID

export NEXT_INSTANCE_TYPE="t3.large"
export CURRENT_INSTANCE_TYPE="t3.medium"
export CLUSTER_ID="0"

echo "Updating values in Porter"

envsubst < template-porter.yaml > porter.yaml
porter apply -f porter.yaml