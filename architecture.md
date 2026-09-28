# Architecture Documentation

## Overview

This document describes the architecture of the Video Upload Platform deployed on local Kubernetes.

## Components

### 1. Frontend (React + Apollo Client)
- **Technology**: React 18, Apollo Client 3, TypeScript
- **Responsibilities**: Video file selection, upload via GraphQL mutation, video listing, status display, thumbnail/video version links
- **Communication**: GraphQL over HTTP/WebSocket to backend
- **Replicas**: 2 for HA
- **Health**: HTTP GET /

### 2. Backend (NestJS + GraphQL)
- **Technology**: NestJS 10, Apollo Server 4, GraphQL 16, TypeScript
- **Responsibilities**: 
  - GraphQL API (upload, list, status, health)
  - File upload handling (multer + graphql-upload-minimal)
  - Video metadata management (in-memory Map, backed by NFS)
  - Triggering video processing
- **Storage**: Shared NFS at `/uploads`
- **Replicas**: 2 for HA
- **Health**: GraphQL health query + HTTP /health endpoint

### 3. Video Processor (Node.js + ffmpeg)
- **Technology**: Node.js, fluent-ffmpeg
- **Responsibilities**: 
  - Poll NFS for new MP4 files
  - Transcode to 2K, 1080p, 720p, 480p (H.264/AAC)
  - Generate thumbnail (10% timestamp, 320x180)
  - Update video metadata via backend (simulated)
- **Replicas**: 1 (stateless worker)
- **Scaling**: Can scale horizontally with work queue (Redis/RabbitMQ) in production

### 4. NFS Storage
- **Implementation**: itsthenetwork/nfs-server-alpine in Kubernetes
- **Path**: `/exports` mounted as `/uploads` in all pods
- **PV/PVC**: 10Gi ReadWriteMany
- **Persistence**: emptyDir in dev (data lost on pod restart), would use real NFS/CSI in production

### 5. Ingress (NGINX)
- **Routes**: 
  - `/` → Frontend
  - `/graphql` → Backend GraphQL
  - `/uploads/*` → Backend static file serving
  - `/health` → Backend health
- **Config**: Large body size for video uploads (100MB)

## Data Flow

1. User selects MP4 file in frontend
2. Frontend uploads via GraphQL `uploadVideo` mutation (multipart)
3. Backend saves file to NFS `/uploads/{uuid}.mp4`
4. Backend creates Video record (status: PENDING)
5. Video Processor polls NFS, detects new file
6. Processor transcodes with ffmpeg, generates versions + thumbnail
7. Processor updates Video status to COMPLETED with version URLs
8. Frontend polls/refetches, displays results

## Failure Handling

- **Backend pod death**: NFS persists files, new pod serves existing videos
- **Frontend pod death**: Stateless, new pod serves same UI
- **Processor pod death**: Unfinished work retried on restart (idempotent)
- **NFS pod death**: Single point of failure in dev; production uses managed NFS/CSI
- **Rolling updates**: maxSurge=1, maxUnavailable=0 for zero-downtime

## Trade-offs & Limitations

| Aspect | Current | Production |
|--------|---------|------------|
| NFS | Single pod, emptyDir | Managed NFS (EFS, Filestore) or CSI driver |
| Video metadata | In-memory Map | PostgreSQL + Prisma/TypeORM |
| Processing queue | Polling filesystem | Redis/RabbitMQ + worker pool |
| Auth | None | JWT/OIDC, rate limiting |
| Observability | Basic health | Prometheus, Grafana, Loki, OpenTelemetry |
| Large files | 100MB limit | Chunked upload, S3 multipart |
| Long videos | Sync processing | Async job queue, progress tracking |

## Kubernetes Resources

- **Deployments**: frontend (2), backend (2), video-processor (1), nfs-server (1)
- **Services**: ClusterIP for each
- **Ingress**: Single entry point
- **PV/PVC**: Shared NFS storage
- **Probes**: Liveness/readiness on all app pods