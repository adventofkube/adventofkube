# Remaining Days Design — Days 7-25

**Date:** 2026-02-21
**Status:** Approved
**Scope:** Design all 19 remaining challenge days + migrate existing days to new flag pattern

---

## Architecture Changes

### Flag Injection Pattern

All Go images switch from hardcoded flags to build-time injection:

```
images/dayNN/
├── main.go       # committed — app behavior, NO flag value
├── flag.go       # gitignored — `package main; const flag = "AOK{...}"`
└── Dockerfile    # committed — copies all .go files, builds binary
```

- **`.gitignore`**: add `images/*/flag.go`
- **GitHub Actions secret** `FLAG_VALUES`: JSON blob of all flags
- **CI gen script**: reads `FLAG_VALUES`, writes `flag.go` per day before `docker build`
- **Migrate days 1-6** to this pattern (remove hardcoded flags from committed main.go)

### Config Updates

- `js/config.js`: rewrite days 7-25 to match README roadmap topics; add setup, hints, docs, real flag hashes
- `functions/submit-flag.js`: add flag hashes for days 7-25
- Every day with a custom image includes a link to the image source in setup instructions

### Source of Truth

README roadmap defines the topic ordering. config.js is updated to match.

---

## Flag Registry

All flags follow format `AOK{...}`.

| Day | Flag | SHA-256 Hash |
|-----|------|-------------|
| 0 | `AOK{setup_complete}` | `1c015e563e5e30188378f8516b89cfa5c6c14ba00f9efd5a878a570e383e2e03` |
| 1 | `AOK{first_p0d_fixed}` | `d88ee18014da63147665ad1455bada2141eb3ba3bbb11051053a74ab2e3aa5c7` |
| 2 | `AOK{c0nfigmap_c0nnected}` | `5b43f80414de6df30a6ae54f681052e5c5e35cb9cfa57cc24f169422fb315003` |
| 3 | `AOK{l4bels_and_s3lectors}` | `bc64f86e6a230e279ff0a5e095a48e52d1e234525b748e64f27c1680913cdf12` |
| 4 | `AOK{s3crets_unl0cked}` | `f42b4a89a4b7f81ddd3d30e30746e6d6fca8a5819c7dd3c4309a0c4adf0b310d` |
| 5 | `AOK{qu0ta_cr1sis_av3rted}` | `db755eb20ac5651ce8080506b9dab20b81b1af45a52112e67cd13a2c755b0a87` |
| 6 | `AOK{d3ploy_and_d3bug}` | `3d9822e477d0414cc8c153847fbb667394143b9301c816e2b9eb0efb8bb737e4` |
| 7 | `AOK{s3rvice_w1red_up}` | TBD |
| 8 | `AOK{pr0bes_p4ssing}` | TBD |
| 9 | `AOK{rb4c_unl0cked}` | TBD |
| 10 | `AOK{f1rewall_br3ached}` | TBD |
| 11 | `AOK{st0rage_b0und}` | TBD |
| 12 | `AOK{r0lled_0ut}` | TBD |
| 13 | `AOK{m3trics_sc4aped}` | TBD |
| 14 | `AOK{d4shboard_l1ve}` | TBD |
| 15 | `AOK{l0gs_f0und}` | TBD |
| 16 | `AOK{tls_t3rminated}` | TBD |
| 17 | `AOK{sc4led_up}` | TBD |
| 18 | `AOK{n0de_aff1nity}` | TBD |
| 19 | `AOK{t0lerat3d}` | TBD |
| 20 | `AOK{g1tops_synced}` | TBD |
| 21 | `AOK{p0licy_p4ssed}` | TBD |
| 22 | `AOK{1nit_cha1ned}` | TBD |
| 23 | `AOK{eph3meral_h4ck}` | TBD |
| 24 | `AOK{w3bhook_app4oved}` | TBD |
| 25 | `AOK{adv3nt_compl3te}` | TBD |

SHA-256 hashes to be computed during implementation and inserted into config.js + submit-flag.js.

---

## Tier 1: Intermediate (Days 7-12)

Tools required: kind, kubectl, helm

### Day 7 — Service Wiring (Services)

- **Title**: Service Wiring
- **Description**: A Service exists but can't route traffic to its backend pod. The pod is running fine. Debug the Service configuration.
- **Bug**: Service has `targetPort: https` (named port reference) but the Pod's container declares the port with name `web`. Service can't resolve the named port → no endpoints.
- **Flag**: `AOK{s3rvice_w1red_up}`
- **App type**: HTTP server on :8080, returns flag at `/`
- **Image**: `ghcr.io/adventofkube/day07`
- **Resources**: Namespace, Deployment, Service
- **Fix**: Change Service `targetPort` to match pod's port name (`web`) or use numeric `8080`
- **Time target**: ~15 min

