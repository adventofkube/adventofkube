# Advent of Kube — Challenge Plan

## Philosophy
- Beginner-friendly early days, progressively harder
- Covers both core Kubernetes and real-world DevOps tooling
- Useful for learners AND challenging for industry engineers

---

## Difficulty Progression

### Beginner (Days 0-5) — "I'm learning Kubernetes"
| Day | Title | Concept | Status |
|-----|-------|---------|--------|
| 0 | Setup | Environment verification | Done |
| 1 | Broken Pod | Image pull error (typo in image name) | Done |
| 2 | CrashLoop Detective | ConfigMap reference mismatch | Done |
| 3 | Label Mismatch | Service can't find pods (selector mismatch) | TODO |
| 4 | Secret Rotation | App needs a Secret that's missing/wrong key | Planned |
| 5 | Resource Squeeze | Pod pending due to resource requests vs limits | Planned |

### Intermediate (Days 6-12) — "I work with Kubernetes"
| Day | Title | Concept | Status |
|-----|-------|---------|--------|
| 6 | Broken Deployment | Multiple bugs (image tag, env, port) | Chart ready |
| 7 | Service Wiring | Ports, targetPort, DNS resolution | Planned |
| 8 | Probe Pitfall | Liveness/readiness probes misconfigured | Planned |
| 9 | RBAC Lockdown | ServiceAccount can't read Secret | Planned |
| 10 | NetworkPolicy Firewall | Pod blocked by NetworkPolicy | Planned |
| 11 | PV/PVC Binding | PVC stuck pending, storage class issues | Planned |
| 12 | Rolling Update Stuck | Deployment rollout blocked | Planned |

### Advanced (Days 13-19) — "I run production clusters"
| Day | Title | Concept | Status |
|-----|-------|---------|--------|
| 13 | Metrics Missing | Prometheus ServiceMonitor not scraping | Planned |
| 14 | Dashboard Down | Grafana datasource misconfigured | Planned |
| 15 | Logs Lost | Loki/Promtail not collecting logs | Planned |
| 16 | Ingress + TLS | cert-manager Certificate not issuing | Planned |
| 17 | HPA Not Scaling | metrics-server or HPA config broken | Planned |
| 18 | Node Affinity | Pod can't schedule due to affinity rules | Planned |
| 19 | Taint Toleration | Pod rejected by tainted node | Planned |

### Expert (Days 20-25) — "I'm an SRE/Platform Engineer"
| Day | Title | Concept | Status |
|-----|-------|---------|--------|
| 20 | GitOps Drift | ArgoCD app stuck OutOfSync | Planned |
| 21 | Policy Blocked | OPA/Kyverno rejecting deployment | Planned |
| 22 | Init Container Chain | Init containers failing in sequence | Planned |
| 23 | Ephemeral Debug | Extract flag from distroless container | Planned |
| 24 | Webhook Woes | ValidatingWebhook rejecting resources | Planned |
| 25 | Grand Finale | Production incident: multi-namespace chaos | Planned |

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

## Next Up: Day 3 — Label Mismatch

**Concept**: A Service exists but has no endpoints because its selector doesn't match the Pod labels.

**Setup**:
- Deployment creates pods with label `app: myapp`
- Service selector is `app: my-app` (typo: hyphen)
- User must fix the selector OR the pod labels

**Flag**: Baked into the app image, served via HTTP once Service routes correctly.
