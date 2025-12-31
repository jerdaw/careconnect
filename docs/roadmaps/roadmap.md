# Kingston Care Connect: Current Roadmap & Status

> **Current Version**: v6.0.0 (Scale & Security Complete)
> **Last Updated**: 2025-12-31
> **Status**: Production-Ready / Maintenance

---

## 🛰️ Current State

The platform has successfully completed **Roadmap V6**. It is now a fully bilingual, PWA-enabled service directory with AI-powered semantic search and automated data validation.

### Completed Milestones

- **Phase 8-10**: Hardened infrastructure, bilingual parity, and comprehensive test coverage.

* **Phase 11**: Automated URL and Phone verification bots with GitHub Action integration.
* **Phase 12**: Partner Dashboard for self-service listing management and team RBAC.

---

## 🛠️ Immediate User Action Items

These steps are required to activate the newly implemented features in your production environment.

### 1. Database Migrations

Please execute the following SQL migration files in your **Supabase SQL Editor**:

- [ ] [v6_prerequisites.sql](file:///home/jer/kingston-care-connect/supabase/migrations/002_v6_prerequisites.sql) - Sets up push notifications, submissions, and member tables.
- [ ] [org_members.sql](file:///home/jer/kingston-care-connect/supabase/migrations/003_org_members.sql) - Configures team roles and RLS policies.

### 2. Environment Variables

Add these keys to your `.env.local` and your production hosting platform (e.g., Vercel):

| Feature                | Variable                       | Source                                          |
| :--------------------- | :----------------------------- | :---------------------------------------------- |
| **Push Notifications** | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate via `npx web-push generate-vapid-keys` |
|                        | `VAPID_PRIVATE_KEY`            | Generate via `npx web-push generate-vapid-keys` |
| **Phone Validation**   | `TWILIO_ACCOUNT_SID`           | Twilio Console                                  |
|                        | `TWILIO_AUTH_TOKEN`            | Twilio Console                                  |

### 3. GitHub Secrets

For the **Monthly Health Check** automation to work fully, go to `Settings > Secrets and variables > Actions` in your GitHub repo and add:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY` (Required for updating the database from the bot)

---

## 🔮 Future Roadmap (V7: Community & Insights)

The following items are recommended for the next development cycle:

### Phase 13: Moderation & Governance

- [ ] **ModReview Workflow**: Build the admin UI to approve/reject partner edits before they go live.
- [ ] **Public Flagging**: Allow users to "Suggest an Edit" or "Flag as Incorrect" directly from service pages.

### Phase 14: Advanced Analytics

- [ ] **Unmet Need Heatmaps**: Visualize where searches are failing geographic or category-wise.
- [ ] **Exportable Reports**: allow partners to download PDF/CSV summaries of their listing's performance.

### Phase 15: Infrastructure Scaling

- [ ] **Edge Data Caching**: Move service data to the edge for <50ms response times globally.
- [ ] **Image Optimization**: Implement a dedicated image pipeline for partner-uploaded logos and photos.

---

_For a historical view of past implementation details, see its [Archived Roadmap](file:///home/jer/kingston-care-connect/docs/roadmaps/archive/v6-scale-security.md)._
