#!/bin/bash

# Check if at least two arguments are given (# of arguments is $#)
if [ $# -lt 2 ]; then
    echo "Usage: $0 'key1=value1,key2=value2,...' filename"
    exit 1
fi

# The first argument is the comma separated key-value pairs
kv_pairs=$1

# The second argument is the filename
filename=$2

# Check if the file exists
if [ ! -f "$filename" ]; then
    echo "Error: File '$filename' not found."
    exit 1
fi

# Convert the comma-separated list into an array
IFS=',' read -r -a pairs <<< "$kv_pairs"

# Iterate over each key-value pair
for pair in "${pairs[@]}"; do
    # Split the pair into key and value
    IFS='=' read -r key value <<< "$pair"

    # Use sed to replace the key with the value in the file
    sed -i "s/$key/$value/g" "$filename"
done

echo "Replacement completed."
