// Generic data model for any Common Paper agreement (PL-6).
//
// Replaces the NDA-specific model: a document is a chosen type plus a dynamic
// list of cover-page key-term values and the signing parties. The renderable
// structure of each type (title, fields, sections) is fetched from the backend
// as a DocumentDef — see fetchDocumentDef in lib/api.ts.

export interface Party {
  /** The party's role in the agreement, e.g. "Provider" or "Party 1". */
  role: string;
  company: string;
  name: string;
  title: string;
  /** Email or postal address used for notices. */
  noticeAddress: string;
}

export interface FieldValue {
  key: string;
  value: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** The user's in-progress document — sent to and returned from /api/chat. */
export interface DocumentData {
  documentType: string; // backend template id (filename); "" until chosen
  fields: FieldValue[];
  parties: Party[];
}

export const emptyDocument = (): DocumentData => ({
  documentType: "",
  fields: [],
  parties: [],
});

// --- Definitions fetched from the backend ---------------------------------

export interface DocumentSummary {
  id: string;
  name: string;
  description: string;
}

export interface DocumentField {
  key: string;
}

export interface DocumentSection {
  heading: string;
  body: string;
  indent: number;
}

export interface DocumentDef {
  id: string;
  name: string;
  title: string;
  fields: DocumentField[];
  partyRoles: string[];
  sections: DocumentSection[];
  attribution: string;
}

/**
 * The cover-page rows to show: every key term the user has filled in, ordered
 * by the document's own field order, with any extras appended. Empty terms are
 * omitted so the preview fills in as the conversation progresses.
 */
export function filledFields(def: DocumentDef, data: DocumentData): FieldValue[] {
  const byKey = new Map(data.fields.map((f) => [f.key.toLowerCase(), f]));
  const ordered: FieldValue[] = [];
  const used = new Set<string>();
  for (const field of def.fields) {
    const match = byKey.get(field.key.toLowerCase());
    if (match && match.value.trim()) {
      ordered.push(match);
      used.add(field.key.toLowerCase());
    }
  }
  for (const field of data.fields) {
    if (!used.has(field.key.toLowerCase()) && field.value.trim()) {
      ordered.push(field);
    }
  }
  return ordered;
}

/**
 * The signature blocks to render: one per party the user has named, padded out
 * to the document's expected roles so every signer has a block.
 */
export function signatureParties(def: DocumentDef, data: DocumentData): Party[] {
  const blocks = data.parties.map((p, i) => ({
    ...p,
    role: p.role || def.partyRoles[i] || `Party ${i + 1}`,
  }));
  for (let i = blocks.length; i < def.partyRoles.length; i++) {
    blocks.push({
      role: def.partyRoles[i],
      company: "",
      name: "",
      title: "",
      noticeAddress: "",
    });
  }
  return blocks;
}

/** A human-readable title for a saved draft, e.g. "Cloud Service Agreement — Acme & Globex". */
export function draftTitle(def: DocumentDef | null, data: DocumentData): string {
  const base = def?.title || "Untitled document";
  const companies = data.parties.map((p) => p.company.trim()).filter(Boolean);
  return companies.length ? `${base} — ${companies.join(" & ")}` : base;
}

/** A filesystem-friendly base name for the downloaded PDF. */
export function documentFileName(def: DocumentDef, data: DocumentData): string {
  const slug = (text: string) =>
    text
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");
  const companies = data.parties
    .map((p) => slug(p.company))
    .filter(Boolean)
    .slice(0, 2);
  const title = slug(def.title) || "Agreement";
  return companies.length
    ? `${companies.join("-and-")}-${title}.pdf`
    : `${title}.pdf`;
}
