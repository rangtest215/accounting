#!/bin/bash

# 1. Clean up conflicting packages
echo "Cleaning up old versions..."
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done

# 2. explicit removal of incorrect binaries if any
rm -f /usr/bin/docker-compose
rm -f /usr/local/bin/docker-compose

# 3. Download and run the official Docker install script
echo "Installing official Docker Engine..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Verify installation
echo "Verifying installation..."
docker compose version

echo "Done! You can now run: docker compose up -d --build"
