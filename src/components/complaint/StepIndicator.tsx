const STEPS = ['Edit details', 'Review', 'Submission guidance'];

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex text-xs" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? 'step' : undefined}
          className={`border-b-2 px-3 py-1.5 ${
            i === current ? 'border-accent font-semibold text-accent' : i < current ? 'border-ok text-ink' : 'border-line text-muted'
          }`}
        >
          <span className="tnum">{i + 1}.</span> {s}
        </li>
      ))}
    </ol>
  );
}
