# ApprobMed (FSP Navigator): AI-Powered Platform for German Medical License (Approbation)

**A next-generation SaaS platform empowering Romanian doctors to obtain their German medical license (Approbation) with AI, automation, and community.**

---

## 🚀 Vision & Purpose

ApprobMed is a full-stack, production-grade application designed to radically simplify and accelerate the Approbation process for Romanian (and other international) doctors seeking to practice in Germany. The platform combines:
- **Step-by-step process automation**
- **AI-powered German medical language tutoring (Gemini AI)**
- **Bundesland-specific document management**
- **Gamification and community**
- **Enterprise-grade security, GDPR compliance, and robust admin tools**

**Target Market:** 10,000+ Romanian doctors annually; scalable to all international medical graduates.

---

## 🏗️ Architecture Overview

### Monorepo Structure
```
/approbmed
├── frontend/    # React 18, Tailwind, modern SPA
│   └── src/
│       ├── components/   # Modular UI, admin, gamification, onboarding, content editors
│       ├── contexts/     # Auth, user state, global context
│       ├── services/     # API, content, MongoDB, payment
│       └── utils/        # Gamification, markdown, conversation mgmt
├── backend/     # FastAPI, async, modular, secure
│   ├── routes/  # REST API: auth, progress, content, admin, AI, payments, GDPR, forum, etc.
│   ├── services/ # Stripe, PayPal, email, backup, etc.
│   ├── models.py # Pydantic models: user, progress, docs, gamification, forum, etc.
│   ├── server.py # Entrypoint, CORS, Sentry, MongoDB, index mgmt
│   └── settings.py # Env config, validation, fail-fast
└── docs/        # Technical, business, and deployment docs
```

### Key Technologies
- **Frontend:** React 18, Tailwind CSS, Lucide, Axios, React Router, Framer Motion
- **Backend:** FastAPI, MongoDB (async, Motor), Pydantic, JWT, Celery, Redis, Sentry, Stripe, PayPal, Google Gemini AI
- **DevOps:** Docker-ready, Vercel/Netlify (frontend), Railway/Heroku (backend), MongoDB Atlas, Cloudflare, S3 backup
- **Security:** JWT, rate limiting, audit logging, GDPR, secure password reset, Sentry

---

## 🧩 Backend: FastAPI Microservice

- **API-First:** All features exposed via RESTful endpoints, documented with OpenAPI.
- **Authentication:** JWT, Google OAuth, secure password reset, rate limiting, account lockout, audit logs.
- **User Model:** Rich profile (medical background, target Bundesland, German level, etc.), roles (user, admin, moderator), subscription tier, GDPR consent.
- **Progress Tracking:** 6-step Approbation journey, per-step tasks, real-time progress, sync with frontend.
- **Document Management:** Bundesland-specific requirements, upload, verification, templates, status tracking, personal file vault.
- **AI Assistant:** Gemini-powered chat, context-aware, multilingual (EN/DE/RO), FSP exam prep, document Q&A, timeline advice.
- **Gamification:** Points, levels, achievements, badges, streaks, leaderboard, mini-games (clinical cases, Fachbegriffe, quizzes).
- **Content Management:** Node-based content, versioning, preview, admin editors, file uploads, templates, notifications.
- **Community:** Forum channels, threads, messages, premium access, moderation.
- **Payments:** Stripe & PayPal subscriptions, webhooks, plan management, billing history, GDPR-compliant data export.
- **Admin Panel:** Real-time system config, API keys, DB admin, payment/AI config, edit history, security, backup/restore, analytics.
- **Backup & Restore:** Automated MongoDB and file backups (local/S3), restore, cleanup, audit logs.
- **GDPR & Compliance:** Consent, data export, deletion, privacy settings, legal docs, audit logs, disclaimers.

---

## 🎨 Frontend: Modern React SPA

