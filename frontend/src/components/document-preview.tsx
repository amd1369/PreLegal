"use client";

import {
  type DocumentData,
  type DocumentDef,
  type Party,
  filledFields,
  signatureParties,
} from "@/lib/document";
import { DraftDisclaimer } from "@/components/draft-disclaimer";

interface DocumentPreviewProps {
  def: DocumentDef | null;
  data: DocumentData;
}

export function DocumentPreview({ def, data }: DocumentPreviewProps) {
  if (!def) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[816px] items-center justify-center rounded bg-white p-12 text-center shadow-sm ring-1 ring-neutral-200">
        <p className="max-w-sm text-sm text-neutral-400">
          Your document will appear here. Tell the assistant what kind of
          agreement you want to create, and the preview fills in as you go.
        </p>
      </div>
    );
  }

  const fields = filledFields(def, data);
  const parties = signatureParties(def, data);

  return (
    <div className="mx-auto max-w-[816px] space-y-3">
      <DraftDisclaimer variant="inline" />
      <article className="bg-white px-12 py-14 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200">
      <h1 className="text-center text-xl font-bold">{def.title}</h1>
      <p className="mt-2 text-center text-xs text-neutral-500">Cover Page</p>

      <section className="mt-8 space-y-4">
        {fields.length ? (
          fields.map((field) => (
            <Row key={field.key} label={field.key}>
              {field.value.trim()}
            </Row>
          ))
        ) : (
          <p className="text-neutral-400">
            [The cover-page terms will appear here as you provide them.]
          </p>
        )}
      </section>

      <p className="mt-8 text-[13px]">
        By signing this Cover Page, each party agrees to enter into this
        agreement as of the Effective Date.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-8">
        {parties.map((party, i) => (
          <SignatureBlock key={i} party={party} />
        ))}
      </div>

      <hr className="my-10 border-neutral-300" />

      <h2 className="text-center text-lg font-bold">Standard Terms</h2>
      <div className="mt-6 space-y-3 text-justify">
        {def.sections.map((section, i) => (
          <p
            key={i}
            style={{ marginLeft: section.indent * 18 }}
            className={section.indent === 0 ? "mt-4" : ""}
          >
            {section.heading && (
              <span className="font-semibold">{section.heading}. </span>
            )}
            {section.body}
          </p>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-neutral-500">{def.attribution}</p>
      </article>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

function SignatureBlock({ party }: { party: Party }) {
  return (
    <div className="text-[12px]">
      <p className="font-semibold">{party.role}</p>
      <dl className="mt-3 space-y-3">
        <SignatureRow term="Company" value={party.company} />
        <SignatureRow term="Signature" value="" />
        <SignatureRow term="Print Name" value={party.name} />
        <SignatureRow term="Title" value={party.title} />
        <SignatureRow term="Notice Address" value={party.noticeAddress} />
        <SignatureRow term="Date" value="" />
      </dl>
    </div>
  );
}

function SignatureRow({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-neutral-500">{term}</span>
      <div className="mt-0.5 min-h-5 border-b border-neutral-400 pb-0.5">
        {value.trim()}
      </div>
    </div>
  );
}