### Day 8 — Probe Pitfall (Probes)

- **Title**: Probe Pitfall
- **Description**: A pod keeps restarting. The application seems fine but Kubernetes keeps killing it. Investigate the health checks.
- **Bug**: Liveness probe path is `/healthz` but app serves health at `/health`. Readiness probe has `initialDelaySeconds: 0`, `periodSeconds: 1`, `failureThreshold: 1` — too aggressive for an app with 3s startup.
- **Flag**: `AOK{pr0bes_p4ssing}`
- **App type**: HTTP server on :8080, 3s startup delay, health at `/health`, flag at `/`
- **Image**: `ghcr.io/adventofkube/day08`
- **Resources**: Namespace, Deployment, Service
- **Source link**: Users check Go source to discover correct health endpoint path
- **Fix**: Correct liveness path to `/health`, increase readiness `initialDelaySeconds` or `failureThreshold`
- **Time target**: ~15 min

### Day 9 — RBAC Lockdown (RBAC)

- **Title**: RBAC Lockdown
- **Description**: A pod's ServiceAccount can't access the Secret containing the flag. The Role and RoleBinding exist but something is wrong with the permissions.
- **Bug**: Role allows `get` on `secrets` but not `list`. The app calls the K8s API to list secrets, then reads the flag secret.
- **Flag**: `AOK{rb4c_unl0cked}`
- **App type**: Uses K8s in-cluster API client to list secrets, finds `flag-secret`, prints its data value
- **Image**: `ghcr.io/adventofkube/day09`
- **Resources**: Namespace, Deployment, ServiceAccount, Role, RoleBinding, Secret (flag-secret)
- **Source link**: Users check Go source to see it calls list (not get)
- **Fix**: Edit the Role to add `list` verb to the secrets resource rule
- **Time target**: ~20 min
- **Note**: The Go app needs the `k8s.io/client-go` library for in-cluster API access. Multi-stage Docker build with Go modules.

### Day 10 — NetworkPolicy Firewall (NetworkPolicies)

- **Title**: NetworkPolicy Firewall
- **Description**: A pod has the flag but a NetworkPolicy is blocking all traffic to it. The pod is running and healthy but unreachable.
- **Bug**: A default-deny-all ingress NetworkPolicy exists in the namespace. No allow policy for the flag-server pod.
- **Flag**: `AOK{f1rewall_br3ached}`
- **App type**: HTTP server on :8080, returns flag at `/`
- **Image**: `ghcr.io/adventofkube/day10`
- **Resources**: Namespace, Deployment, Service, NetworkPolicy (default-deny)
- **Fix**: Create a NetworkPolicy that allows ingress to the flag-server pod (e.g., from pods with a specific label, or from all pods in namespace)
- **Time target**: ~20 min
- **Note**: Users need to understand NetworkPolicy spec: podSelector, ingress rules, `from` clauses.

### Day 11 — PV/PVC Binding (Storage)

- **Title**: PV/PVC Binding
- **Description**: A pod needs to read a file from a PersistentVolume, but the PVC won't bind. The pod is stuck Pending.
- **Bug**: PV has `storageClassName: manual` but PVC requests `storageClassName: standard`. PV capacity is 1Gi but PVC requests 2Gi.
- **Flag**: `AOK{st0rage_b0und}`
- **App type**: Reads `/data/flag.txt` and prints contents to stdout
- **Image**: `ghcr.io/adventofkube/day11`
- **Resources**: Namespace, PersistentVolume (with hostPath and flag data), PersistentVolumeClaim, Pod
- **Flag delivery**: An initContainer (busybox) writes the flag to `/data/flag.txt` on the volume before the main container reads it
- **Fix**: Match storageClassName (`manual`) and reduce PVC request to ≤ 1Gi
- **Time target**: ~20 min
- **Note**: Using hostPath PV works in kind. The initContainer writes the flag so it's on the volume.

### Day 12 — Rolling Update Stuck (Rollouts)

