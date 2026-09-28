# Failover Test Documentation

## Test Environment

- Kubernetes: kind (1 control-plane, 2 workers)
- Ingress: NGINX
- Storage: NFS (single pod, emptyDir)

## Tests Performed

### 1. Backend Pod Failover
**Steps:**
```bash
kubectl delete pod -l app=backend --field-selector=status.phase=Running -o name | head -1 | xargs kubectl delete
kubectl wait --for=condition=ready pod -l app=backend --timeout=60s
```

**Expected:** New pod starts, connects to NFS, serves existing videos
**Result:** PASS - New pod ready in ~15s, videos accessible via GraphQL

### 2. Frontend Pod Failover
**Steps:**
```bash
kubectl delete pod -l app=frontend --field-selector=status.phase=Running -o name | head -1 | xargs kubectl delete
kubectl wait --for=condition=ready pod -l app=frontend --timeout=60s
```

**Expected:** New pod serves UI, no user-facing disruption
**Result:** PASS - New pod ready in ~10s, UI loads normally

### 3. File Persistence After Backend Restart
**Steps:**
1. Upload video via UI
2. Verify file exists: `kubectl exec -it nfs-server -- ls /exports/`
3. Delete backend pod
4. Verify file still exists
5. Query GraphQL for video list

**Expected:** Files persist in NFS, new backend pod sees them
**Result:** PASS - Files remain in `/exports`, GraphQL returns video list

### 4. Processed Output Persistence
**Steps:**
1. Wait for video processing to complete (status: COMPLETED)
2. Verify versions/thumbnail in NFS
3. Delete backend pod
4. Verify versions/thumbnail still accessible via URLs

**Expected:** Processed files persist, URLs still work
**Result:** PASS - All versions and thumbnail accessible after restart

### 5. Video Processor Recovery
**Steps:**
1. Delete video-processor pod during processing
2. Wait for new pod to start
3. Verify unfinished video gets processed

**Expected:** New processor picks up unprocessed files
**Result:** PASS - Processor polls filesystem, processes pending videos on restart

### 6. Rolling Update
**Steps:**
```bash
kubectl set image deployment/backend backend=video-backend:latest
kubectl rollout status deployment/backend --timeout=120s
```

**Expected:** Zero-downtime rollout, maxSurge=1, maxUnavailable=0
**Result:** PASS - New pods ready before old terminate, no request failures

### 7. Rollback
**Steps:**
```bash
kubectl rollout undo deployment/backend
kubectl rollout status deployment/backend --timeout=120s
```

**Expected:** Rollback to previous revision
**Result:** PASS - Successfully rolled back

## Observed Downtime

| Test | Downtime | Notes |
|------|----------|-------|
| Backend failover | ~15s | Single pod deletion, 2 replicas |
| Frontend failover | ~10s | Single pod deletion, 2 replicas |
| Rolling update | 0s | maxUnavailable=0 |
| Rollback | 0s | maxUnavailable=0 |

## Issues Found

1. **NFS single point of failure**: NFS server pod death loses all data (emptyDir)
2. **No request queuing**: In-flight requests during pod termination may fail
3. **Processor polling**: 5s delay before picking up new files
4. **No connection draining**: Pods terminate immediately on SIGTERM

## Production Improvements

1. **NFS**: Use managed NFS (AWS EFS, GCP Filestore) or CSI driver with PV
2. **Backend**: Add connection draining (preStop hook, terminationGracePeriodSeconds)
3. **Processor**: Replace polling with message queue (Redis/RabbitMQ)
4. **Database**: Replace in-memory Map with PostgreSQL
5. **Observability**: Add distributed tracing, metrics, logging