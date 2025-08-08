# Next Steps: Deploying to AWS EKS

This guide outlines the process of deploying the containerized three-tier application to a managed Kubernetes cluster on AWS (EKS).

---

### **Prerequisites**

1.  **AWS Account:** You need an AWS account with permissions to create the resources mentioned in the plan (VPC, IAM, EKS, EC2, ALB, ECR).
2.  **AWS CLI Configured:** Ensure your AWS CLI is installed and configured. You can test the configuration with:
    ```bash
    aws sts get-caller-identity
    ```
    This command should return your account details without any errors.
3.  **`eksctl` Installed:** `eksctl` is a command-line tool for creating and managing EKS clusters. It simplifies the process significantly. [Installation instructions](https://docs.aws.amazon.com/eks/latest/userguide/eksctl.html).
4.  **`kubectl` Installed:** The Kubernetes command-line tool. [Installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).

---

### **Step 1: Create ECR Repositories and Push Images**

First, we need a place to store our Docker images. We'll use Amazon Elastic Container Registry (ECR).

1.  **Create ECR Repositories:**
    Create two repositories, one for the frontend and one for the backend. Replace `us-east-1` with your preferred AWS region.
    ```bash
    aws ecr create-repository --repository-name three-tier-app/frontend --region us-east-1
    aws ecr create-repository --repository-name three-tier-app/backend --region us-east-1
    ```
    Note the `repositoryUri` from the output of each command. You will need it later.

2.  **Log in to ECR:**
    This command retrieves an authentication token and configures Docker to use it.
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
    ```
    Replace `<YOUR_AWS_ACCOUNT_ID>` and `us-east-1` accordingly.

3.  **Tag and Push the Docker Images:**
    Tag your locally built images with the ECR repository URI and push them.
    ```bash
    # Tag the backend image
    docker tag three-tier-app-backend:latest <YOUR_ECR_REPO_URI>/backend:latest

    # Push the backend image
    docker push <YOUR_ECR_REPO_URI>/backend:latest

    # Tag the frontend image
    docker tag three-tier-app-frontend:latest <YOUR_ECR_REPO_URI>/frontend:latest

    # Push the frontend image
    docker push <YOUR_ECR_REPO_URI>/frontend:latest
    ```
    Replace `<YOUR_ECR_REPO_URI>` with the URI you noted in step 1 (e.g., `<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/three-tier-app`).

---

### **Step 2: Create the EKS Cluster and Node Group**

We will use `eksctl` to create the entire EKS cluster, including the VPC, subnets, and IAM roles.

1.  **Create the Cluster:**
    This command creates a cluster named `three-tier-app-cluster` with a managed node group. It also attaches the necessary IAM policies for the AWS Load Balancer Controller to function.
    **Note:** This command can take 15-20 minutes to complete.
    ```bash
    eksctl create cluster \
    --name three-tier-app-cluster \
    --region us-east-1 \
    --version 1.28 \
    --nodegroup-name standard-workers \
    --node-type t3.medium \
    --nodes 2 \
    --nodes-min 1 \
    --nodes-max 3 \
    --with-oidc \
    --managed
    ```
    This command will also automatically configure `kubectl` to connect to your new cluster.

---

### **Step 3: Deploy the AWS Load Balancer Controller**

To expose our application to the internet via an Application Load Balancer (ALB), we need to install the AWS Load Balancer Controller in our cluster.

1.  **Create IAM Policy:**
    Download the IAM policy required by the controller.
    ```bash
    curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json
    ```
    Create the policy in AWS:
    ```bash
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json
    ```

2.  **Create IAM Service Account:**
    Use `eksctl` to create a Kubernetes service account and an IAM role for the controller. Replace `<YOUR_AWS_ACCOUNT_ID>` and `us-east-1`.
    ```bash
    eksctl create iamserviceaccount \
      --cluster=three-tier-app-cluster \
      --namespace=kube-system \
      --name=aws-load-balancer-controller \
      --role-name "AmazonEKSLoadBalancerControllerRole" \
      --attach-policy-arn=arn:aws:iam:::policy/AWSLoadBalancerControllerIAMPolicy \
      --approve \
      --region us-east-1
    ```

3.  **Install the Controller with Helm:**
    We'll use Helm to install the controller.
    ```bash
    # Add the EKS chart repository
    helm repo add eks https://aws.github.io/eks-charts

    # Install the controller
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
      -n kube-system \
      --set clusterName=three-tier-app-cluster \
      --set serviceAccount.create=false \
      --set serviceAccount.name=aws-load-balancer-controller
    ```

---

### **Step 4: Deploy the Application to EKS**

Now we deploy our application's components using the Kubernetes manifest files.

1.  **Update Manifests:**
    -   **Secrets:** In `kubernetes/mysql-secrets.yaml`, replace the placeholder values with your desired credentials, encoded in **Base64**.
        You can encode a string using this command: `echo -n 'your-password' | base64`
    -   **Image URIs:** In `kubernetes/backend-deployment.yaml` and `kubernetes/frontend-deployment.yaml`, replace `<your_ecr_repo_uri>` with your actual ECR repository URI.

2.  **Create a Persistent Volume Claim:**
    The `mysql-deployment.yaml` references a `PersistentVolumeClaim` named `mysql-pv-claim`. We need to create this object. Create a new file `kubernetes/mysql-pvc.yaml` with the following content:
    ```yaml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: mysql-pv-claim
    spec:
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 5Gi # You can adjust the size
    ```

3.  **Apply the Manifests:**
    Apply all the Kubernetes configuration files to the cluster.
    ```bash
    # First, create the secrets, configmap, and PVC
    kubectl apply -f kubernetes/mysql-secrets.yaml
    kubectl apply -f kubernetes/mysql-configmap.yaml
    kubectl apply -f kubernetes/mysql-pvc.yaml

    # Then, deploy the applications
    kubectl apply -f kubernetes/mysql-deployment.yaml
    kubectl apply -f kubernetes/backend-deployment.yaml
    kubectl apply -f kubernetes/frontend-deployment.yaml

    # Finally, create the ingress and autoscalers
    kubectl apply -f kubernetes/ingress.yaml
    kubectl apply -f kubernetes/hpa.yaml
    ```

---

### **Step 5: Test and Validate**

1.  **Check Pod Status:**
    Verify that all pods are running correctly.
    ```bash
    kubectl get pods -w
    ```
    Wait until all pods are in the `Running` state.

2.  **Get the ALB DNS Name:**
    Find the address of the Application Load Balancer created by the Ingress.
    ```bash
    kubectl get ingress app-ingress
    ```
    It might take a few minutes for the `ADDRESS` to be populated.

3.  **Access the Application:**
    Copy the DNS name from the `ADDRESS` column and paste it into your web browser. You should see your application. Test the create, view, and delete functionality.

---

### **Step 6: Cleanup (Optional)**

To avoid ongoing AWS charges, you should delete the resources you created.

1.  **Delete the EKS Cluster:**
    This command will delete the cluster and its associated node group and VPC.
    ```bash
    eksctl delete cluster --name three-tier-app-cluster --region us-east-1
    ```

2.  **Delete the ECR Repositories:**
    ```bash
    aws ecr delete-repository --repository-name three-tier-app/frontend --force --region us-east-1
    aws ecr delete-repository --repository-name three-tier-app/backend --force --region us-east-1
    ```

3.  **Delete the IAM Policy:**
    ```bash
    aws iam delete-policy --policy-arn arn:aws:iam:::policy/AWSLoadBalancerControllerIAMPolicy
    ```
```