- **Title**: Rolling Update Stuck
- **Description**: A Deployment rollout is stuck. A new version was pushed but no new pods are being created. The old version is still running.
- **Bug**: Deployment strategy has `maxUnavailable: 0` and `maxSurge: 0` — deadlock. Kubernetes can't create new pods (surge=0) or remove old ones (unavailable=0).
- **Flag**: `AOK{r0lled_0ut}`
- **App type**: HTTP server on :8080, returns flag at `/`. The v1 image returns "not the flag", v2 returns the actual flag.
- **Image**: `ghcr.io/adventofkube/day12` (two tags: v1 and v2)
- **Resources**: Namespace, Deployment (currently running v1, spec says v2), Service
- **Fix**: Set `maxSurge: 1` (or any value > 0) so rollout can proceed
- **Time target**: ~20 min
- **Note**: Need to publish two image tags. v1 returns a decoy message, v2 returns the flag.

---

## Tier 2: Advanced (Days 13-19)

Tools required: kind, kubectl, helm + Prometheus, Grafana, Loki, cert-manager, metrics-server

### Day 13 — Metrics Missing (Prometheus)

- **Title**: Metrics Missing
- **Description**: Prometheus is running but not scraping the application's metrics. The flag is hidden in a custom Prometheus metric.
- **Bug**: ServiceMonitor `matchLabels` don't match the app's Service labels. Prometheus can't discover the scrape target.
- **Flag**: `AOK{m3trics_sc4aped}`
- **App type**: HTTP server exposing Prometheus metrics on `/metrics`. A custom gauge `flag_value` has the flag in its `HELP` text.
- **Image**: `ghcr.io/adventofkube/day13`
- **Resources**: Namespace, Deployment, Service, ServiceMonitor
- **Prerequisites**: User installs kube-prometheus-stack (Helm chart) first
- **Setup**: Chart includes instructions for installing Prometheus operator
- **Fix**: Correct ServiceMonitor `matchLabels` to match the Service's labels
- **Time target**: ~25 min

### Day 14 — Dashboard Down (Grafana)

- **Title**: Dashboard Down
- **Description**: Grafana is installed with a pre-configured dashboard, but all panels show "No data". Fix the data pipeline to reveal the flag.
- **Bug**: Grafana datasource ConfigMap has wrong Prometheus URL — `http://prometheus:9090` instead of the actual service name (e.g., `http://kube-prometheus-stack-prometheus.monitoring:9090`)
- **Flag**: `AOK{d4shboard_l1ve}`
- **App type**: A Grafana dashboard JSON (provisioned via ConfigMap) with a panel whose title or annotation contains the flag, visible only when the datasource connects.
- **Image**: No custom image — uses Grafana + Prometheus from kube-prometheus-stack
- **Resources**: Namespace, ConfigMap (datasource), ConfigMap (dashboard JSON)
- **Prerequisites**: kube-prometheus-stack already installed (from Day 13)
- **Fix**: Correct the datasource URL in the ConfigMap, restart Grafana pod
- **Time target**: ~25 min

### Day 15 — Logs Lost (Loki)

- **Title**: Logs Lost
- **Description**: Loki and Promtail are running but no logs appear in Loki. An application logged the flag on startup but you can't find it.
- **Bug**: Promtail scrape config has wrong `__path__` — `/var/log/pods/*/*/*.log` instead of `/var/log/pods/*/*/*/*.log` (missing directory level for container name).
- **Flag**: `AOK{l0gs_f0und}`
- **App type**: Prints the flag to stdout once on startup, then sleeps
- **Image**: `ghcr.io/adventofkube/day15`
- **Resources**: Namespace, Deployment
- **Prerequisites**: User installs Loki + Promtail (Helm charts)
- **Setup**: Chart includes instructions for installing Loki stack
- **Fix**: Fix Promtail's path pattern in its ConfigMap/values, restart Promtail, query Loki for the flag
- **Time target**: ~30 min

### Day 16 — Ingress + TLS (Ingress, cert-manager)

- **Title**: Ingress + TLS
- **Description**: An Ingress resource exists but HTTPS connections fail. The TLS certificate isn't being issued.
- **Bug**: cert-manager Certificate resource has wrong `issuerRef.name` — references `letsencrypt-prod` but the actual ClusterIssuer is named `selfsigned-issuer`. The TLS secret referenced by the Ingress doesn't exist.
- **Flag**: `AOK{tls_t3rminated}`
- **App type**: HTTP server on :8080, returns flag at `/`
- **Image**: `ghcr.io/adventofkube/day16`
- **Resources**: Namespace, Deployment, Service, Ingress, Certificate, ClusterIssuer (selfsigned)
- **Prerequisites**: User installs cert-manager + an ingress controller (nginx)
- **Fix**: Correct the Certificate's `issuerRef.name` to `selfsigned-issuer`, wait for cert to be issued
- **Time target**: ~30 min

