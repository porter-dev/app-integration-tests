# Create/update cluster using environment variables
contractname=cluster-basic-no-id.json

if [ -z "$PROJECT_ID" ]; 
then 
    echo "Project ID is not set"
    exit 1
fi

if [ -z "$CLUSTER_ID" ]; 
then 
    echo "Cluster ID is not set"
    exit 1
fi

if [ -z "$CURRENT_INSTANCE_TYPE" ]; 
then 
    echo "Current instance type is not set"
    exit 1
fi

if [ -z "$NEXT_INSTANCE_TYPE" ]; 
then 
    echo "Next instance type is not set"
    exit 1
fi

if [ $CLUSTER_ID = 0 ]; 
then 
    contractname=cluster-basic-no-id.json
    envsubst < cluster-basic-no-id-template.json > apply-contract.json
else 
    contractname=cluster-basic-with-id.json
    envsubst < cluster-basic-with-id-template.json > apply-contract.json
fi

clusterid=$(ccp-cli contract update -f apply-contract.json -o json | jq '.ClusterId')
echo "Cluster ID: $clusterid"

NEXT_TYPE=$CURRENT_INSTANCE_TYPE
CURRENT_TYPE=$NEXT_INSTANCE_TYPE
CLUSTER_ID=$clusterid
envsubst < template-porter.yaml > porter.yaml
porter apply -f porter.yaml