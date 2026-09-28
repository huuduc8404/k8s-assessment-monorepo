# AI Usage Log

This log reflects the state of the repository at the current commit. Where an earlier version of this
document described work that is not present in the tree (kind clusters, an ffmpeg processor service,
shell deploy scripts, NGINX ingress), the entry has been corrected or marked as out of scope.

## Tools Used

- **Kilo Code** — primary development assistant (planning, manifests, application code, docs)
- **Kilo Local Recall** — retrieving prior session context while iterating on the manifests

## Usage Summary

### Code Generation

| Component                                        | AI Generated | Human Reviewed |
| ------------------------------------------------ | ------------ | -------------- |
| React + Apollo frontend (CRA, TypeScript)        | 100%         | Yes            |
| NestJS + Apollo GraphQL backend (TypeScript)     | 100%         | Yes            |
| Kustomize base/dev manifests (`k8s/`)            | 70%         | Yes            |
| Argo CD Applications + ImageUpdater policy       | 70%         | Yes            |
| Dockerfiles (backend, frontend)                  | 100%         | Yes            |
| Documentation (README, architecture, assessment) | ~90%         | Yes            |

### Prompts Used (Key Examples)

1. "Create a React frontend with Apollo Client for GraphQL video upload"
2. "Build a NestJS GraphQL backend with file upload and video metadata"
3. "Create Kubernetes manifests with NFS storage for shared uploads"
4. "Register the frontend, backend, Jenkins, Docker Registry, NFS server, and NFS provisioner as Argo CD Applications with auto-sync"
5. "Configure argocd-image-updater to poll the in-cluster registry and write back digests to Git"
6. "Write Jenkins pipelines that build the images and push `:${BUILD_NUMBER}` plus `:latest` to localhost:31000"
7. "Document setup, verification, and teardown steps for a reviewer starting from a clean machine"
