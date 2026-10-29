import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetDemoData, useStore } from '../state/store';
import { useLang } from '../state/i18n';
import { SEED_COMPLAINTS } from '../data/complaints';
import { Notice, PageHeader } from '../components/ui';
import { useStartGuide } from '../state/guide';

export default function DemoSettingsPage() {
  const { complaints, dispatch } = useStore();
  const { lang, setLang } = useLang();
  const [done, setDone] = useState(false);
  const startGuide = useStartGuide();
  const demoCount = complaints.filter((c) => c.isDemo).length;
  const userCount = complaints.filter((c) => !c.isDemo && c.id.startsWith('u')).length;

  return (
    <div>
      <PageHeader title="Demo settings" lead="Controls for presenting the prototype." />
      <div className="container-page max-w-3xl space-y-8 py-8">
        {done && (
          <Notice tone="ok" title="Demo data reset">
            All records are back to the original sample set.
          </Notice>
        )}

        <section>
          <h2 className="section-title">Stored in this browser</h2>
          <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted">Complaints in My Complaints</dt>
              <dd className="tnum">{complaints.length}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Simulated demo records you created</dt>
              <dd className="tnum">{demoCount}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Records with a reference number you entered</dt>
              <dd className="tnum">{userCount}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-muted">Interface language</dt>
              <dd>
                <select aria-label="Interface language" className="input py-1" value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'hi')}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="section-title">Reset demo data</h2>
          <p className="mt-1 text-sm text-muted">
            Removes every record, follow-up and dispute you added, clears the saved complaint draft, and restores the {SEED_COMPLAINTS.length} sample complaints. Use this between judging sessions.
          </p>
          <button
            className="btn-danger mt-3"
            onClick={() => {
              if (window.confirm('Reset all demo data in this browser?')) {
                resetDemoData(dispatch);
                setDone(true);
              }
            }}
          >
            Reset demo data
          </button>
        </section>

        <section>
          <h2 className="section-title">In-app guide</h2>
          <p className="mt-1 text-sm text-muted">
            A step-by-step panel that follows the visitor through registering a first complaint and highlights the control to use at each step. It is offered on the home page to first-time visitors.
          </p>
          <button className="btn-secondary mt-3" onClick={startGuide}>Start the first complaint guide</button>
        </section>

        <section>
          <h2 className="section-title">Suggested judge walkthrough</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            <li>On <Link to="/" className="link">Home</Link>, type: “There is a large pothole near Sector 15 market in Faridabad.”</li>
            <li>In the assistant, read the category and department explanations; give a landmark, attach or skip a photo, and pick a date.</li>
            <li>Select <strong>Review complaint</strong>, edit any field, continue to review, then to submission guidance.</li>
            <li>Choose <strong>Create simulated demo record</strong>.</li>
            <li>Open the record from <Link to="/complaints" className="link">My Complaints</Link>; use <strong>Simulate next update</strong> until Resolved, then dispute it.</li>
            <li>Explore the <Link to="/public-dashboard" className="link">Public Dashboard</Link>: select a category bar and a locality.</li>
            <li>Finish with <Link to="/authorities" className="link">Authorities</Link> and <Link to="/services" className="link">Services</Link>.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
