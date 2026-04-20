# VeriCapture — Zero-Trust Digital Evidence System

> Court-admissible digital evidence capture, encryption, and chain-of-custody — built on Lovable Cloud.

**Guiding principle:** _never trust, always verify_ — every file, user, device, and access event is cryptographically validated and fully auditable.

---

## 💡 Project Idea

VeriCapture is a **zero-trust digital evidence management platform** for investigators, law enforcement, and compliance teams. Authorized users capture digital evidence (files, media, documents) tied to a **Case ID**; the system automatically fingerprints, encrypts, notarizes, and tracks every interaction with it — producing a court-admissible **chain of custody** backed by a tamper-evident ledger.

| Pillar | Implementation |
|---|---|
| **Integrity** | SHA-256 fingerprinting of every artifact + per-user blockchain notary chain |
| **Confidentiality** | Client-side AES-256-GCM with PBKDF2 key derivation; private storage; TLS in transit |
| **Accountability** | Immutable custody log + audit trail (actor, IP, device, timestamp) for every action |
| **Least Privilege** | Role-based access (investigator / supervisor / admin) enforced by Postgres RLS |

---

## ✨ Features

### 🔐 Authentication & Access Control
- Email + password sign-in / sign-up
- Google OAuth sign-in
- Dedicated password reset flow at `/reset-password`
- Role-based access: `investigator`, `supervisor`, `admin` (stored in a separate `user_roles` table)
- Auto-assigned `investigator` role on signup via DB trigger
- Device fingerprinting on every login (UA, OS, screen, timezone, language → SHA-256 device ID)

### 📦 Evidence Capture Pipeline
- Drag-and-drop capture tied to the active Case
- **SHA-256 fingerprinting** of every file
- **Tamper detection**: re-uploading same filename with a different hash flags it
- Mock malware scan with progress UI
- **Client-side AES-256-GCM encryption** (PBKDF2, 250k iterations, password-derived key)
- Encrypted upload to private Supabase Storage bucket (`evidence-files`)
- Geo-location and device metadata captured at point of capture

### ⛓️ Digital Notary (Blockchain Ledger)
- Each evidence item adds a block to a per-user chain
- Block hash = `SHA-256(index + timestamp + evidenceHash + previousHash + nonce)`
- Chain integrity validator detects any broken link

### 📋 Chain of Custody
- Every action (upload, view, verify, download) writes a `custody_log` entry with actor, IP, and timestamp
- Visual custody timeline per evidence item
- One-click **PDF export** of court-ready custody report (jsPDF + autoTable)

### 🛡️ Zero-Trust Panel
- Live status: token validity, user verification, device verification, encryption-key availability
- Active roles displayed at a glance

### 📊 Analytics Dashboard
- KPI cards: cases, evidence count, ledger blocks
- 7-day evidence capture timeline (LineChart)
- Evidence status distribution (PieChart)
- Evidence per case (BarChart) and case status breakdown (PieChart)
- Built with **Recharts**

### 📜 Audit Logs (Admin only)
- All sensitive actions logged to `audit_logs` (action, resource, IP, device, user-agent, suspicious flag)
- Filter: All / Suspicious
- Auto-flagging of unusual events

### 👥 Admin Panel (Admin only)
- Assign and revoke roles by user UUID
- View all role assignments
- Every role change logged to the audit trail

### 🗂️ Case Management
- Create cases with auto-generated case codes
- Switch active case
- Per-case evidence count and access expiry

### 🔓 Decryption & Verification
- Decrypt and download original file (requires session password)
- Re-verify SHA-256 against original to confirm integrity

---

## 🛠️ Technologies Used

| Layer | Stack |
|---|---|
| **Frontend** | React 18 · TypeScript 5 · Vite 5 |
| **UI** | Tailwind CSS v3 · shadcn/ui (Radix) · Lucide Icons |
| **Routing & Data** | React Router v6 · TanStack React Query |
| **Charts & Reports** | Recharts · jsPDF · jspdf-autotable · Sonner |
| **Backend** | Lovable Cloud (Supabase) · PostgreSQL with RLS |
| **Auth** | Supabase Auth (Email/Password, Google OAuth, Recovery) |
| **Storage** | Supabase Storage — private `evidence-files` bucket |
| **DB Functions** | `has_role()`, `handle_new_user_role()` (security definer) |
| **Cryptography** | Web Crypto API · SHA-256 · AES-256-GCM · PBKDF2 (250k iterations) |
| **Testing** | Vitest · @testing-library/react |
| **Tooling** | ESLint · TypeScript strict mode |

