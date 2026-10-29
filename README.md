# JanSeva AI — frontend prototype

A frontend-only prototype of a unified government services and public grievance platform for India. A citizen describes a problem in plain English or Hindi; JanSeva identifies the likely category and responsible department, finds the official channel, prepares a structured complaint, and helps track it afterwards. A public dashboard shows aggregated (sample) grievance outcomes by locality and department.

> **Prototype notice.** This is not a government website. It does not submit complaints anywhere. All complaint records, officials and statistics are sample data. The "assistant" uses deterministic keyword rules, not a trained AI model.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. No backend, API keys or accounts are needed.

Production build: `npm run build`, then `npm run preview`.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide icons (functional icons only). Demo state is kept in React context and saved to `localStorage`.

## Pages

| Route | Purpose |
|---|---|
| `/` | Citizen home: problem input, common issues, recent complaints, area metrics |
| `/assistant` | Grievance assistant: chat on the left, live structured summary on the right |
| `/complaint/new` | Edit → review → submission guidance → demo record or recorded reference |
| `/complaints` | My Complaints: search, filter by category/status, sort by date |
| `/complaints/:id` | Timeline, follow-ups, confirm/dispute resolution, demo status simulation |
| `/public-dashboard` | Public grievance and service accountability dashboard |
| `/authorities` | Public authority directory with locality-based responsibility lookup |
| `/services` | Government services and portals directory |
| `/privacy`, `/demo` | Privacy notice; demo settings and reset |

## First complaint guide

First-time visitors are offered a step-by-step guide on the home page (also available from the account menu, mobile menu, footer and Demo settings). A panel docked at the bottom-right (bottom of the screen on phones) follows the visitor through seven steps — describe the problem, answer the assistant, open the review, check details, confirm, submit on the official channel, track — and outlines the control to use at each step. It advances automatically as the visitor moves through the flow, offers "Continue where I left off" if they wander to another page, can be collapsed or exited, and is available in English and Hindi. Pages report their position with `useGuideCheckpoint()` (`src/state/guide.tsx`); targets are marked with `data-guide` attributes.

## Project structure

Full details of the stack, data model, state, assistant logic and metrics are in [ARCHITECTURE.md](ARCHITECTURE.md).

```
src/
  data/         typed reference data, directory, seed complaints, synthetic public dataset
  lib/          intent rules, assistant state machine, metrics, validation, formatting
  state/        store (complaints + draft) and language context
  components/   layout, status labels, assistant, complaint form, dashboard charts
  pages/        one file per route
```

## Data and honesty rules

- **Status sources are always labelled**: *Official portal (sample)*, *Reported by you*, *Simulated demo*.
- **"Resolved" is never treated as citizen-confirmed.** Citizen verification is tracked separately.
- **Complaints ≠ incidents.** The public dataset groups duplicate reports into incidents without deleting them.
- **Missing data is not zero.** The median resolution time excludes records without a resolution date and shows how many were excluded.
- **URLs**: entries marked *Official domain* are government domains that responded when checked on 29 Oct 2026 (pgportal.gov.in, cmharyanacell.nic.in, haryanapolice.gov.in, echallan.parivahan.gov.in, dhbvn.org.in, esanjeevani.mohfw.gov.in, saralharyana.gov.in, india.gov.in). Entries marked *Mock link* open an in-app placeholder page and must be replaced with verified links before real use.
- **Officials are fictional.** Names are "Sample Officer A" etc.; emails use the reserved `example.org` domain.
- **Locality names are real Faridabad areas; ward numbers, PIN assignments, landmarks and jurisdiction rules are illustrative.**

## Demonstrating to judges (about 5 minutes)

Before each session: **Demo settings → Reset demo data** (account menu, top right, or footer).

1. **Home.** Point out the single input and the area metrics. Type
   `There is a large pothole near Sector 15 market in Faridabad.` and select **Find the right service**.
2. **Assistant.** The assistant shows the likely category and *why* (matched terms), the responsible department and *why* (sample jurisdiction rule), and the suggested channel. Answer the follow-ups: add a landmark (e.g. `opposite the bank ATM`), attach any image or **Skip for now**, pick a date. The right-hand summary updates live and every field can be corrected there.
   - Show the jurisdiction logic: change the locality in the summary to *Greater Faridabad (Sector 86)* and the department switches to the development authority.
   - Toggle **हिंदी** and try a Hindi example, e.g. `बल्लभगढ़ बस स्टैंड के पास स्ट्रीट लाइट खराब है।`
3. **Review complaint.** Edit the title or text; try clearing the PIN to see validation. **Continue to review** → **Looks correct — show submission steps**.
4. **Submission guidance.** Note that JanSeva does not submit on the citizen's behalf. Show **Continue to official portal**, then choose **Create simulated demo record** — note the "Demo record — not submitted to government" notice.
5. **My Complaints.** The new record appears at the top with source *Simulated demo*. Open it; select **Simulate next update** until *Resolved*. Point out that citizen verification is still *Awaiting your confirmation*. Choose **Dispute the resolution** — the status becomes *Reopened*. **Undo this update** reverses it.
6. **Public Dashboard.** Walk through the six metrics and their definitions. Select a bar in *Complaints by category* and a locality in the comparison table — every figure updates. Point out recurring problems, the department response table's neutral framing, and the data-source/limitations section.
7. **Authorities and Services.** Choose a locality to see which office handles each problem type; search the services catalogue and expand an entry to show requirements and verification status.

## Known limitations

- Keyword rules cover common phrasings only; unrecognised text falls back to asking the user to choose a category.
- Some assistant explanations (jurisdiction reasons) and the complaint form labels are English-only; navigation, main labels, assistant prompts and complaint text support Hindi.
- Photo previews are not persisted across reloads by Design.
