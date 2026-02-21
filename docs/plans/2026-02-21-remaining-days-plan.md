# Remaining Challenge Days (7-25) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all 19 remaining Advent of Kube challenge days (7-25) plus migrate existing days to a secure flag injection pattern.

**Architecture:** Each day has 3 components: Helm chart (charts/dayNN/), Go container image (images/dayNN/), and config entries (js/config.js + functions/submit-flag.js). Bugs live in values.yaml or templates, not in Go source. Flags are injected at build time via gitignored flag.go files, generated from a GitHub Actions secret.

**Tech Stack:** Helm, Go, Docker (multi-stage to scratch), GitHub Actions, kind (Kubernetes)

**Parallelization:** Tasks within each tier are independent and can run as parallel agents in worktrees. Tiers are sequential (infra first, then intermediate, advanced, expert, integration last).

---

## Conventions Reference

All agents MUST follow these conventions from the existing codebase:

### Chart structure
```
charts/dayNN/
├── Chart.yaml          # apiVersion: v2, name: dayNN, version: 0.1.0
├── values.yaml         # Bug(s) embedded here
└── templates/
    ├── namespace.yaml  # Always: apiVersion: v1, kind: Namespace, metadata.name: dayNN
    └── ...             # Other K8s resources
```

### Chart.yaml template
```yaml
apiVersion: v2
name: dayNN
description: "Day N: Title — short description of the challenge"
version: 0.1.0
type: application
```

### Image structure (NEW — flag.go pattern)
```
images/dayNN/
├── main.go       # App logic, references `flag` from flag.go. NO hardcoded flag.
├── flag.go       # GITIGNORED. `package main; const flag = "AOK{...}"`
└── Dockerfile    # Multi-stage: golang:1.22-alpine → scratch
```

### Dockerfile template
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY *.go .
RUN CGO_ENABLED=0 go build -o server .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

Note: Dockerfile now uses `COPY *.go .` (not `COPY main.go .`) to include flag.go.

### For images that need Go modules (e.g., Day 9 with k8s client-go):
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go .
RUN CGO_ENABLED=0 go build -o server .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

### CI builds images with tag `:v1` by default
The workflow at `.github/workflows/build-push.yml` tags all images as `v1`.
Exception: Day 12 needs both `:v1` (decoy) and `:v2` (flag) — requires CI modification.

---

## Flag Registry

| Day | Flag | SHA-256 Hash |
|-----|------|-------------|
| 7 | `AOK{s3rvice_w1red_up}` | `3d3d1fb274ca5d09414bb2b2f9fcf8a663de10cdaffdd880e91980a3d50b817a` |
| 8 | `AOK{pr0bes_p4ssing}` | `f3488d3f7b71217101c6d22e81016d4c1fabdacb9b4d7dc4b860656b41dbbbfe` |
| 9 | `AOK{rb4c_unl0cked}` | `8cdbc41767786542284d8cb18a5c031ac77e640b1af6dfec3d907dd63d299e47` |
| 10 | `AOK{f1rewall_br3ached}` | `83ef97ed32bdb69b8d2f89797a61f6033a5b9688f320be047c569f6773973d70` |
| 11 | `AOK{st0rage_b0und}` | `2c68f141f69bcd0fcbf0234b732caaf2694ebba03fc7497c8756e5f40ae356f9` |
| 12 | `AOK{r0lled_0ut}` | `bbdb1db158f38fdc413c31ab6a98db402954270f7b251ea8e04d870ccf62ddcd` |
| 13 | `AOK{m3trics_sc4aped}` | `d839e0669baea744e1af3debc51cd808d0138c866552628eda56122c4837acf3` |
| 14 | `AOK{d4shboard_l1ve}` | `ad8aa6c10a82462066e4955b63d68b9e43fbb2b17210c92a50a5c41bd188251b` |
| 15 | `AOK{l0gs_f0und}` | `954ade5782c9db31550644dc20b42df2c28a4fe81823204641ba57bbdedea12b` |
| 16 | `AOK{tls_t3rminated}` | `081e574ceacd017e573eaec933617a78f2c0173a372ea550487421b7b71c5eb0` |
| 17 | `AOK{sc4led_up}` | `781b090a4553f32ffd039bb8543bd078e89a24755e44654c989b21710a50511a` |
| 18 | `AOK{n0de_aff1nity}` | `1929f40692ebcb36dc53e37adfe10f3959c7bfad1d3c0f152d7b4b40d13ebb7b` |
| 19 | `AOK{t0lerat3d}` | `89984116e4c89d895e53166e1f532b8fb2c9c50cc22beb94b04e96e7a6901e5b` |
| 20 | `AOK{g1tops_synced}` | `81a405a0379643675e9f9cd857f0d26b68f2ae69620635afefcce5d854ba519e` |
| 21 | `AOK{p0licy_p4ssed}` | `ca681497e642ed59dba8f65f00378ed549b27d5ef19504fc19ace3869afb4414` |
| 22 | `AOK{1nit_cha1ned}` | `024ffb2f91c842fb20b21b5738ed9f431c5e6810c2268ed0a59a4b47891ac76e` |
| 23 | `AOK{eph3meral_h4ck}` | `0096ce6bb2184ec0be4da2fb24f8860fb400d25692332762b5d7856403e4eec7` |
| 24 | `AOK{w3bhook_app4oved}` | `b564e0f99af733b4d9f3aa0605521fe2cfce6463a62eb99339272b25cebaf194` |
| 25 | `AOK{adv3nt_compl3te}` | `7e73dc6fbc809d72f6146c97c110d425a0fca511dac070ece2946d5df868651f` |

