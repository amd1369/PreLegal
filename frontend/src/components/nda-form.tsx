"use client";

import type { NdaData, Party } from "@/lib/nda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface NdaFormProps {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

export function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (key: "party1" | "party2", field: keyof Party, value: string) =>
    onChange({ ...data, [key]: { ...data[key], [field]: value } });

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement Details">
        <Field label="Purpose" hint="How Confidential Information may be used">
          <Textarea
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            rows={3}
          />
        </Field>

        <Field label="Effective Date">
          <Input
            type="date"
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <Field label="MNDA Term" hint="The length of this MNDA">
          <RadioGroup
            value={data.termType}
            onValueChange={(value) => set("termType", value as NdaData["termType"])}
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="expires" />
              <span className="flex items-center gap-2">
                Expires
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-16"
                  value={data.termYears}
                  disabled={data.termType !== "expires"}
                  onChange={(e) => set("termYears", Number(e.target.value) || 1)}
                />
                year(s) from Effective Date
              </span>
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="untilTerminated" />
              Continues until terminated under the MNDA
            </Label>
          </RadioGroup>
        </Field>

        <Field
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
        >
          <RadioGroup
            value={data.confidentialityType}
            onValueChange={(value) =>
              set("confidentialityType", value as NdaData["confidentialityType"])
            }
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="years" />
              <span className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-16"
                  value={data.confidentialityYears}
                  disabled={data.confidentialityType !== "years"}
                  onChange={(e) =>
                    set("confidentialityYears", Number(e.target.value) || 1)
                  }
                />
                year(s) from Effective Date (trade secrets excepted)
              </span>
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="perpetuity" />
              In perpetuity
            </Label>
          </RadioGroup>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Governing Law" hint="U.S. state">
            <Input
              placeholder="Delaware"
              value={data.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
            />
          </Field>
          <Field label="Jurisdiction" hint="City/county and state">
            <Input
              placeholder="New Castle, DE"
              value={data.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
            />
          </Field>
        </div>

        <Field label="MNDA Modifications" hint="Optional — any changes to the Standard Terms">
          <Textarea
            value={data.modifications}
            onChange={(e) => set("modifications", e.target.value)}
            rows={2}
            placeholder="None"
          />
        </Field>
      </Section>

      <PartyFields
        title="Party 1"
        party={data.party1}
        onChange={(field, value) => setParty("party1", field, value)}
      />
      <PartyFields
        title="Party 2"
        party={data.party2}
        onChange={(field, value) => setParty("party2", field, value)}
      />
    </form>
  );
}

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: Party;
  onChange: (field: keyof Party, value: string) => void;
}) {
  return (
    <Section title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <Input
            value={party.company}
            onChange={(e) => onChange("company", e.target.value)}
          />
        </Field>
        <Field label="Signatory Name">
          <Input value={party.name} onChange={(e) => onChange("name", e.target.value)} />
        </Field>
        <Field label="Title">
          <Input value={party.title} onChange={(e) => onChange("title", e.target.value)} />
        </Field>
        <Field label="Notice Address" hint="Email or postal address">
          <Input
            value={party.noticeAddress}
            onChange={(e) => onChange("noticeAddress", e.target.value)}
          />
        </Field>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-semibold text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
