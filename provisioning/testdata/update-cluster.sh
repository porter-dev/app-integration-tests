#! /bin/bash
set -euo pipefail

contractname=cluster-basic-no-id.json

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

if [ $CLUSTER_ID = 0 ]; 
then 
    contractname=cluster-basic-no-id.json
    envsubst < cluster-basic-no-id-template.json > apply-contract.json
else 
    contractname=cluster-basic-with-id.json
    envsubst < cluster-basic-with-id-template.json > apply-contract.json
fi

echo "Applying contract to cluster. If this returns an error, another integration test may be in progress. Please wait a few minutes and try again."
clusterid=$(ccp-cli manage contract update -f apply-contract.json -o json | jq '.cluster_id')
echo "Cluster ID: $clusterid"

NEXT_TYPE=$CURRENT_INSTANCE_TYPE
CURRENT_TYPE=$NEXT_INSTANCE_TYPE
CLUSTER_ID=$clusterid

echo "Updating values in Porter"

envsubst < template-porter.yaml > porter.yaml
porter apply -f porter.yaml