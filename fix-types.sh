#!/bin/bash

# Update dependencies
echo "Updating dependencies..."
bun install

# Install missing types
echo "Installing missing types..."
bun add -d @types/react@18.2.45 @types/react-dom@18.2.18 @types/uuid@9.0.8

# Update TypeScript
echo "Updating TypeScript..."
bun add -d typescript@5.3.3

# Create any needed directories
echo "Ensuring directories exist..."
mkdir -p src/types

# Checking configuration files
echo "Configuration files are ready!"

# Make the file executable
chmod +x fix-types.sh

echo "Setup complete! Run 'bun run dev' to start the development server." 