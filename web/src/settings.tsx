// Settings: tell the app which pins are real knowledge ("#133 is a real bedding area"). Unmarked pins stay private
// notes that the planner and analyst ignore (field-knowledge L6).
import { useState } from 'react';
import type { UserFeature } from './api';
import { guessKind, KNOWLEDGE_KINDS, knowledgeOf, type Knowledge } from './knowledge';

type Save = (f: UserFeature, knowledge: Knowledge | undefined) => Promise<void>;

export function SettingsPanel({ features, onKnowledge, onSelect }: { features: UserFeature[]; onKnowledge: Save; onSelect: (f: UserFeature) => void }) {
  const [cmd, setCmd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const marked = features.filter(knowledgeOf).sort((a, b) => a.properties.num - b.properties.num);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = cmd.trim().match(/^#?(\d+)\s*[:,-]?\s*(.+)$/s);
    if (!m) return setMsg('Start with the pin number, e.g. "#13 is a real bedding area".');
    const f = features.find((x) => x.properties.num === Number(m[1]));
    if (!f) return setMsg(`No pin #${m[1]}.`);
    const note = m[2].trim();
    await onKnowledge(f, { kind: guessKind(note), note, at: new Date().toISOString() });
    setMsg(`#${m[1]} ${f.properties.name ? `(${f.properties.name}) ` : ''}saved as knowledge. Check the type below.`);
    setCmd('');
  }

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>
      <h3>Pins the app may learn from</h3>
      <p className="muted">
        Your pins are private notes. The planner and analyst ignore them unless you mark one here or in the pin
        editor. Parking and gate pins are still used as walk-in starting points.
      </p>
      <form onSubmit={submit}>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder='#13 is a real bedding area' />
        <button type="submit" disabled={!cmd.trim()}>Tell the app</button>
      </form>
      {msg && <p className="muted">{msg}</p>}
      {!marked.length && <p className="muted">No pins marked yet.</p>}
      {marked.map((f) => {
        const k = knowledgeOf(f)!;
        return (
          <div key={f.id} className="kn">
            <b><button className="link" onClick={() => onSelect(f)}>#{f.properties.num}</button></b>
            <div className="grow">
              <div>{f.properties.name || f.properties.icon || f.properties.kind}</div>
              <select value={k.kind} onChange={(e) => onKnowledge(f, { ...k, kind: e.target.value as Knowledge['kind'] })}>
                {KNOWLEDGE_KINDS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
              </select>
              <div className="muted">"{k.note}"</div>
            </div>
            <button className="link" onClick={() => onKnowledge(f, undefined)} aria-label="Forget">Forget</button>
          </div>
        );
      })}
    </div>
  );
}
