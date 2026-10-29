import { Link, useParams } from 'react-router-dom';
import { serviceById } from '../data/directory';
import { Notice } from '../components/ui';

export default function MockPortalPage() {
  const { id = '' } = useParams();
  const svc = serviceById(id);
  const rows: [string, string][] = svc
    ? [
        ['Department', svc.department],
        ['Jurisdiction', svc.jurisdiction],
        ['Submission method', svc.submissionMethod],
        ['You will need', svc.requirements.join('; ')],
      ]
    : [];
  return (
    <div className="container-page max-w-2xl py-10">
      <Notice tone="warn" title="Placeholder — not a government website">
        This page stands in for an official channel whose web address has not been verified for this prototype. In a real deployment JanSeva would link to the verified official portal.
      </Notice>
      <h1 className="mt-6 text-xl font-semibold">{svc ? svc.name : 'Unknown channel'}</h1>
      {svc && (
        <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[150px_1fr] gap-3 py-2">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-6 text-sm text-muted">
        To continue the demo, return to the JanSeva tab and use “Create simulated demo record”, or close this tab.
      </p>
      <Link to="/services" className="link mt-2 inline-block text-sm">
        Browse the services directory
      </Link>
    </div>
  );
}