---

## Task 0: Infrastructure — Flag Injection Pattern

**Files:**
- Modify: `.gitignore`
- Create: `scripts/gen-flags.sh`
- Modify: `.github/workflows/build-push.yml`
- Modify: `images/day01/main.go`, `images/day01/Dockerfile`
- Modify: `images/day03/main.go`, `images/day03/Dockerfile`
- Modify: `images/day04/main.go`, `images/day04/Dockerfile`
- Modify: `images/day05/main.go`, `images/day05/Dockerfile`
- Modify: `images/day06/main.go`, `images/day06/Dockerfile`

### Step 1: Add flag.go to .gitignore

Add to `.gitignore`:
```
images/*/flag.go
```

### Step 2: Create flag generation script

Create `scripts/gen-flags.sh`:
```bash
#!/usr/bin/env bash
# Generates flag.go files from FLAG_VALUES JSON secret.
# Usage: FLAG_VALUES='{"day01":"AOK{...}"}' ./scripts/gen-flags.sh
set -euo pipefail

if [ -z "${FLAG_VALUES:-}" ]; then
  echo "ERROR: FLAG_VALUES environment variable not set" >&2
  exit 1
fi

echo "$FLAG_VALUES" | jq -r 'to_entries[] | "\(.key) \(.value)"' | while read -r day flagval; do
  dir="images/$day"
  if [ -d "$dir" ]; then
    cat > "$dir/flag.go" <<GOEOF
package main

const flag = "$flagval"
GOEOF
    echo "Generated $dir/flag.go"
  fi
done
```

Make executable: `chmod +x scripts/gen-flags.sh`

### Step 3: Update CI workflow

Add flag generation step to `.github/workflows/build-push.yml` in the `images` job, after checkout and before build:

```yaml
      - name: Generate flag files
        env:
          FLAG_VALUES: ${{ secrets.FLAG_VALUES }}
        run: ./scripts/gen-flags.sh
```

### Step 4: Migrate existing images to flag.go pattern

For each of days 1, 3, 4, 5, 6:

**images/day01/main.go** — Change `fmt.Println("AOK{first_p0d_fixed}")` to `fmt.Println(flag)`
**images/day01/Dockerfile** — Change `COPY main.go .` to `COPY *.go .`

**images/day03/main.go** — Change the hardcoded `"AOK{l4bels_and_s3lectors}"` response to `flag`
**images/day03/Dockerfile** — Change `COPY main.go .` to `COPY *.go .`

**images/day04/main.go** — Change `fmt.Println("AOK{s3crets_unl0cked}")` to `fmt.Println(flag)`
**images/day04/Dockerfile** — Change `COPY main.go .` to `COPY *.go .`

**images/day05/main.go** — Change `fmt.Println("AOK{qu0ta_cr1sis_av3rted}")` to `fmt.Println(flag)`
**images/day05/Dockerfile** — Change `COPY main.go .` to `COPY *.go .`

**images/day06/main.go** — Change the hardcoded `"AOK{d3ploy_and_d3bug}"` response to `flag`
**images/day06/Dockerfile** — Change `COPY main.go .` to `COPY *.go .`

### Step 5: Commit

```bash
git add .gitignore scripts/gen-flags.sh .github/workflows/build-push.yml images/
git commit -m "feat: flag injection pattern — gitignored flag.go + CI gen script

- Add images/*/flag.go to .gitignore
- Create scripts/gen-flags.sh for CI flag generation
- Update CI workflow to generate flags before build
- Migrate days 1,3,4,5,6 to use flag constant from flag.go
- Update Dockerfiles to COPY *.go for flag.go inclusion"
```

---

## Task 1: Day 7 — Service Wiring

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day07/Chart.yaml`
- Create: `charts/day07/values.yaml`
- Create: `charts/day07/templates/namespace.yaml`
- Create: `charts/day07/templates/deployment.yaml`
- Create: `charts/day07/templates/service.yaml`
- Create: `images/day07/main.go`
- Create: `images/day07/Dockerfile`

### Chart

**charts/day07/Chart.yaml:**
```yaml
apiVersion: v2
name: day07
description: "Day 7: Service Wiring — fix the broken Service routing"
version: 0.1.0
type: application
```

**charts/day07/values.yaml:**
```yaml
namespace: day07
appName: flag-server
image:
  repository: ghcr.io/adventofkube/day07
  tag: v1
service:
  port: 80
  targetPort: https    # BUG: pod port is named "web", not "https"
```

**charts/day07/templates/namespace.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
```

