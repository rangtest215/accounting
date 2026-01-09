# Deploying to Linode

This guide explains how to deploy your accounting application to a Linode server using Docker.

## Prerequisites

1.  **Linode Account**: A Linode account with an active Nanode (1GB) or higher.
2.  **SSH Access**: You should be able to SSH into your Linode server.
3.  **Git**: Installed on your local machine and (optionally) on the server.
4.  **Docker & Docker Compose**: Installed on the Linode server.

## Step 1: Prepare the Server (One-time Setup)

1.  **SSH into your server**:
    ```bash
    ssh root@<your-linode-ip>
    ```

2.  **Install Docker and Docker Compose**:
    (If not already installed)
    ```bash
    ```bash
    apt-get update
    # The default repo often has an old version. We'll use the official script for the latest version.
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```

3.  **Start Docker**:
    (The script usually starts it, but just in case)
    ```bash
    systemctl start docker
    systemctl enable docker
    ```

## Step 1.5: Configure Environment Variables

**Crucial Step**: Your app needs Firebase keys to work.

1.  **Create a `.env` file** in your project folder on the server:
    ```bash
    nano ~/accounting_app/.env
    ```
    (Or wherever you plan to put your code)

2.  **Paste your keys** (Copy them from your local `.env` file):
    ```env
    VITE_FIREBASE_API_KEY=your_key_here
    VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
    VITE_FIREBASE_PROJECT_ID=your_id_here
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
    VITE_FIREBASE_APP_ID=your_app_id_here
    ```
    *Press `Ctrl+X`, then `Y`, then `Enter` to save.*

## Step 2: Transfer Your Code

You have two main options:

### Option A: Using Git (Recommended)
1.  **Push your code** to a GitHub repository.
2.  **Clone on the server**:
    ```bash
    git clone <your-repo-url> accounting_app
    cd accounting_app
    ```

### Option B: Using SCP (Direct Copy)
If you don't want to use GitHub, copy files directly key files:
```bash
# Run this from your LOCAL project folder
scp -r src public Dockerfile docker-compose.yml nginx.conf package.json vite.config.js index.html root@<your-linode-ip>:~/accounting_app/
```

## Step 3: Deploy

1.  **Navigate to the project directory** on the server:
    ```bash
    cd ~/accounting_app  # Adjust path if you copied it elsewhere
    ```

2.  **Build and Run**:
    ```bash
    # Note: Use 'docker compose' (v2, no hyphen) instead of 'docker-compose' (v1)
    docker compose up -d --build
    ```
    - `-d`: Runs in detached mode (background).
    - `--build`: Forces a rebuild of the image.

## Step 4: Verify

1.  Open your browser and visit `http://<your-linode-ip>`.
2.  You should see your application running.

## Troubleshooting

### "KeyError: 'ContainerConfig'" or "Unable to locate package"
This means you have an old or broken Docker installation. The easiest fix is to reinstall using the official script:

1.  **Remove old versions**:
    ```bash
    apt-get remove docker docker-engine docker.io containerd runc docker-compose
    ```
    *Note: It is normal to see "Unable to locate package" errors here if you didn't have those specific versions installed. You can safely ignore them and proceed.*

2.  **Install modern Docker (includes Compose)**:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```

3.  **Try again**:
    ```bash
    docker compose up -d --build
    ```

## Updating the Application

When you make changes locally:

1.  **Push changes** to GitHub (if using Option A).
2.  **On the server**:
    ```bash
    cd ~/accounting_app
    git pull                  # If using Git
    docker compose up -d --build  # Use the new command
    ```
