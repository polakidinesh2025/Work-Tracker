import type { TeamMember } from '../types/models';

/** @mention parsing shared by the comment composer, comment stream and blocker prompt. */

export interface MentionQuery {
  /** Index of the "@" in the text. */
  start: number;
  query: string;
}

/** The "@partial" being typed just before the caret, if any. */
export function getMentionQuery(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;
  // "@" must start a word, and the query can't span lines or run long
  if (at > 0 && !/\s/.test(before[at - 1])) return null;
  const query = before.slice(at + 1);
  if (query.length > 30 || /[\n@]/.test(query) || /\s{2}/.test(query)) return null;
  return { start: at, query };
}

/** Members whose name or email starts with (or contains) the query, best matches first. */
export function filterMembers(members: TeamMember[], query: string, excludeEmail?: string): TeamMember[] {
  const q = query.trim().toLowerCase();
  return members
    .filter((m) => m.email !== excludeEmail)
    .map((m) => {
      const name = m.name.toLowerCase();
      const score = !q ? 1 : name.startsWith(q) || m.email.startsWith(q) ? 0 : name.includes(q) ? 1 : -1;
      return { m, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name))
    .slice(0, 6)
    .map((x) => x.m);
}

/** Replaces "@partial" with "@Full Name " and returns the new text and caret. */
export function insertMention(text: string, mention: MentionQuery, caret: number, member: TeamMember) {
  const inserted = `@${member.name} `;
  return {
    text: text.slice(0, mention.start) + inserted + text.slice(caret),
    caret: mention.start + inserted.length
  };
}

/** Longest names first so "@Ananya Rao" wins over a member named "Ananya". */
const byNameLength = (members: TeamMember[]) =>
  [...members].filter((m) => m.name).sort((a, b) => b.name.length - a.name.length);

/** Emails of every member mentioned as "@Name" in the text. */
export function extractMentionEmails(text: string, members: TeamMember[]): string[] {
  const found = new Set<string>();
  let rest = text;
  for (const m of byNameLength(members)) {
    const token = `@${m.name}`;
    if (rest.includes(token)) {
      found.add(m.email);
      rest = rest.split(token).join(' ');
    }
  }
  return [...found];
}

export type Segment = { text: string } | { mention: TeamMember };

/** Splits comment text into plain text and @mention segments for highlighting. */
export function toSegments(text: string, members: TeamMember[]): Segment[] {
  const sorted = byNameLength(members);
  const segments: Segment[] = [];
  let buffer = '';
  let i = 0;

  while (i < text.length) {
    const atWordStart = text[i] === '@' && (i === 0 || /\s/.test(text[i - 1]));
    const member = atWordStart ? sorted.find((m) => text.startsWith(`@${m.name}`, i)) : undefined;
    if (member) {
      if (buffer) segments.push({ text: buffer });
      segments.push({ mention: member });
      buffer = '';
      i += member.name.length + 1;
    } else {
      buffer += text[i];
      i += 1;
    }
  }
  if (buffer) segments.push({ text: buffer });
  return segments;
}
