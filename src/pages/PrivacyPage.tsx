import { PageHeader } from '../components/ui';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What this prototype collects',
    body: [
      'The description of your problem, the locality, an optional landmark, optional coordinates and the date you noticed it.',
      'Reference numbers you choose to record, follow-up notes and your confirmation or dispute of a resolution.',
      'This information is kept in your browser’s local storage so the demo survives a page refresh. It is not sent to any server.',
    ],
  },
  {
    title: 'Why location is needed',
    body: [
      'Responsibility for civic services depends on where the problem is. The locality decides which department and which official channel apply, and a precise landmark helps the field team find the spot.',
      'The public dashboard only ever shows locations at locality and landmark level.',
    ],
  },
  {
    title: 'Contact details are never shown publicly',
    body: [
      'JanSeva does not ask for your name, phone number or address. You provide contact details directly to the official portal when you submit.',
      'Aggregated statistics contain no complainant information.',
    ],
  },
  {
    title: 'Photos and evidence',
    body: [
      'Photos you attach are previewed from your device and are not uploaded anywhere in this prototype. Previews are discarded when you reload the page.',
    ],
  },
  {
    title: 'What we never ask for',
    body: [
      'Aadhaar numbers, bank or card details, passwords or one-time codes. If you type something that looks like an Aadhaar number, the form asks you to remove it.',
    ],
  },
  {
    title: 'What this prototype does not do',
    body: [
      'It does not submit complaints to any government system, and it does not receive updates from government portals. Records labelled “Official portal (sample)” are sample data. Records labelled “Simulated demo” were created by the demo path.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader title="Privacy notice" lead="How this prototype handles the information you enter." />
      <div className="container-page max-w-3xl py-8">
        <div className="space-y-7">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="section-title">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-1.5 text-sm leading-relaxed text-ink/90">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
