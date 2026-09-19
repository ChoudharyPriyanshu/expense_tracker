1. What needs deployment
Frontend → S3 + CloudFront
Backend → ECS Fargate
Database → MongoDB Atlas
Backend is stateless → multiple tasks can run
/api/health → ALB health check
MONGO_URI → required at startup
/api → avoids production CORS issues



2. Deployment strategies
EC2 → cheap, simple, manual maintenance
PaaS → less infrastructure work
Serverless → cheap for low traffic, cold-start issues
Containers → S3 + CloudFront + ECS + ALB + Atlas
Kubernetes → powerful but overkill
Recommended: Containers → HA + zero-downtime + rollback + scalable




3. AWS Architecture
Route 53 → DNS
ACM → SSL/TLS
CloudFront → CDN + routing
S3 → frontend hosting
WAF → security + rate limiting
ALB → load balancing
ECS Fargate → backend
ECR → Docker images
Secrets Manager → secrets
VPC → networking
IAM → permissions
CloudWatch → monitoring
GitHub Actions + CodeDeploy → CI/CD
MongoDB Atlas → database
Terraform/CDK → Infrastructure as Code
4. CloudFront Flow
User
 ↓
CloudFront
 ├── /* → S3 → Frontend
 └── /api/* → ALB → ECS Fargate → MongoDB Atlas
Frontend uses VITE_API_URL=/api
Same build works across environments
No production CORS issue
Single HTTPS endpoint
WAF protects API
5. CI/CD
Git Push
 ↓
GitHub Actions
 ↓
AWS OIDC
 ├── Frontend → Build → S3 → CloudFront
 └── Backend → Docker → ECR → ECS
                         ↓
                    Blue/Green
                         ↓
                  Health Checks
                         ↓
                 Deploy / Rollback
Use OIDC instead of AWS access keys
Docker image tagged with Git SHA
Blue/green deployment
Automatic rollback on failure
6. Scaling
ECS auto-scaling → 2–10 tasks
CloudFront → handles frontend traffic
MongoDB → scale vertically/read replicas
Use keyset pagination for large datasets
2 Availability Zones → high availability
ALB → removes unhealthy tasks
7. Security
ECS tasks → private subnets
No public IPs
S3 → private
Secrets → Secrets Manager
WAF → OWASP + rate limiting
HTTPS + HSTS
DB → no 0.0.0.0/0
ECR → image scanning
8. Cost
ALB → ~$18
Fargate → ~$15
NAT Gateway → ~$33
S3 + CloudFront → ~$2–5
Other AWS services → ~$3–6
Atlas M10 → ~$57
Total → ~$130/month
9. Deployment Order
Terraform network + ECR + Secrets
Create Dockerfile
Deploy ECS + ALB
Configure S3 + CloudFront
Add Route 53 + ACM + WAF
Configure GitHub Actions + OIDC
Enable blue/green deployment
Test automatic rollback