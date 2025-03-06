#!/bin/bash

# Check if folder name is provided
if [ -z "$1" ]; then
	echo "Usage: $0 folderName"
	exit 1
fi

# Folder name from argument
FOLDER_NAME="$1"

# API endpoint
API_URL="https://assets.dovely.tech/upload?folder=$FOLDER_NAME"

# Check if the folder exists
if [ ! -d "$FOLDER_NAME" ]; then
	echo "Error: Folder '$FOLDER_NAME' does not exist"
	exit 1
fi

# Find all files in the folder (excluding directories)
FILES=$(find "$FOLDER_NAME" -type f)

# Check if there are any files to upload
if [ -z "$FILES" ]; then
	echo "Error: No files found in '$FOLDER_NAME'"
	exit 1
fi

# Build curl command with multiple -F flags for each file
CURL_CMD="curl -s"
for FILE in $FILES; do
	CURL_CMD="$CURL_CMD -F \"files=@$FILE\""
done
CURL_CMD="$CURL_CMD \"$API_URL\""

# Execute the curl command and capture the response
echo "Uploading files from '$FOLDER_NAME'..."
RESPONSE=$(eval "$CURL_CMD")

# Check if the response contains URLs
if echo "$RESPONSE" | grep -q '"urls"'; then
	echo "Upload successful! URLs:"
	echo "$RESPONSE" | jq -r '.urls[]' # Pretty-print URLs (requires jq)
else
	echo "Upload failed. Response:"
	echo "$RESPONSE"
fi