- **Mobile-First:** Responsive, touch-friendly, PWA-ready.
- **Authentication:** Register, login, Google OAuth, password reset, onboarding.
- **Onboarding & Tutorials:** Interactive, step-by-step, context highlights, relaunchable.
- **Journey Map:** Visual 6-step process, progress nodes, bonus resources, checklist, unlock logic.
- **AI Tutor:** Chat interface, FSP practice, document Q&A, context-aware suggestions, language switch.
- **Document Vault:** Upload, organize, verify, Bundesland-specific checklists, templates, status.
- **Gamification:** Progress bars, XP, levels, badges, achievements, streaks, leaderboard, mini-games.
- **Content Editors:** Rich content, block-based, versioning, preview, admin-only editors.
- **Admin UI:** RealAdminPanel (system config, DB, payments, AI, security, edit history), ContentEditor, NodeEditor.
- **Community:** Forum modal, threads, messages, premium gating.
- **Settings:** Profile, notifications, subscription, GDPR tools, data export, account deletion.

---

## 🔄 Userflow (End-User)

1. **Sign Up / Onboard:** Register (email or Google), complete profile (medical background, German level, target Bundesland).
2. **Welcome Tutorial:** Interactive walkthrough of all key features (document vault, journey map, AI, settings, gamification).
3. **Journey Progress:** Visual 6-step Approbation map, checklist, unlock next steps, see requirements per Bundesland.
4. **AI Learning:** Practice FSP, ask questions, get document help, language switch (EN/DE/RO), context-aware answers.
5. **Document Management:** Upload, organize, verify, see status, get templates, Bundesland-specific checklists.
6. **Gamification:** Earn points, badges, achievements, compete on leaderboard, play mini-games (clinical cases, Fachbegriffe, quizzes).
7. **Community:** Access forum (premium), post threads/messages, get peer support.
8. **Settings & GDPR:** Manage profile, notifications, subscription, export/delete data, view legal docs.
9. **Payments:** Upgrade to premium (Stripe/PayPal), manage billing, unlock AI and community features.

---

## 🛡️ Security & Compliance
- **JWT authentication, Google OAuth, rate limiting, account lockout**
- **Audit logging for all sensitive actions**
- **GDPR: consent, data export, deletion, privacy settings**
- **Sentry error tracking, CORS, secure password reset**
- **Automated backups (local/S3), admin restore, audit logs**

---

## 🛠️ DevOps & Deployment
- **.env-based config, fail-fast validation, key generation script**
- **Docker-ready, Vercel/Netlify (frontend), Railway/Heroku (backend), MongoDB Atlas**
- **Automated backup/restore, S3 support, monitoring hooks**
- **Comprehensive test scripts for settings, MongoDB, rate limiting**

---

## 💡 Business Model
- **Freemium:** Free tier (basic journey, 2 steps, 1 bonus), paid tiers (all steps, AI, community, advanced features)
- **Subscription:** Stripe & PayPal, monthly/yearly, premium unlocks AI, forum, advanced analytics
- **Value:** Save months of research, avoid mistakes, pass FSP faster, community support, legal compliance

---

## 📈 Success Metrics
- **100% feature complete, production-ready, mobile-first, GDPR-compliant**
- **All core flows tested, admin tools for scaling, Sentry for monitoring**
- **Ready for launch and scale to thousands of users**

---

## 🧑‍💻 For Cofounders/Technical Partners
- **Codebase:** Modular, scalable, modern stack, clear separation of concerns
- **Admin:** Real admin panel (not just demo), full system config, DB, payments, AI, security, backup
- **Docs:** See `/docs` for improvement plans, fixes, setup, and business vision
- **Growth:** Built for rapid onboarding of new features, new user segments, and internationalization

---

## 🏁 Quick Start (Local Dev)

### 1. Backend
```bash
cd backend
python3 -m uvicorn server:app --reload --port 8001
```

### 2. Frontend
```bash
cd frontend
npm ci
npm start
```

### 3. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## 📞 Support & Docs
- See `/docs` for technical, business, and deployment documentation
- Contact the team for partnership, technical, or business inquiries

---

**ApprobMed – Making German medical licensing accessible, efficient, and modern for Romanian doctors and beyond.**
