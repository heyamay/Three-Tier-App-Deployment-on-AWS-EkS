# Three-Tier App Deployment on AWS EKS

This project demonstrates how to build and deploy a three-tier web application on AWS EKS. The application consists of a React frontend, a Node.js backend, and a MySQL database.

## Prerequisites

- WSL2 with Ubuntu 20.04 or later
- AWS CLI v2
- kubectl
- Docker
- Node.js (v16+)
- npm
- MySQL client
- AWS account with sufficient permissions
- Git

## Local Development

1. Clone the repository:
   ```
   git clone https://github.com/heyamay/Three-Tier-App-Deployment-on-AWS-EkS.git
   cd Three-Tier-App-Deployment-on-AWS-EkS
   ```

2. Run the application using Docker Compose:
   ```
   docker-compose up --build
   ```

   The application will be available at `http://localhost:3000`.

## AWS Deployment

1. **Create ECR Repositories:**
   - Create two ECR repositories, one for the frontend and one for the backend.

2. **Build and Push Docker Images:**
   - Build the Docker images for the frontend and backend.
   - Push the images to your ECR repositories.

3. **Create AWS Infrastructure:**
   - Create a VPC, IAM roles, and an EKS cluster.

4. **Deploy to EKS:**
   - Update the Kubernetes manifests with your ECR repository URIs and secret values.
   - Apply the manifests to your EKS cluster:
     ```
     kubectl apply -f kubernetes/
     ```

5. **Access the Application:**
   - Find the DNS name of the ALB created by the Ingress.
   - Access the application in your browser using the ALB DNS name.
