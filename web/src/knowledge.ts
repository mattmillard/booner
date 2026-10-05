// Pins are the hunter's private notes. The planner and the analyst ignore them unless he marks one as knowledge
// (docs/brain/field-knowledge.md L6): "#133 is a real bedding area", "#144 I kill cruising bucks here every day".
import type { UserFeature } from './api';

export type KnowledgeKind = 'bedding' | 'travel' | 'kill' | 'sign' | 'food' | 'avoid' | 'note';
export type Knowledge = { kind: KnowledgeKind; note: string; at: string };

export const KNOWLEDGE_KINDS: [KnowledgeKind, string][] = [
  ['kill', 'Proven kill / buck spot'], ['bedding', 'Real bedding area'], ['travel', 'Real travel route / crossing'],
  ['sign', 'Real sign (scrapes, rubs)'], ['food', 'Real food source'], ['avoid', 'Avoid (bumps deer, pressure)'], ['note', 'Just a note for the analyst'],
];

// Best-guess kind from the hunter's words; he can change it.
export function guessKind(text: string): KnowledgeKind {
  const t = text.toLowerCase();
  if (/\b(avoid|never|don.?t|bust|bump|pressure|no good)\b/.test(t)) return 'avoid';
  if (/(kill|killed|shot|cruis|every day|money|proven|big buck|mature)/.test(t)) return 'kill';
  if (/bed/.test(t)) return 'bedding';
  if (/(trail|travel|path|crossing|funnel|pinch|runway)/.test(t)) return 'travel';
  if (/(scrape|rub|sign|licking)/.test(t)) return 'sign';
  if (/(food|feed|bean|corn|acorn|oak|plot|clover|wheat)/.test(t)) return 'food';
  return 'note';
}

export const knowledgeOf = (f: UserFeature): Knowledge | null => f.properties.props?.knowledge ?? null;
export const label = (f: UserFeature) => `#${f.properties.num}`;
