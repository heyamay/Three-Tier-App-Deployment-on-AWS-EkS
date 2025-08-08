# Local Development Setup for Three-Tier App

This document provides detailed instructions for setting up and running the three-tier application on your local machine using Docker and Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## 1. Clone the Repository

First, clone the project repository from GitHub to your local machine.

```bash
git clone git@github.com:heyamay/Three-Tier-App-Deployment-on-AWS-EkS.git
cd three-tier-app
```

## 2. Understanding the Local Setup (`docker-compose.yml`)

The `docker-compose.yml` file is the core of the local setup. It defines the three services (tiers) of our application:

- **`db` (Data Tier):**
  - Builds a Docker image from the `./database/Dockerfile`.
  - Uses the official `mysql:8.0` image.
  - Initializes a database named `tasks_db` with a `user` and `password`.
  - Runs a `healthcheck` to ensure the database is ready before other services connect to it.
  - Uses a Docker volume (`db-data`) to persist MySQL data, so your tasks are not lost when the container restarts.

- **`backend` (Application Tier):**
  - Builds a Docker image from the `./backend/Dockerfile`.
  - Runs a Node.js/Express server.
  - Connects to the `db` service using the hostname `db`.
  - Waits for the `db` service to be healthy (`condition: service_healthy`) before starting.
  - Exposes port `3001` for API requests.

- **`frontend` (Presentation Tier):**
  - Builds a Docker image from the `./frontend/Dockerfile`.
  - Runs a React application served by Nginx.
  - Communicates with the `backend` service for API calls.
  - Waits for the `backend` service to start (`condition: service_started`) before starting.
  - Exposes port `3000` to be accessible from your browser.

## 3. Running the Application

To build the Docker images and start all three services, run the following command from the root of the project directory (`three-tier-app`):

```bash
docker-compose up --build -d
```

- `--build`: This flag forces Docker Compose to rebuild the images, which is important after making code changes.
- `-d`: This flag runs the containers in detached mode, meaning they will run in the background.

## 4. Accessing the Application

Once the containers are running, you can access the application:

- **Frontend:** Open your web browser and navigate to `http://localhost:3000`.
- **Backend API:** The API is available at `http://localhost:3001`.

## 5. Verifying Data in the Database

After you've added some tasks through the frontend, you can verify that they are correctly saved in the MySQL database.

1.  Find the name of your database container:
    ```bash
    docker ps
    ```
    Look for the container with the `three-tier-app-db` image. The name will be something like `three-tier-app-db-1`.

2.  Execute a `SELECT` query inside the container:
    ```bash
    docker exec <your-db-container-name> mysql -u user -ppassword -e 'SELECT * FROM tasks_db.tasks;'
    ```
    Replace `<your-db-container-name>` with the actual name from the previous step. This command will print a table with all the tasks stored in the database.

## 6. Troubleshooting

### `ER_NOT_SUPPORTED_AUTH_MODE` Error in Backend Logs

This error occurs because the default authentication plugin in MySQL 8 is not supported by the older `mysql` Node.js driver.

- **Solution:** We replaced the `mysql` package with `mysql2` in `backend/package.json` and updated `backend/index.js` to `require('mysql2')`.

### `connect ECONNREFUSED` Error in Backend Logs

This error means the backend service started before the database was ready to accept connections.

- **Solution:** We added a `healthcheck` to the `db` service and a `depends_on` with `condition: service_healthy` to the `backend` service in the `docker-compose.yml` file.

## 7. Stopping the Application

To stop and remove all the running containers, networks, and volumes created by Docker Compose, run:

```bash
docker-compose down
```