# Kubernetes on AWS Demo

This demo covers the following AWS products/services:

- [Amazon EKS](https://aws.amazon.com/eks/) (on [AWS Fargate](https://aws.amazon.com/fargate/))
- [Amazon ECR](https://aws.amazon.com/ecr/)
- [AWS App Mesh](https://aws.amazon.com/app-mesh/)
- [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/)

## Prerequisites

Ensure you have the following installed:
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [eksctl](https://eksctl.io/introduction/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [Docker](https://www.docker.com/)
- [Helm](https://helm.sh/docs/intro/install/)
- [jq](https://stedolan.github.io/jq/download/) (optional: this is only needed to parse the JSON output for one command)

Having the [ECR Credential Helper](https://github.com/awslabs/amazon-ecr-credential-helper) installed is also recommended for ease of pulling/pushing images to ECR.

## 1. Provision cluster

1. Export environment variables

```
export CLUSTER=ab3
export NAMESPACE=ab3test
export AWS_ACCOUNT_ID=238435206887
export AWS_REGION=ap-southeast-1
```

2. Create EKS cluster

```
cd demo/infra

# Update {{CLUSTER}} in the file before running the next command
eksctl create cluster -f kubernetes/cluster.yaml
```

3. Set namespace for current context

```
kubectl config set-context --current --namespace=$NAMESPACE
```

4. Add EKS Helm charts

```
helm repo add eks https://aws.github.io/eks-charts
```

## 2. Setup AWS Load Balancer Controller

1. Create IAM policy
```
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam-policies/aws-load-balancer-controller-policy.json
```

2. Add CRDs
```
kubectl apply -k "https://github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
```

3. Setup OIDC
```
eksctl utils associate-iam-oidc-provider \
  --cluster $CLUSTER \
  --approve
```

4. Setup IAM role and Kubernetes service account
```
eksctl create iamserviceaccount \
  --cluster=$CLUSTER \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve
```

5. Install Helm chart
```
helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller \
  --set clusterName=$CLUSTER \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$AWS_REGION \
  --set vpcId=$(aws eks describe-cluster --name $CLUSTER --query "cluster.resourcesVpcConfig.vpcId" --output text) \
  -n kube-system
```

6. Check installation
```
kubectl get deployment -n kube-system aws-load-balancer-controller
```

## 3. Setup CloudWatch logging

1. Setup IAM policy for CloudWatch logging
```
aws iam create-policy \
        --policy-name FluentBitEKSFargate \
        --policy-document file://kubernetes/cloudwatch-iam-policy.json 
```

2. Attach IAM policy to IAM role for Fargate
```
aws iam attach-role-policy \
        --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/FluentBitEKSFargate \
        --role-name $(cut -d "/" -f2 <<< $(sed 's/"//g' <<< $(eksctl get fargateprofile --cluster $CLUSTER -o json | jq ".[0].podExecutionRoleARN")))
```

3. Setup IAM role for CloudWatch logging and App Mesh
```
eksctl create iamserviceaccount \
--name general-service-account \
--namespace=$NAMESPACE \
--cluster $CLUSTER \
--attach-policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy,arn:aws:iam::aws:policy/AWSAppMeshFullAccess,arn:aws:iam::$AWS_ACCOUNT_ID:policy/FluentBitEKSFargate  \
--approve
```

## 4. Setup App Mesh

1. Setup namespaces
```
kubectl apply -f kubernetes/namespaces.yaml
```

2. Add CRDs
```
kubectl apply -k "https://github.com/aws/eks-charts/stable/appmesh-controller/crds?ref=master"
```

3. Setup IAM role and Kubernetes service account
```
eksctl create iamserviceaccount \
    --cluster $CLUSTER \
    --namespace appmesh-system \
    --name appmesh-controller \
    --attach-policy-arn arn:aws:iam::aws:policy/AWSCloudMapFullAccess,arn:aws:iam::aws:policy/AWSAppMeshFullAccess \
    --override-existing-serviceaccounts \
    --approve
```

4. Install Helm chart
```
helm upgrade -i appmesh-controller eks/appmesh-controller \
    --namespace appmesh-system \
    --set region=$AWS_REGION \
    --set serviceAccount.create=false \
    --set serviceAccount.name=appmesh-controller
    --set tracing.enabled=true \
    --set tracing.provider=x-ray
```

5. Check installation
```
kubectl get deployments appmesh-controller -n appmesh-system
```

## 5. Setup Prometheus and Grafana

```
# Skippable; kind of useless at the moment
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/master/k8s-deployment-manifest-templates/deployment-mode/service/cwagent-prometheus/prometheus-eks.yaml

kubectl apply -f monitoring.yaml

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm repo add stable https://charts.helm.sh/stable

helm repo update

helm install prometheus prometheus-community/prometheus \
  --namespace prometheus \
  --set alertmanager.persistentVolume.storageClass="gp2" \
  --set server.persistentVolume.storageClass="gp2"

helm install grafana grafana/grafana \
    --namespace grafana \
    --set persistence.storageClassName="gp2" \
    --set persistence.enabled=true \
    --set adminPassword='username' \
    --values kubernetes/grafana-values.yaml \
    --set service.type=LoadBalancer
```

## 6. Deploy application

1. Deploy app
```
kubectl apply -f app.yaml
```

2. Deploy ingress
```
kubectl apply -f s1-ingress.yaml
```

3. Deploy canary release
```
kubectl apply -f s2-canary.yaml
```

## Useful snippets for debugging


Run a pod with curl available
```
kubectl run -i --tty curl --image=curlimages/curl --restart=Never -- sh

kubectl exec --stdin --tty curl -- sh
```

Get events sorted by timestamp
```
kubectl get events --sort-by='.lastTimestamp'
```