### Day 17 — HPA Not Scaling (Autoscaling)

- **Title**: HPA Not Scaling
- **Description**: An HPA is configured but reports "unknown" for CPU metrics. The app needs multiple replicas to serve the flag.
- **Bug**: HPA targets CPU utilization but the Deployment has no resource requests set — HPA can't compute percentage. Also metrics-server may not be installed in kind by default.
- **Flag**: `AOK{sc4led_up}`
- **App type**: HTTP server that returns the flag only when ≥2 ready replicas exist (checks its own endpoint count via a shared ConfigMap or downward API)
- **Image**: `ghcr.io/adventofkube/day17`
- **Resources**: Namespace, Deployment, Service, HPA
- **Prerequisites**: metrics-server installed
- **Fix**: Install metrics-server (if missing), add CPU resource requests to the Deployment pod spec
- **Time target**: ~30 min

### Day 18 — Node Affinity (Scheduling)

- **Title**: Node Affinity
- **Description**: A pod is stuck Pending. It requires a specific node but none match.
- **Bug**: Pod has `requiredDuringSchedulingIgnoredDuringExecution` node affinity for label `gpu: "true"` but no nodes have this label.
- **Flag**: `AOK{n0de_aff1nity}`
- **App type**: Stdout — prints flag and exits
- **Image**: `ghcr.io/adventofkube/day18`
- **Resources**: Namespace, Pod (with node affinity)
- **Fix**: Label a node with `gpu=true`: `kubectl label node <node> gpu=true`
- **Time target**: ~20 min

### Day 19 — Taint Toleration (Scheduling)

- **Title**: Taint Toleration
- **Description**: A pod is stuck Pending. The node has a taint that the pod doesn't tolerate.
- **Bug**: The kind worker node is tainted with `workload=critical:NoSchedule`. The pod has no tolerations.
- **Flag**: `AOK{t0lerat3d}`
- **App type**: Stdout — prints flag and exits
- **Image**: `ghcr.io/adventofkube/day19`
- **Resources**: Namespace, Pod (no tolerations)
- **Chart setup**: A Job or initContainer taints the node as part of Helm install
- **Fix**: Add a matching toleration to the pod spec, or remove the taint from the node
- **Time target**: ~20 min
- **Note**: kind clusters have a single control-plane node by default. The chart needs to taint a node. May need a multi-node kind config or taint the control-plane.

---

## Tier 3: Expert (Days 20-25)

Tools required: kind, kubectl, helm + ArgoCD, Kyverno

### Day 20 — GitOps Drift (ArgoCD)

- **Title**: GitOps Drift
- **Description**: ArgoCD manages a deployment but the live state has drifted. The app is scaled to 0 replicas. Sync it back.
- **Bug**: Someone manually scaled the Deployment to 0. ArgoCD sync policy is `manual` and self-heal is off. The Application resource points to the correct desired state (1 replica).
- **Flag**: `AOK{g1tops_synced}`
- **App type**: HTTP server on :8080, returns flag at `/`
- **Image**: `ghcr.io/adventofkube/day20`
- **Resources**: Namespace, ArgoCD Application, Deployment (scaled to 0), Service
- **Prerequisites**: ArgoCD installed
- **Fix**: Trigger ArgoCD sync (`argocd app sync` or via UI), or enable auto-sync/self-heal
- **Time target**: ~35 min

### Day 21 — Policy Blocked (Kyverno)

- **Title**: Policy Blocked
- **Description**: A Deployment can't create pods. A cluster policy is rejecting them.
- **Bug**: Kyverno ClusterPolicy requires all pods to have label `team` set. The Deployment's pod template is missing this label.
- **Flag**: `AOK{p0licy_p4ssed}`
- **App type**: Stdout — prints flag and exits
- **Image**: `ghcr.io/adventofkube/day21`
- **Resources**: Namespace, Deployment (missing team label), ClusterPolicy (require-team-label)
- **Prerequisites**: Kyverno installed
- **Fix**: Add `team: <any-value>` label to the Deployment's pod template metadata
- **Time target**: ~30 min

### Day 22 — Init Container Chain (Init Containers)

