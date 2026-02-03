# Advent of Kube — Challenge Plan

## Philosophy
- Beginner-friendly early days, progressively harder
- Covers both core Kubernetes and real-world DevOps tooling
- Useful for learners AND challenging for industry engineers

---

## Difficulty Progression

### Beginner (Days 0-5) — "I'm learning Kubernetes"
| Day | Title | Topic | Concept | Status |
|-----|-------|-------|---------|--------|
| 0 | Setup | Environment | Environment verification | Done |
| 1 | Broken Pod | Pods, Images | Image pull error (typo in image name) | Done |
| 2 | CrashLoop Detective | ConfigMaps | ConfigMap reference mismatch | Done |
| 3 | Label Mismatch | Labels, Selectors | Service can't find pods (selector mismatch) | Done |
| 4 | Secret Rotation | Secrets | App needs a Secret that's missing/wrong key | Done |
| 5 | Resource Squeeze | Resources | Pod pending due to resource requests vs limits | Planned |

### Intermediate (Days 6-12) — "I work with Kubernetes"
| Day | Title | Topic | Concept | Status |
|-----|-------|-------|---------|--------|
| 6 | Broken Deployment | Deployments | Multiple bugs (image tag, env, port) | Chart ready |
| 7 | Service Wiring | Services | Ports, targetPort, DNS resolution | Planned |
| 8 | Probe Pitfall | Probes | Liveness/readiness probes misconfigured | Planned |
| 9 | RBAC Lockdown | RBAC | ServiceAccount can't read Secret | Planned |
| 10 | NetworkPolicy Firewall | NetworkPolicies | Pod blocked by NetworkPolicy | Planned |
| 11 | PV/PVC Binding | Storage | PVC stuck pending, storage class issues | Planned |
| 12 | Rolling Update Stuck | Rollouts | Deployment rollout blocked | Planned |

### Advanced (Days 13-19) — "I run production clusters"
| Day | Title | Topic | Concept | Status |
|-----|-------|-------|---------|--------|
| 13 | Metrics Missing | Prometheus | ServiceMonitor not scraping | Planned |
| 14 | Dashboard Down | Grafana | Datasource misconfigured | Planned |
| 15 | Logs Lost | Loki | Promtail not collecting logs | Planned |
| 16 | Ingress + TLS | Ingress, cert-manager | Certificate not issuing | Planned |
| 17 | HPA Not Scaling | Autoscaling | metrics-server or HPA config broken | Planned |
| 18 | Node Affinity | Scheduling | Pod can't schedule due to affinity rules | Planned |
| 19 | Taint Toleration | Scheduling | Pod rejected by tainted node | Planned |

### Expert (Days 20-25) — "I'm an SRE/Platform Engineer"
| Day | Title | Topic | Concept | Status |
|-----|-------|-------|---------|--------|
| 20 | GitOps Drift | ArgoCD | App stuck OutOfSync | Planned |
| 21 | Policy Blocked | Kyverno/OPA | Policy rejecting deployment | Planned |
| 22 | Init Container Chain | Init Containers | Init containers failing in sequence | Planned |
| 23 | Ephemeral Debug | Debugging | Extract flag from distroless container | Planned |
| 24 | Webhook Woes | Admission Webhooks | ValidatingWebhook rejecting resources | Planned |
| 25 | Grand Finale | Everything | Production incident: multi-namespace chaos | Planned |

---

## Tool Requirements by Day

| Days | Tools Required |
|------|----------------|
| 0-12 | kind, kubectl, helm only |
| 13-15 | + Prometheus, Grafana, Loki (kube-prometheus-stack) |
| 16-17 | + cert-manager, metrics-server |
| 20 | + ArgoCD |
| 21 | + Kyverno or OPA Gatekeeper |

---

## Cluster Setup Strategy

For tool-heavy days, provide pre-configured kind configs or setup scripts:
- `kind-basic.yaml` — Days 0-12
- `kind-observability.yaml` — Days 13-15 (includes prom/grafana/loki)
- `kind-platform.yaml` — Days 16+ (includes cert-manager, ArgoCD, etc.)

---

## Next Up: Day 5 — Resource Squeeze

**Concept**: A Pod is stuck Pending because its resource requests exceed available cluster resources or namespace quota.

**Setup**:
- ResourceQuota limits the namespace to small amounts (e.g., 500m CPU, 256Mi memory)
- Pod requests more than quota allows
- User must reduce resource requests to fit within quota

**Flag**: Baked into the app image, printed to logs once the pod runs.
