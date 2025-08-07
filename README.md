# Plan for Three-Tier App Deployment

## Objective
Build and deploy a three-tier web application (Presentation, Application, Data layers) on AWS EKS, using Docker for containerization, MySQL as the database, and ALB for load balancing. The app will allow users to create, view, and delete tasks, with a React frontend, Node.js backend, and MySQL database.

## Tools and Technologies
* **Frontend**: React (Presentation Tier)
* **Backend**: Node.js with Express (Application Tier)
* **Database**: MySQL (Data Tier)
* **Containerization**: Docker
* **Orchestration**: Kubernetes (AWS EKS)
* **AWS Services**:
    * **EKS**: Managed Kubernetes cluster
    * **ALB**: Application Load Balancer for routing traffic
    * **EC2**: Worker nodes for EKS
    * **IAM**: Roles and policies for secure access
    * **VPC**: Isolated network for resources
    * **ASG**: Auto Scaling Group for EC2 nodes (via EKS managed node groups)
* **Local Environment**: WSL2 (Ubuntu) with AWS CLI, kubectl, Docker, and Node.js
* **Other**: Git for version control, AWS CLI for infrastructure setup

## Application Overview
* **Frontend**: A React app with a form to create tasks and a list to display/delete tasks.
* **Backend**: A Node.js Express API with endpoints for CRUD operations (POST /tasks, GET /tasks, DELETE /tasks/:id).
* **Database**: MySQL to store tasks with columns `id`, `title`, and `description`.
* **Deployment**: Each tier runs in its own Docker container, orchestrated by Kubernetes on EKS, with ALB routing traffic to the frontend and backend services.

## Step-by-Step Plan

### 1. Local Setup (WSL2)
* Install prerequisites: AWS CLI, kubectl, Docker, Node.js, and MySQL client.
* Configure AWS CLI with IAM credentials.
* Set up project directory structure and Git repository.

### 2. Application Development
* **Frontend (React)**:
    * Create a React app using `create-react-app`.
    * Implement components for task creation, listing, and deletion.
    * Use Axios to make API calls to the backend.
    * Create a `Dockerfile` for containerization.
* **Backend (Node.js/Express)**:
    * Set up an Express server with MySQL connection.
    * Implement RESTful API endpoints for tasks.
    * Create a `Dockerfile` for containerization.
* **Database (MySQL)**:
    * Define a schema for the `tasks` table.
    * Create a Dockerized MySQL instance with initialization scripts.
    * Use Kubernetes `PersistentVolumeClaim` (PVC) for data persistence.

### 3. Dockerization
* Write Dockerfiles for frontend, backend, and MySQL.
* Test containers locally using Docker Compose to ensure connectivity.
* Push images to Amazon Elastic Container Registry (ECR).

### 4. AWS Infrastructure Setup
* **VPC**:
    * Create a VPC with public and private subnets across multiple Availability Zones (AZs).
    * Configure Internet Gateway, NAT Gateway, and Route Tables.
* **IAM**:
    * Create an IAM role for EKS with necessary permissions.
    * Create an IAM role for EC2 nodes (EKS node group) with policies for EKS, ECR, and ALB.
* **EKS**:
    * Create an EKS cluster using AWS CLI or AWS Management Console.
    * Set up an EKS managed node group with EC2 instances.
    * Configure `kubectl` to communicate with the EKS cluster.
* **ALB**:
    * Deploy AWS ALB Ingress Controller on EKS.
    * Configure Ingress resources to route traffic to frontend and backend services.

### 5. Kubernetes Deployment
* **Manifests**: Create Kubernetes manifests for:
    * MySQL Deployment and Service (with PVC for persistence).
    * Backend Deployment and Service.
    * Frontend Deployment and Service.
    * Ingress resource for ALB routing.
    * Horizontal Pod Autoscaler (HPA) for backend and frontend to scale based on CPU usage.
* **Secrets**: Store MySQL credentials in Kubernetes Secrets.
* **Apply Manifests**:
    * Deploy manifests to EKS using `kubectl`.
    * Verify pods, services, and Ingress are running.

### 6. Testing and Validation
* Access the application via the ALB DNS name.
* Test CRUD operations (create, view, delete tasks).
* Verify autoscaling by simulating load (e.g., using `ab` or `curl`).
* Check MySQL data persistence.

### 7. Cleanup (Optional)
* Provide commands to delete EKS cluster, ECR repositories, and other AWS resources to avoid costs.

## Directory Structure
```text
three-tier-app/
├── frontend/                   # React app
│   ├── src/                    # React source code
│   ├── Dockerfile              # Dockerfile for frontend
│   └── package.json
├── backend/                    # Node.js/Express app
│   ├── src/                    # Backend source code
│   ├── Dockerfile              # Dockerfile for backend
│   └── package.json
├── database/                   # MySQL setup
│   ├── init.sql                # SQL script to initialize database
│   └── Dockerfile              # Dockerfile for MySQL
├── kubernetes/                 # Kubernetes manifests
│   ├── mysql-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
├── docker-compose.yml          # Local testing with Docker Compose
└── README.md                   # Project documentation

```
## Artifacts to Be Generated
* **Code**:
    * React frontend (index.html, App.js, etc.).
    * Node.js backend (index.js, API routes).
    * MySQL initialization script (init.sql).
* **Dockerfiles** for frontend, backend, and MySQL.
* **Docker Compose file** for local testing.
* **Kubernetes Manifests**:
    * MySQL Deployment, Service, PVC, and Secret.
    * Backend Deployment and Service.
    * Frontend Deployment and Service.
    * Ingress for ALB.
    * HPA for autoscaling.
* **AWS CLI Scripts**:
    * Commands to create VPC, EKS cluster, node group, and ECR repositories.
    * IAM role and policy configurations.

## Prerequisites
* WSL2 with Ubuntu 20.04 or later.
* AWS CLI v2, `kubectl`, Docker, Node.js (v16+), `npm`, and MySQL client installed.
* AWS account with sufficient permissions to create VPC, EKS, EC2, ALB, and ECR resources.
* Git installed for version control.
