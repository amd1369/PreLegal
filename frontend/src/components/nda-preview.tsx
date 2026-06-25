"use client";

import {
  type NdaData,
  ATTRIBUTION,
  STANDARD_TERMS,
  describeConfidentiality,
  describeTerm,
  formatDate,
} from "@/lib/nda";

interface NdaPreviewProps {
  data: NdaData;
}

/** A placeholder shown in the preview when a field has not been filled in yet. */
function value(text: string, placeholder: string) {
  const trimmed = text.trim();
  return trimmed ? (
    <span>{trimmed}</span>
  ) : (
    <span className="text-neutral-400">[{placeholder}]</span>
  );
}

export function NdaPreview({ data }: NdaPreviewProps) {
  return (
    <article className="mx-auto max-w-[816px] bg-white px-12 py-14 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200">
      <h1 className="text-center text-xl font-bold">
        Mutual Non-Disclosure Agreement
      </h1>
      <p className="mt-2 text-center text-xs text-neutral-500">Cover Page</p>

      <section className="mt-8 space-y-4">
        <Row label="Purpose">{value(data.purpose, "Purpose")}</Row>
        <Row label="Effective Date">{formatDate(data.effectiveDate)}</Row>
        <Row label="MNDA Term">{describeTerm(data)}</Row>
        <Row label="Term of Confidentiality">{describeConfidentiality(data)}</Row>
        <Row label="Governing Law">{value(data.governingLaw, "Fill in state")}</Row>
        <Row label="Jurisdiction">
          {value(data.jurisdiction, "Fill in city/county and state")}
        </Row>
        {data.modifications.trim() && (
          <Row label="MNDA Modifications">{data.modifications.trim()}</Row>
        )}
      </section>

      <p className="mt-8 text-[13px]">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <SignatureBlock label="Party 1" data={data} party="party1" />
        <SignatureBlock label="Party 2" data={data} party="party2" />
      </div>

      <hr className="my-10 border-neutral-300" />

      <h2 className="text-center text-lg font-bold">Standard Terms</h2>
      <div className="mt-6 space-y-4 text-justify">
        {STANDARD_TERMS.map((term) => (
          <p key={term.heading}>
            <span className="font-semibold">
              {term.heading.replace(/^(\d+)\.\s/, "$1. ")}.
            </span>{" "}
            {term.body}
          </p>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-neutral-500">{ATTRIBUTION}</p>
    </article>
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

function SignatureBlock({
  label,
  data,
  party,
}: {
  label: string;
  data: NdaData;
  party: "party1" | "party2";
}) {
  const p = data[party];
  return (
    <div className="text-[12px]">
      <p className="font-semibold">{label}</p>
      <dl className="mt-3 space-y-3">
        <SignatureRow term="Company" value={p.company} />
        <SignatureRow term="Signature" value="" />
        <SignatureRow term="Print Name" value={p.name} />
        <SignatureRow term="Title" value={p.title} />
        <SignatureRow term="Notice Address" value={p.noticeAddress} />
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