**charts/day07/templates/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
  labels:
    app: {{ .Values.appName }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
        - name: {{ .Values.appName }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 8080
              name: web
```

**charts/day07/templates/service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ .Values.appName }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
```

### Image

**images/day07/main.go:**
```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**images/day07/Dockerfile:** Use standard Dockerfile template (COPY *.go).

### Commit
```bash
git add charts/day07/ images/day07/
git commit -m "Add Day 7: Service Wiring — named port mismatch"
```

---

## Task 2: Day 8 — Probe Pitfall

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day08/Chart.yaml`
- Create: `charts/day08/values.yaml`
- Create: `charts/day08/templates/namespace.yaml`
- Create: `charts/day08/templates/deployment.yaml`
- Create: `charts/day08/templates/service.yaml`
- Create: `images/day08/main.go`
- Create: `images/day08/Dockerfile`

### Chart

**charts/day08/Chart.yaml:**
```yaml
apiVersion: v2
name: day08
description: "Day 8: Probe Pitfall — fix the misconfigured health checks"
version: 0.1.0
type: application
```

**charts/day08/values.yaml:**
```yaml
namespace: day08
appName: probe-app
image:
  repository: ghcr.io/adventofkube/day08
  tag: v1
liveness:
  path: /healthz         # BUG: app serves health at /health
  initialDelaySeconds: 0
  periodSeconds: 5
readiness:
  path: /health
  initialDelaySeconds: 0   # BUG: app takes 3s to start
  periodSeconds: 1          # BUG: too aggressive
  failureThreshold: 1       # BUG: fails immediately
```

**charts/day08/templates/namespace.yaml:** Standard namespace template.

**charts/day08/templates/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
  labels:
    app: {{ .Values.appName }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
        - name: {{ .Values.appName }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: {{ .Values.liveness.path }}
              port: 8080
            initialDelaySeconds: {{ .Values.liveness.initialDelaySeconds }}
            periodSeconds: {{ .Values.liveness.periodSeconds }}
          readinessProbe:
            httpGet:
              path: {{ .Values.readiness.path }}
              port: 8080
            initialDelaySeconds: {{ .Values.readiness.initialDelaySeconds }}
            periodSeconds: {{ .Values.readiness.periodSeconds }}
            failureThreshold: {{ .Values.readiness.failureThreshold }}
```

**charts/day08/templates/service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ .Values.appName }}
  ports:
    - port: 80
      targetPort: 8080
```

### Image

**images/day08/main.go:**
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

var ready = false

func main() {
	// Simulate slow startup
	go func() {
		time.Sleep(3 * time.Second)
		ready = true
		log.Println("Application ready")
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if !ready {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if !ready {
			http.Error(w, "starting", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**images/day08/Dockerfile:** Standard Dockerfile template.

### Commit
```bash
git add charts/day08/ images/day08/
git commit -m "Add Day 8: Probe Pitfall — wrong liveness path + aggressive readiness"
```

---

## Task 3: Day 9 — RBAC Lockdown

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day09/Chart.yaml`
- Create: `charts/day09/values.yaml`
- Create: `charts/day09/templates/namespace.yaml`
- Create: `charts/day09/templates/serviceaccount.yaml`
- Create: `charts/day09/templates/role.yaml`
- Create: `charts/day09/templates/rolebinding.yaml`
- Create: `charts/day09/templates/secret.yaml`
- Create: `charts/day09/templates/pod.yaml`
- Create: `images/day09/main.go`
- Create: `images/day09/go.mod`
- Create: `images/day09/go.sum`
- Create: `images/day09/Dockerfile`

### Chart

**charts/day09/Chart.yaml:**
```yaml
apiVersion: v2
name: day09
description: "Day 9: RBAC Lockdown — fix the ServiceAccount permissions"
version: 0.1.0
type: application
```

**charts/day09/values.yaml:**
```yaml
namespace: day09
appName: rbac-app
image:
  repository: ghcr.io/adventofkube/day09
  tag: v1
serviceAccount: flag-reader
role:
  verbs:        # BUG: missing "list" — app needs list to find the secret
    - get
  resources:
    - secrets
secretName: flag-secret
```

**charts/day09/templates/namespace.yaml:** Standard namespace template.

**charts/day09/templates/serviceaccount.yaml:**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Values.serviceAccount }}
  namespace: {{ .Values.namespace }}
```

**charts/day09/templates/role.yaml:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: {{ .Values.namespace }}
rules:
  - apiGroups: [""]
    resources: {{ .Values.role.resources | toJson }}
    verbs: {{ .Values.role.verbs | toJson }}
```

**charts/day09/templates/rolebinding.yaml:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-secrets
  namespace: {{ .Values.namespace }}
subjects:
  - kind: ServiceAccount
    name: {{ .Values.serviceAccount }}
    namespace: {{ .Values.namespace }}
roleRef:
  kind: Role
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

**charts/day09/templates/secret.yaml:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.secretName }}
  namespace: {{ .Values.namespace }}
type: Opaque
stringData:
  flag: "PLACEHOLDER"
```

Note: The secret value is `PLACEHOLDER` in the committed chart. The actual flag is in the Go binary — the app reads the secret to verify it can access it, then prints its own flag constant. Alternatively, the app lists secrets, finds `flag-secret`, and prints the flag from its own compiled constant. The secret's presence is what the RBAC is about, not its contents.

**charts/day09/templates/pod.yaml:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  serviceAccountName: {{ .Values.serviceAccount }}
  containers:
    - name: {{ .Values.appName }}
      image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
  restartPolicy: OnFailure
```

### Image

**images/day09/main.go:**
```go
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	config, err := rest.InClusterConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Not running in cluster: %v\n", err)
		os.Exit(1)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Failed to create client: %v\n", err)
		os.Exit(1)
	}

	namespace := os.Getenv("POD_NAMESPACE")
	if namespace == "" {
		namespace = "day09"
	}

	// Retry loop — RBAC might not be ready yet
	for i := 0; i < 5; i++ {
		secrets, err := clientset.CoreV1().Secrets(namespace).List(
			context.TODO(),
			metav1.ListOptions{},
		)
		if err != nil {
			fmt.Fprintf(os.Stderr, "ERROR: Cannot list secrets: %v\n", err)
			fmt.Fprintln(os.Stderr, "Hint: check the Role permissions for this ServiceAccount")
			time.Sleep(5 * time.Second)
			continue
		}

		for _, s := range secrets.Items {
			if s.Name == "flag-secret" {
				fmt.Println(flag)
				return
			}
		}
		fmt.Fprintln(os.Stderr, "ERROR: flag-secret not found")
		time.Sleep(5 * time.Second)
	}

	fmt.Fprintln(os.Stderr, "FAILED: Could not access secrets after retries")
	os.Exit(1)
}
```

This requires Go modules. Create `go.mod` and run `go mod tidy` to generate `go.sum`.

**images/day09/go.mod:**
```
module github.com/adventofkube/day09

go 1.22

require (
	k8s.io/apimachinery v0.29.0
	k8s.io/client-go v0.29.0
)
```

Run `cd images/day09 && go mod tidy` to populate go.sum.

**images/day09/Dockerfile:** Use Go modules Dockerfile template.

### Commit
```bash
git add charts/day09/ images/day09/
git commit -m "Add Day 9: RBAC Lockdown — missing list verb on secrets Role"
```

---

## Task 4: Day 10 — NetworkPolicy Firewall

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day10/Chart.yaml`
- Create: `charts/day10/values.yaml`
- Create: `charts/day10/templates/namespace.yaml`
- Create: `charts/day10/templates/deployment.yaml`
- Create: `charts/day10/templates/service.yaml`
- Create: `charts/day10/templates/networkpolicy.yaml`
- Create: `images/day10/main.go`
- Create: `images/day10/Dockerfile`

### Chart

**charts/day10/Chart.yaml:**
```yaml
apiVersion: v2
name: day10
description: "Day 10: NetworkPolicy Firewall — allow traffic through the policy"
version: 0.1.0
type: application
```

**charts/day10/values.yaml:**
```yaml
namespace: day10
appName: flag-server
image:
  repository: ghcr.io/adventofkube/day10
  tag: v1
# BUG: default-deny policy with no allow rules
networkPolicy:
  denyAll: true
```

**charts/day10/templates/namespace.yaml:** Standard namespace template.

**charts/day10/templates/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
  labels:
    app: {{ .Values.appName }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
        - name: {{ .Values.appName }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 8080
```

**charts/day10/templates/service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ .Values.appName }}
  ports:
    - port: 80
      targetPort: 8080
```

**charts/day10/templates/networkpolicy.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: {{ .Values.namespace }}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

Note: This denies ALL ingress to all pods in the namespace. No ingress rules = no traffic allowed. Users must create a new NetworkPolicy or modify this one to allow ingress to the flag-server.

### Image

**images/day10/main.go:**
```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**images/day10/Dockerfile:** Standard Dockerfile template.

### Commit
```bash
git add charts/day10/ images/day10/
git commit -m "Add Day 10: NetworkPolicy Firewall — default-deny blocks all ingress"
```

---

## Task 5: Day 11 — PV/PVC Binding

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day11/Chart.yaml`
- Create: `charts/day11/values.yaml`
- Create: `charts/day11/templates/namespace.yaml`
- Create: `charts/day11/templates/pv.yaml`
- Create: `charts/day11/templates/pvc.yaml`
- Create: `charts/day11/templates/pod.yaml`
- Create: `images/day11/main.go`
- Create: `images/day11/Dockerfile`

### Chart

**charts/day11/Chart.yaml:**
```yaml
apiVersion: v2
name: day11
description: "Day 11: PV/PVC Binding — fix the storage configuration"
version: 0.1.0
type: application
```

**charts/day11/values.yaml:**
```yaml
namespace: day11
appName: storage-app
image:
  repository: ghcr.io/adventofkube/day11
  tag: v1
pv:
  storageClassName: manual
  capacity: 1Gi
pvc:
  storageClassName: standard   # BUG: doesn't match PV's "manual"
  request: 2Gi                 # BUG: exceeds PV's 1Gi capacity
```

**charts/day11/templates/namespace.yaml:** Standard namespace template.

**charts/day11/templates/pv.yaml:**
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: day11-pv
spec:
  storageClassName: {{ .Values.pv.storageClassName }}
  capacity:
    storage: {{ .Values.pv.capacity }}
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/day11-data
```

**charts/day11/templates/pvc.yaml:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: day11-pvc
  namespace: {{ .Values.namespace }}
spec:
  storageClassName: {{ .Values.pvc.storageClassName }}
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.pvc.request }}
```

**charts/day11/templates/pod.yaml:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  initContainers:
    - name: write-flag
      image: busybox:1.36
      command: ["sh", "-c", "echo 'FLAG_PLACEHOLDER' > /data/flag.txt"]
      volumeMounts:
        - name: data
          mountPath: /data
  containers:
    - name: {{ .Values.appName }}
      image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: day11-pvc
  restartPolicy: OnFailure
```

Note: The initContainer writes a placeholder — the actual flag comes from the Go binary reading the file and printing its own flag constant instead. This avoids putting the real flag in the chart.

### Image

**images/day11/main.go:**
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// Verify the volume is mounted and readable
	data, err := os.ReadFile("/data/flag.txt")
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Cannot read /data/flag.txt: %v\n", err)
		fmt.Fprintln(os.Stderr, "Hint: check if the PVC is bound and the volume is mounted")
		os.Exit(1)
	}

	if len(data) == 0 {
		fmt.Fprintln(os.Stderr, "ERROR: /data/flag.txt is empty")
		os.Exit(1)
	}

	// Volume works — print the real flag
	fmt.Println(flag)
}
```

**images/day11/Dockerfile:** Standard Dockerfile template.

### Commit
```bash
git add charts/day11/ images/day11/
git commit -m "Add Day 11: PV/PVC Binding — storageClass mismatch + oversized request"
```

---

## Task 6: Day 12 — Rolling Update Stuck

**Parallelizable:** Yes (within Tier 1)

**Files:**
- Create: `charts/day12/Chart.yaml`
- Create: `charts/day12/values.yaml`
- Create: `charts/day12/templates/namespace.yaml`
- Create: `charts/day12/templates/deployment.yaml`
- Create: `charts/day12/templates/service.yaml`
- Create: `images/day12/main.go`
- Create: `images/day12/Dockerfile`

### Chart

**charts/day12/Chart.yaml:**
```yaml
apiVersion: v2
name: day12
description: "Day 12: Rolling Update Stuck — fix the deadlocked rollout"
version: 0.1.0
type: application
```

**charts/day12/values.yaml:**
```yaml
namespace: day12
appName: rollout-app
image:
  repository: ghcr.io/adventofkube/day12
  tag: v1
strategy:
  maxUnavailable: 0
  maxSurge: 0          # BUG: deadlock — can't create or remove pods
```

Note: The deployment spec uses image tag v1. The "current" state should show v1 running. The user needs to both fix the strategy AND update the image to v2 (which has the flag). However, since the chart installs with v1 and the strategy is deadlocked, the rollout to v2 can't proceed. Actually, to make this simpler: the chart should install with image tag v2 specified but v1 pods already running (simulating a stuck rollout). This is hard to do with Helm alone.

Simpler approach: Deploy with tag `v1` in the running pods. The values.yaml specifies `v1` but there's an annotation or the description tells users to update to `v2`. The bug is the strategy — when they try `kubectl set image` to v2, it gets stuck.

Even simpler: The chart deploys with tag `v1`. The app at v1 prints "Update me to v2 to get the flag." The strategy makes rollouts impossible. Users fix strategy, then update the image tag.

**Revised values.yaml:**
```yaml
namespace: day12
appName: rollout-app
image:
  repository: ghcr.io/adventofkube/day12
  tag: v1
strategy:
  maxUnavailable: 0
  maxSurge: 0          # BUG: deadlock — can't create or remove pods
```

**charts/day12/templates/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
  labels:
    app: {{ .Values.appName }}
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: {{ .Values.strategy.maxUnavailable }}
      maxSurge: {{ .Values.strategy.maxSurge }}
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
        - name: {{ .Values.appName }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 8080
```

**charts/day12/templates/service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ .Values.appName }}
  ports:
    - port: 80
      targetPort: 8080
```

### Image

Need TWO versions of this image. The v1 tag returns a hint, v2 returns the flag.

**images/day12/main.go:**
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	version := os.Getenv("APP_VERSION")
	if version == "" {
		version = "v1"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if version == "v2" {
			fmt.Fprintln(w, flag)
		} else {
			fmt.Fprintln(w, "You're running v1. Update to v2 to get the flag!")
		}
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Printf("rollout-app %s starting on :8080\n", version)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

Note: CI needs to build TWO tags for day12. The v1 image has `APP_VERSION=v1` baked in, v2 has `APP_VERSION=v2`. This requires a Dockerfile modification:

**images/day12/Dockerfile:**
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY *.go .
ARG APP_VERSION=v1
RUN CGO_ENABLED=0 go build -ldflags="-X main.defaultVersion=$APP_VERSION" -o server .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

Update main.go to use ldflags:
```go
var defaultVersion = "v1"

func main() {
	version := os.Getenv("APP_VERSION")
	if version == "" {
		version = defaultVersion
	}
	// ... rest same
}
```

CI workflow needs special handling for day12 to build both v1 and v2 tags. Add to CI workflow:
```yaml
# Special case for day12: build both v1 and v2
if [ "$name" = "day12" ]; then
  docker build --build-arg APP_VERSION=v1 -t $REGISTRY/$ORG/$name:v1 $dir
  docker push $REGISTRY/$ORG/$name:v1
  docker build --build-arg APP_VERSION=v2 -t $REGISTRY/$ORG/$name:v2 $dir
  docker push $REGISTRY/$ORG/$name:v2
fi
```

### Commit
```bash
git add charts/day12/ images/day12/
git commit -m "Add Day 12: Rolling Update Stuck — maxSurge:0 + maxUnavailable:0 deadlock"
```

---

## Task 7: Day 13 — Metrics Missing (Prometheus)

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day13/Chart.yaml`
- Create: `charts/day13/values.yaml`
- Create: `charts/day13/templates/namespace.yaml`
- Create: `charts/day13/templates/deployment.yaml`
- Create: `charts/day13/templates/service.yaml`
- Create: `charts/day13/templates/servicemonitor.yaml`
- Create: `images/day13/main.go`
- Create: `images/day13/go.mod`
- Create: `images/day13/Dockerfile`

### Chart

**charts/day13/values.yaml:**
```yaml
namespace: day13
appName: metrics-app
image:
  repository: ghcr.io/adventofkube/day13
  tag: v1
service:
  labels:
    app: metrics-app
serviceMonitor:
  matchLabels:
    app: metrics-server    # BUG: doesn't match service label "metrics-app"
```

**charts/day13/templates/service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- range $key, $val := .Values.service.labels }}
    {{ $key }}: {{ $val }}
    {{- end }}
spec:
  selector:
    app: {{ .Values.appName }}
  ports:
    - port: 80
      targetPort: 8080
      name: http
```

**charts/day13/templates/servicemonitor.yaml:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ .Values.appName }}-monitor
  namespace: {{ .Values.namespace }}
spec:
  selector:
    matchLabels:
      {{- range $key, $val := .Values.serviceMonitor.matchLabels }}
      {{ $key }}: {{ $val }}
      {{- end }}
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

### Image

**images/day13/main.go:**
```go
package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	flagGauge := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "flag_value",
		Help: flag,
	})
	prometheus.MustRegister(flagGauge)
	flagGauge.Set(1)

	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Check /metrics for the flag (look at the HELP text of flag_value)")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

Requires go modules with `github.com/prometheus/client_golang`.

### Commit
```bash
git add charts/day13/ images/day13/
git commit -m "Add Day 13: Metrics Missing — ServiceMonitor label mismatch"
```

---

## Task 8: Day 14 — Dashboard Down (Grafana)

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day14/Chart.yaml`
- Create: `charts/day14/values.yaml`
- Create: `charts/day14/templates/namespace.yaml`
- Create: `charts/day14/templates/datasource-configmap.yaml`
- Create: `charts/day14/templates/dashboard-configmap.yaml`

No custom image — uses Grafana from kube-prometheus-stack.

### Chart

**charts/day14/values.yaml:**
```yaml
namespace: day14
grafana:
  datasource:
    url: http://prometheus:9090    # BUG: wrong service name
```

The dashboard ConfigMap contains a Grafana dashboard JSON with a panel annotation containing the flag text. The flag is visible in the dashboard panel title once data loads.

Since there's no custom image, the flag is embedded in the dashboard JSON as a panel title: the flag is `AOK{d4shboard_l1ve}` visible only when the datasource works and the panel renders data.

Actually, since the flag needs to be verified and this day has no Go image, the flag should be obtainable another way. Options:
1. A panel title contains the flag — visible in Grafana UI when data loads
2. A recording rule computes a metric whose name encodes the flag

Approach: The dashboard has a panel that queries a metric. The panel title says "The flag is: AOK{d4shboard_l1ve}" but the panel is hidden behind a "No Data" state until the datasource works. Once the datasource connects and the query returns data, the panel renders and the title is visible.

### Commit
```bash
git add charts/day14/
git commit -m "Add Day 14: Dashboard Down — wrong Grafana datasource URL"
```

---

## Task 9: Day 15 — Logs Lost (Loki)

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day15/Chart.yaml`
- Create: `charts/day15/values.yaml`
- Create: `charts/day15/templates/namespace.yaml`
- Create: `charts/day15/templates/deployment.yaml`
- Create: `charts/day15/templates/promtail-config.yaml`
- Create: `images/day15/main.go`
- Create: `images/day15/Dockerfile`

### Chart

**charts/day15/values.yaml:**
```yaml
namespace: day15
appName: log-app
image:
  repository: ghcr.io/adventofkube/day15
  tag: v1
promtail:
  scrape_path: "/var/log/pods/*/*/*.log"    # BUG: missing container dir level
  # correct: "/var/log/pods/*/*/*/*.log"
```

### Image

**images/day15/main.go:**
```go
package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println(flag)
	// Keep running so the pod stays alive
	select {}
	_ = time.Now() // unreachable but prevents import error
}
```

### Commit
```bash
git add charts/day15/ images/day15/
git commit -m "Add Day 15: Logs Lost — wrong Promtail scrape path"
```

---

## Task 10: Day 16 — Ingress + TLS

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day16/` (full chart)
- Create: `images/day16/` (HTTP server)

### Chart

**charts/day16/values.yaml:**
```yaml
namespace: day16
appName: tls-app
image:
  repository: ghcr.io/adventofkube/day16
  tag: v1
ingress:
  host: flag.local
  tlsSecret: flag-tls
certificate:
  issuerRef: letsencrypt-prod    # BUG: issuer is actually "selfsigned-issuer"
```

Resources: Namespace, Deployment, Service, Ingress (references TLS secret), Certificate (wrong issuerRef), ClusterIssuer (selfsigned).

### Image

Standard HTTP server returning flag at `/`.

### Commit
```bash
git add charts/day16/ images/day16/
git commit -m "Add Day 16: Ingress + TLS — wrong cert-manager issuerRef"
```

---

## Task 11: Day 17 — HPA Not Scaling

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day17/` (full chart)
- Create: `images/day17/` (HTTP server, checks replica count)

### Chart

**charts/day17/values.yaml:**
```yaml
namespace: day17
appName: scale-app
image:
  repository: ghcr.io/adventofkube/day17
  tag: v1
hpa:
  minReplicas: 1
  maxReplicas: 5
  targetCPU: 50
# BUG: deployment has no resource requests — HPA can't calculate CPU %
resources: {}
```

Resources: Namespace, Deployment (no resource requests), Service, HPA.

### Image

HTTP server that checks how many endpoints exist for its own service. Returns flag only when >=2 replicas are ready.

### Commit
```bash
git add charts/day17/ images/day17/
git commit -m "Add Day 17: HPA Not Scaling — missing resource requests"
```

---

## Task 12: Day 18 — Node Affinity

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day18/` (full chart)
- Create: `images/day18/` (stdout flag)

### Chart

**charts/day18/values.yaml:**
```yaml
namespace: day18
appName: affinity-app
image:
  repository: ghcr.io/adventofkube/day18
  tag: v1
affinity:
  requiredLabel: gpu       # BUG: no nodes have label gpu=true
  requiredValue: "true"
```

Resources: Namespace, Pod with node affinity.

### Image

Simple stdout: `fmt.Println(flag)`

### Commit
```bash
git add charts/day18/ images/day18/
git commit -m "Add Day 18: Node Affinity — required label doesn't match any node"
```

---

## Task 13: Day 19 — Taint Toleration

**Parallelizable:** Yes (within Tier 2)

**Files:**
- Create: `charts/day19/` (full chart)
- Create: `images/day19/` (stdout flag)

### Chart

**charts/day19/values.yaml:**
```yaml
namespace: day19
appName: tolerant-app
image:
  repository: ghcr.io/adventofkube/day19
  tag: v1
# BUG: no toleration specified but chart taints the node
taint:
  key: workload
  value: critical
  effect: NoSchedule
```

Resources: Namespace, Pod (no tolerations), Job that taints the node on install.

The chart includes a Job that runs `kubectl taint nodes --all workload=critical:NoSchedule` as a pre-install hook. This requires the Job to have RBAC to taint nodes.

### Image

Simple stdout: `fmt.Println(flag)`

### Commit
```bash
git add charts/day19/ images/day19/
git commit -m "Add Day 19: Taint Toleration — NoSchedule taint with no toleration"
```

---

## Task 14: Day 20 — GitOps Drift (ArgoCD)

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day20/` (full chart)
- Create: `images/day20/` (HTTP server)

### Chart

The chart installs an ArgoCD Application resource pointing to a Git repo (or inline manifests). The Deployment is deployed with 0 replicas (simulating manual drift). ArgoCD's sync policy is manual.

**charts/day20/values.yaml:**
```yaml
namespace: day20
appName: gitops-app
image:
  repository: ghcr.io/adventofkube/day20
  tag: v1
replicas: 0              # BUG: manually scaled to 0 (drift from desired state)
argocd:
  syncPolicy: manual     # No auto-sync or self-heal
  desiredReplicas: 1
```

### Image

Standard HTTP server returning flag.

### Commit
```bash
git add charts/day20/ images/day20/
git commit -m "Add Day 20: GitOps Drift — ArgoCD manual sync + scaled to 0"
```

---

## Task 15: Day 21 — Policy Blocked (Kyverno)

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day21/` (full chart)
- Create: `images/day21/` (stdout flag)

### Chart

**charts/day21/values.yaml:**
```yaml
namespace: day21
appName: policy-app
image:
  repository: ghcr.io/adventofkube/day21
  tag: v1
# BUG: pod template has no "team" label but policy requires it
labels:
  app: policy-app
```

Resources: Namespace, Deployment (missing team label), ClusterPolicy (require-team-label).

### Image

Simple stdout: `fmt.Println(flag)`

### Commit
```bash
git add charts/day21/ images/day21/
git commit -m "Add Day 21: Policy Blocked — Kyverno requires missing team label"
```

---

## Task 16: Day 22 — Init Container Chain

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day22/` (full chart)
- Create: `images/day22/` (reads chain output, prints flag)

### Chart

**charts/day22/values.yaml:**
```yaml
namespace: day22
appName: chain-app
image:
  repository: ghcr.io/adventofkube/day22
  tag: v1
initContainers:
  step1Output: /shared/step-1.txt      # writes with hyphen
  step2Input: /shared/step1.txt         # BUG: reads without hyphen (mismatch)
  step2Output: /shared/step2.txt
  step3Input: /shared/step2.txt
  step3Output: /shared/step3.txt
```

Resources: Namespace, Pod with 3 init containers + main container, emptyDir volume.

Init containers use busybox:
- init-1: `echo "part1" > /shared/step-1.txt`
- init-2: `cat /shared/step1.txt | tr 'a-z' 'A-Z' > /shared/step2.txt` (fails — wrong filename)
- init-3: `cat /shared/step2.txt > /shared/step3.txt`

### Image

Reads `/shared/step3.txt`, if exists prints flag.

### Commit
```bash
git add charts/day22/ images/day22/
git commit -m "Add Day 22: Init Container Chain — filename mismatch between init steps"
```

---

## Task 17: Day 23 — Ephemeral Debug

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day23/` (full chart)
- Create: `images/day23/` (writes flag to file, sleeps)

### Chart

**charts/day23/values.yaml:**
```yaml
namespace: day23
appName: distroless-app
image:
  repository: ghcr.io/adventofkube/day23
  tag: v1
```

Resources: Namespace, Pod (scratch-based, no shell).

### Image

**images/day23/main.go:**
```go
package main

import (
	"os"
	"time"
)

func main() {
	os.WriteFile("/tmp/flag.txt", []byte(flag+"\n"), 0644)
	// Sleep forever — keep pod running
	for {
		time.Sleep(time.Hour)
	}
}
```

### Commit
```bash
git add charts/day23/ images/day23/
git commit -m "Add Day 23: Ephemeral Debug — flag in scratch container filesystem"
```

---

## Task 18: Day 24 — Webhook Woes

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day24/` (full chart)
- Create: `images/day24/` (stdout flag app)
- Create: `images/day24-webhook/` (webhook server)

### Chart

**charts/day24/values.yaml:**
```yaml
namespace: day24
appName: webhook-app
image:
  repository: ghcr.io/adventofkube/day24
  tag: v1
webhook:
  image:
    repository: ghcr.io/adventofkube/day24-webhook
    tag: v1
# BUG: deployment pod template missing required annotation
annotations: {}
# Should have: approved: "true"
```

Resources: Namespace, Deployment (flag app — missing annotation), ValidatingWebhookConfiguration, Deployment (webhook server), Service (webhook), Secret (TLS cert).

### Webhook Image

**images/day24-webhook/main.go:** Go HTTPS server that validates admission requests. Rejects pods without `approved: "true"` annotation.

### Commit
```bash
git add charts/day24/ images/day24/ images/day24-webhook/
git commit -m "Add Day 24: Webhook Woes — ValidatingWebhook rejects unannotated pods"
```

---

## Task 19: Day 25 — Grand Finale

**Parallelizable:** Yes (within Tier 3)

**Files:**
- Create: `charts/day25/` (full chart — 3 namespaces)
- Create: `images/day25a/`, `images/day25b/`, `images/day25c/` (3 HTTP servers)

### Chart

**charts/day25/values.yaml:**
```yaml
namespaces:
  a: finale-a
  b: finale-b
  c: finale-c
images:
  a:
    repository: ghcr.io/adventofkube/day25a
    tag: v1
  b:
    repository: ghcr.io/adventofkube/day25b
    tag: v1
  c:
    repository: ghcr.io/adventofkube/day25c
    tag: v1
# Bugs:
# finale-a: RBAC — ServiceAccount missing "list" on secrets
# finale-b: NetworkPolicy — default-deny blocks ingress
# finale-c: Service selector wrong + node tainted
```

Resources across 3 namespaces. Each service returns a flag fragment. Users combine fragments to get `AOK{adv3nt_compl3te}`.

Flag fragments: The 3 images return "AOK{adv3", "nt_compl3", "te}" respectively. Users concatenate.

### Commit
```bash
git add charts/day25/ images/day25a/ images/day25b/ images/day25c/
git commit -m "Add Day 25: Grand Finale — multi-namespace debugging across 3 broken systems"
```

---

## Task 20: Config Integration

**Depends on:** All previous tasks

**Files:**
- Modify: `js/config.js` — rewrite days 7-25 entries with real flag hashes, setup, hints, docs
- Modify: `functions/submit-flag.js` — add flag hashes for days 7-25
- Modify: `README.md` — update status column for completed days

### Step 1: Update submit-flag.js

Add all 19 new flag hashes to the `FLAG_HASHES` object (days 7-25).

### Step 2: Update config.js

Rewrite each day 7-25 entry with:
- Correct title and description matching README
- Real flagHash
- setup array with helm install command + source link
- hints array (3 progressive hints)
- docs array (relevant K8s documentation links)
- enabled: true (or false if not yet ready for release)

### Step 3: Update README

Change status of each completed day from "Planned" to "Done".

### Step 4: Commit
```bash
git add js/config.js functions/submit-flag.js README.md
git commit -m "Enable Days 7-25: config entries + flag hashes + README status"
```

---

## Execution Order

```
Task 0 (Infrastructure) ─── sequential, do first
    │
    ├── Tasks 1-6 (Days 7-12) ─── parallel agents (Tier 1)
    │       │
    │       ├── Tasks 7-13 (Days 13-19) ─── parallel agents (Tier 2)
    │       │       │
    │       │       ├── Tasks 14-19 (Days 20-25) ─── parallel agents (Tier 3)
    │       │       │       │
    │       │       │       └── Task 20 (Config Integration) ─── sequential, do last
```
