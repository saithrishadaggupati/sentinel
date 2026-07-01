# Kubernetes Deployment

Local Kubernetes manifests for running Sentinel via `kind` (Kubernetes in Docker), complementing the Docker Compose setup used for local development.

## Why both docker-compose and k8s?

- \docker-compose.yml\ — quick local dev, single command, hot-reload friendly.
- \k8s/\ — demonstrates production-style orchestration: self-healing, declarative config, secret/config separation, resource limits.

## Architecture

- \sentinel-mysql\ — Deployment + PVC (1Gi) for persistent storage, Service on port 3306.
- \sentinel-redis\ — Deployment, Service on port 6379 (no persistence needed for cache).
- \sentinel-backend\ — Deployment (readiness/liveness probes), Service (NodePort 30000), configured via ConfigMap + Secret.

## Secrets

Real secrets are never committed. \secret.example.yaml\ documents the required keys with placeholders; the actual \secret.yaml\ (gitignored) is created locally with real values before deploying.

## Resource requests/limits

Each container specifies requests (guaranteed minimum) and limits (hard cap) for CPU/memory, following Kubernetes best practice for predictable scheduling and avoiding noisy-neighbor issues.

## Deploying locally

\\\ash
# 1. Create a local cluster
kind create cluster --name sentinel-local

# 2. Build and load the backend image (kind doesn't share Docker's image cache)
docker build -t sentinel-backend:latest .
kind load docker-image sentinel-backend:latest --name sentinel-local

# 3. Create your real secret.yaml locally (see secret.example.yaml for the template)

# 4. Apply everything
kubectl apply -f k8s/

# 5. Run database migrations
kubectl exec -it deployment/sentinel-backend -- npx prisma migrate deploy

# 6. Access the app
kubectl port-forward svc/sentinel-backend 3000:3000
\\\

## Verified resilience

Deleting a pod (\kubectl delete pod -l app=sentinel-backend\) triggers automatic recreation by the Deployment controller within seconds — no manual intervention needed. This is the core value Kubernetes adds over plain Docker Compose.