---

## 🏗️ Modules & Architecture

VeriCapture follows a clean layered architecture. The UI is purely presentational; all backend interaction flows through dedicated service modules and cryptographic utilities.

| Layer | Modules | Responsibility |
|---|---|---|
| **Presentation** | `src/pages`, `src/components` | Pages, dashboards, capture UI, shadcn primitives |
| **Application** | `src/contexts/AuthContext` | Session, roles, in-memory password for AES key derivation |
| **Services** | `services/database`, `storage`, `roles`, `audit` | Supabase CRUD, encrypted upload/download, audit logging |
| **Utils** | `utils/crypto`, `encryption`, `fingerprint`, `scanner`, `pdfExport` | SHA-256, AES-GCM, device ID, PDF reports |
| **Backend** | Lovable Cloud (Supabase) | Postgres + RLS, Auth, Storage, security-definer functions |

### Layered diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│   Pages • Dashboards • Capture UI • shadcn/ui components    │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│    AuthContext: session, roles, in-memory key material      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                         │
│         database • storage • roles • audit                  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       UTILS LAYER                           │
│   crypto • encryption • fingerprint • scanner • pdfExport   │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            LOVABLE CLOUD (Supabase backend)                 │
│       Postgres + RLS • Auth • Storage • DB Functions        │
└─────────────────────────────────────────────────────────────┘
```

### Evidence capture — data flow

```
User drops file
   → SHA-256 hash         → Tamper check (findEvidenceByName)
   → Geolocation          → Device fingerprint
   → Malware scan         → AES-256-GCM encrypt (session password)
   → Upload to Storage    → addBlockToLedger (notary)
   → insertEvidence       → insertCustodyEntry + logAudit
   → UI refresh
```

---

## 🔒 Security Model

| Control | Implementation |
|---|---|
| **Row-Level Security** | RLS policies on every table — users see only their own data |
| **Roles** | Stored in separate `user_roles` table; checked via security-definer `has_role()` |
| **Key Material** | Session password kept in memory only; never persisted |
| **Encryption at Rest** | AES-256-GCM, PBKDF2 250,000 iterations, per-file IV and salt |
| **Encryption in Transit** | TLS via Supabase APIs and Storage |
| **Auditability** | Every action logged with IP, device, user-agent, suspicious flag |
| **Tamper Evidence** | Per-user blockchain ledger linking evidence hashes |

### Database tables

- **`cases`** — case metadata, code, evidence count, expiry
- **`evidence_records`** — file metadata, SHA-256, encryption params, geo, device
- **`custody_log`** — chain-of-custody entries (FK → `evidence_records`)
- **`blockchain_ledger`** — per-user notary chain
- **`audit_logs`** — sensitive action trail
- **`user_roles`** — role assignments (separate from profiles, no privilege escalation)
- **`device_fingerprints`** — known devices per user

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Backend (database, auth, storage) is provisioned automatically via **Lovable Cloud** — no external Supabase account required.

---

## 📁 Project Structure

```
src/
├── pages/              # Route-level pages (Index, ResetPassword, NotFound)
├── components/         # Feature components (Capture, Evidence, Custody, …)
│   └── ui/             # shadcn/ui primitives
├── contexts/           # AuthContext (session + roles + in-memory key)
├── services/           # database, storage, roles, audit
├── utils/              # crypto, encryption, fingerprint, scanner, pdfExport
├── integrations/       # supabase client + types, lovable auth
└── types/              # shared TypeScript types
supabase/
└── migrations/         # SQL migrations (RLS, functions, triggers)
```

---

## 📄 License

Confidential — internal stakeholder distribution.

---

_VeriCapture demonstrates a production-grade approach to digital evidence handling: cryptographic integrity, least-privilege access, and a complete audit trail — delivered as a modern, responsive web application on Lovable Cloud._
