# Production Notes

## Scalability

### Horizontal Scaling
- **Frontend**: Stateless, scale behind load balancer (HPA on CPU/memory)
- **Backend**: Stateless GraphQL, scale with HPA. Add Redis for pub/sub subscriptions
- **Video Processor**: Scale workers consuming from queue (Redis/RabbitMQ). Each worker processes one video at a time

### Vertical Scaling
- **Backend**: Increase CPU/memory for larger concurrent uploads
- **Processor**: More CPU for faster transcoding (ffmpeg uses all cores)

## Large Video Uploads

### Chunked/Multipart Upload
- **Current**: Single request, 100MB limit (NGINX proxy-body-size)
- **Production**: 
  - Frontend: Uppy.js or resumable.js for chunked upload
  - Backend: S3 multipart upload or tus.io protocol
  - Direct-to-S3: Presigned URLs, bypass backend for upload

### Storage
- **Current**: NFS (local)
- **Production**: 
  - Object storage (S3, GCS, MinIO) for durability + cost
  - CDN (CloudFront, Cloudflare) for delivery
  - Tiered storage: hot (recent) → cold (archive)

## Long-Running Video Processing

### Async Job Queue
- **Current**: Polling filesystem, sync in processor
- **Production**:
  - Queue: Redis (BullMQ) or RabbitMQ
  - Jobs: { videoId, inputPath, priority }
  - Workers: Consume jobs, report progress via WebSocket/GraphQL subscription
  - Retry: Exponential backoff, dead letter queue

### Progress Tracking
- **Current**: Status only (PENDING/PROCESSING/COMPLETED/FAILED)
- **Production**: 
  - Per-resolution progress
  - Estimated time remaining
  - Webhook/callback on completion

### Distributed Processing
- **Current**: Single ffmpeg process per video
- **Production**:
  - Split by segments (HLS/DASH) for parallel processing
  - GPU acceleration (NVIDIA NVENC, Intel QSV)
  - Spot instances for cost savings

## Retry & Failure Handling

### Backend
- **Upload**: Idempotent (UUID-based), retry on network error
- **GraphQL**: Client-side retry with exponential backoff
- **Database**: Transactions, optimistic locking

### Processor
- **Idempotency**: Check output exists before processing
- **Retries**: 3 attempts with backoff
- **DLQ**: Failed jobs → manual review queue
- **Alerts**: On-call for repeated failures

### Infrastructure
- **Pod disruption budgets**: minAvailable for HA
- **Node pools**: Separate for stateful (NFS) vs stateless
- **Multi-AZ**: Deploy across availability zones

## Storage Choice

| Option | Pros | Cons |
|--------|------|------|
| **Managed NFS (EFS/Filestore)** | POSIX, shared, managed | Cost, latency, throughput limits |
| **Object Storage (S3/GCS)** | Infinite scale, durable, cheap | Not POSIX, eventual consistency |
| **Block Storage (EBS/PD) + CSI** | High IOPS, low latency | Single-node attach (RWX needs cluster FS) |
| **Ceph/Longhorn/MinIO** | Self-hosted, S3-compatible | Operational complexity |

**Recommendation**: S3-compatible (MinIO for local, S3/GCS for cloud) + CDN. Use NFS only for temporary processing workspace.

## Security

### Network
- **Ingress**: TLS termination, WAF rules
- **Service mesh**: mTLS (Istio/Linkerd) for pod-to-pod
- **Network policies**: Deny by default, allow specific paths

### Application
- **Auth**: JWT/OIDC (Keycloak, Auth0, AWS Cognito)
- **Authorization**: Role-based (upload, view, admin)
- **Rate limiting**: Per-user, per-IP at ingress
- **Input validation**: File type, size, malware scan (ClamAV)
- **Secrets**: External secrets operator (Vault, AWS Secrets Manager)

### Data
- **Encryption at rest**: Storage class encryption
- **Encryption in transit**: TLS everywhere
- **PII**: No PII in video metadata, GDPR compliance

## Observability

### Metrics (Prometheus)
- **RED**: Rate, Errors, Duration for HTTP/GraphQL
- **USE**: Utilization, Saturation, Errors for resources
- **Custom**: Queue depth, processing time, video count

### Logging (Loki/Grafana)
- **Structured JSON**: Correlation IDs, trace IDs
- **Levels**: Error/Warn/Info/Debug
- **Retention**: 30d hot, 1y cold

### Tracing (OpenTelemetry/Jaeger)
- **End-to-end**: Upload → Process → Notify
- **Spans**: GraphQL resolvers, ffmpeg, DB, external APIs

### Alerting
- **Critical**: Pod crash loops, queue backlog > threshold
- **Warning**: High latency, error rate > 1%, disk > 80%
- **Info**: New deployment, scaling events

## Cost Optimization

### Compute
- **Spot/Preemptible**: For video processors (fault-tolerant)
- **Autoscaling**: Scale to zero when idle (KEDA)
- **Right-sizing**: VPA recommendations

### Storage
- **Lifecycle**: Move old videos to Glacier/Archive
- **Compression**: ffmpeg CRF 28-30 for archive
- **Deduplication**: Content-addressed storage

### Network
- **CDN**: Cache processed videos at edge
- **Regional**: Deploy near users

## CI/CD

### Pipeline
1. **Build**: Multi-arch Docker images (buildx)
2. **Test**: Unit, integration, contract (Pact)
3. **Scan**: Trivy (vulnerabilities), Syft (SBOM), Cosign (sign)
4. **Deploy**: ArgoCD/Flux (GitOps) to staging
5. **Promote**: Manual approval to production
6. **Rollback**: Automated on metric degradation

### Environments
- **Dev**: kind/local, ephemeral
- **Staging**: k3s/EKS dev, production-like
- **Production**: EKS/GKE/AKS, multi-AZ

### GitOps
- **Manifests**: Kustomize/Helm in Git
- **Secrets**: SealedSecrets or External Secrets
- **Policy**: Kyverno/OPA for admission control

## Cloud Deployment Differences

| Aspect | Local (kind) | Cloud (EKS/GKE/AKS) |
|--------|--------------|---------------------|
| **Ingress** | NGINX on NodePort | ALB/NLB, Cloud Load Balancer |
| **Storage** | NFS pod (emptyDir) | EFS/Filestore, CSI driver |
| **DNS** | /etc/hosts | Route53/Cloud DNS, ExternalDNS |
| **Certificates** | Self-signed | ACM/Let's Encrypt (cert-manager) |
| **Secrets** | Plaintext | SealedSecrets, Vault, KMS |
| **Monitoring** | None built-in | CloudWatch, Cloud Monitoring |
| **Cost** | Free (local resources) | Pay-per-use, optimize |

## Migration Checklist

- [ ] Replace NFS with managed file/block storage
- [ ] Add PostgreSQL for metadata
- [ ] Add Redis for pub/sub + queue
- [ ] Implement chunked upload (tus/S3)
- [ ] Add authentication/authorization
- [ ] Configure TLS certificates
- [ ] Set up observability stack
- [ ] Define resource quotas/limits
- [ ] Configure network policies
- [ ] Set up CI/CD pipeline
- [ ] Document runbooks
- [ ] Load test
- [ ] Chaos engineering (Litmus/Gremlin)