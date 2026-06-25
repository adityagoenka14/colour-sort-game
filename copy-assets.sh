#!/bin/bash
# copy-assets.sh
# Copies web assets to the Android app's asset folder.

# Exit immediately if a command exits with a non-zero status
set -e

WORKSPACE_DIR="/Users/adityagoenka/.gemini/antigravity/scratch/color-sort-game"
ASSETS_DIR="$WORKSPACE_DIR/android-app/app/src/main/assets"

echo "Creating assets directory if it doesn't exist..."
mkdir -p "$ASSETS_DIR"

echo "Copying index.html, app.js, and styles.css..."
cp "$WORKSPACE_DIR/index.html" "$ASSETS_DIR/index.html"
cp "$WORKSPACE_DIR/app.js" "$ASSETS_DIR/app.js"
cp "$WORKSPACE_DIR/styles.css" "$ASSETS_DIR/styles.css"

# Clean up version queries inside index.html for local file loading to prevent any resolution issues
sed -i '' 's/\.css?v=[0-9]*/.css/g' "$ASSETS_DIR/index.html"
sed -i '' 's/\.js?v=[0-9]*/.js/g' "$ASSETS_DIR/index.html"

echo "Assets copied successfully!"