- **Title**: Init Container Chain
- **Description**: A pod has three init containers that build data for each other, but the chain is broken. Fix it to assemble the flag.
- **Bug**: Init container #1 writes to `/shared/step-1.txt` but init container #2 reads from `/shared/step1.txt` (hyphen vs no hyphen mismatch).
- **Flag**: `AOK{1nit_cha1ned}`
- **App type**: Main container reads `/shared/step3.txt` and prints the assembled flag
- **Image**: `ghcr.io/adventofkube/day22` (main container only — init containers use busybox)
- **Resources**: Namespace, Pod (3 init containers + main container, shared emptyDir volume)
- **Fix**: Correct the filename in init container #2 to match init container #1's output (`step-1.txt`)
- **Time target**: ~30 min

### Day 23 — Ephemeral Debug (Debugging)

- **Title**: Ephemeral Debug
- **Description**: A distroless pod is running with the flag on its filesystem. There's no shell to exec into. Extract the flag.
- **Bug**: No bug — the challenge is using `kubectl debug` with ephemeral containers to access files in a scratch/distroless container.
- **Flag**: `AOK{eph3meral_h4ck}`
- **App type**: Writes flag to `/tmp/flag.txt` then sleeps forever
- **Image**: `ghcr.io/adventofkube/day23` (scratch base, no shell)
- **Resources**: Namespace, Pod
- **Fix**: `kubectl debug -it <pod> --image=busybox --target=<container> -- cat /tmp/flag.txt`
- **Time target**: ~25 min

### Day 24 — Webhook Woes (Admission Webhooks)

- **Title**: Webhook Woes
- **Description**: A ValidatingWebhookConfiguration is rejecting pod creation. Understand its rules and fix the Deployment to pass validation.
- **Bug**: Webhook requires annotation `approved: "true"` on all pods. Deployment's pod template is missing this annotation.
- **Flag**: `AOK{w3bhook_app4oved}`
- **App type**: Stdout — prints flag and exits
- **Image**: `ghcr.io/adventofkube/day24` (the flag app) + a separate webhook server image
- **Webhook image**: `ghcr.io/adventofkube/day24-webhook` — Go HTTPS server that validates the annotation
- **Resources**: Namespace, Deployment (missing annotation), ValidatingWebhookConfiguration, Deployment (webhook server), Service (webhook), Secret (TLS cert for webhook)
- **Fix**: Add `approved: "true"` annotation to the Deployment's pod template, or understand and modify the webhook
- **Time target**: ~35 min
- **Note**: Webhook needs a valid TLS cert. The chart generates a self-signed cert in a Secret.

### Day 25 — Grand Finale (Everything)

- **Title**: Grand Finale
- **Description**: A multi-namespace environment is completely broken. The flag is split across three services. Fix RBAC, networking, and scheduling to assemble the final flag.
- **Bug**: Three namespaces, each with a different problem:
  - NS `finale-a`: RBAC — ServiceAccount can't read the Secret containing flag part 1
  - NS `finale-b`: NetworkPolicy — default-deny blocks traffic to flag-server with part 2
  - NS `finale-c`: Scheduling — Service selector is wrong + node is tainted, pod can't schedule (flag part 3)
- **Flag**: `AOK{adv3nt_compl3te}` (assembled from 3 parts)
- **Flag parts**: Each service returns a fragment. The user concatenates them.
- **App type**: 3 HTTP servers, each returning a flag fragment
- **Images**: `ghcr.io/adventofkube/day25a`, `day25b`, `day25c`
- **Resources**: 3 Namespaces, multiple Deployments, Services, NetworkPolicies, RBAC resources
- **Fix**: Fix RBAC (add list verb), fix NetworkPolicy (allow ingress), fix Service selector + add toleration
- **Time target**: ~45 min

---

## Implementation Plan

### Phase 0: Infrastructure
- Add `images/*/flag.go` to `.gitignore`
- Create CI gen script for `flag.go` injection
- Add `FLAG_VALUES` GitHub secret
- Migrate existing days 1-6 to `flag.go` pattern
- Compute all SHA-256 hashes

### Phase 1: Intermediate (Days 7-12)
- 6 parallel agents, one per day
- Each agent creates: chart + image + config entry

### Phase 2: Advanced (Days 13-19)
- 7 parallel agents, one per day
- Each agent creates: chart + image + config entry
- Days 13-15 include prerequisite install instructions (Prometheus, Grafana, Loki)

### Phase 3: Expert (Days 20-25)
- 6 parallel agents, one per day
- Each agent creates: chart + image + config entry
- Days 20-21 include prerequisite install instructions (ArgoCD, Kyverno)

### Phase 4: Integration
- Update `js/config.js` with all new day configs (setup, hints, docs, flag hashes)
- Update `functions/submit-flag.js` with all new flag hashes
- Update README status column
