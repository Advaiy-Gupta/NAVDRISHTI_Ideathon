import type { ChatMessage, ChatOption } from '../../lib/assistantEngine';

export default function ChatBubble({
  message,
  onOption,
  active,
}: {
  message: ChatMessage;
  onOption: (o: ChatOption) => void;
  active: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-white">
          {message.photoUrl && (
            <img src={message.photoUrl} alt="Attached evidence" className="mb-2 max-h-40 rounded-sm border border-white/30 object-cover" />
          )}
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[92%]">
      <div className="mb-1 text-xs font-medium text-muted">JanSeva assistant</div>
      <div className="border-l-2 border-accent bg-canvas px-3.5 py-2.5 text-sm leading-relaxed">
        {message.heading && <div className="mb-0.5 font-semibold">{message.heading}</div>}
        {message.text}
      </div>
      {message.options && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.options.map((o) => (
            <button
              key={o.kind + o.value}
              onClick={() => onOption(o)}
              disabled={!active}
              className={
                o.kind === 'review'
                  ? 'btn-primary py-1.5'
                  : 'rounded border border-line bg-surface px-3 py-2.5 text-sm hover:border-accent sm:py-1.5 hover:text-accent disabled:cursor-default disabled:opacity-50 disabled:hover:border-line disabled:hover:text-ink'
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
