import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  type NdaData,
  type Party,
  ATTRIBUTION,
  STANDARD_TERMS,
  describeConfidentiality,
  describeTerm,
  formatDate,
} from "@/lib/nda";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 56,
    paddingVertical: 54,
    fontSize: 10,
    lineHeight: 1.5,
    fontFamily: "Times-Roman",
    color: "#1a1a1a",
  },
  title: { fontSize: 16, textAlign: "center", fontFamily: "Times-Bold" },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#737373",
    marginTop: 4,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#525252",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
  },
  fieldValue: { marginTop: 2 },
  intro: { marginTop: 16 },
  signatureRow: { flexDirection: "row", gap: 24, marginTop: 12 },
  signatureCol: { flex: 1 },
  signatureHeading: { fontFamily: "Times-Bold", marginBottom: 6 },
  sigTerm: { fontSize: 8, color: "#737373", marginTop: 8 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#737373", minHeight: 12, paddingBottom: 2 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  divider: { borderTopWidth: 1, borderTopColor: "#cccccc", marginVertical: 24 },
  term: { marginBottom: 8, textAlign: "justify" },
  termHeading: { fontFamily: "Times-Bold" },
  attribution: { fontSize: 8, color: "#737373", marginTop: 24 },
});

function fieldValue(text: string, placeholder: string) {
  const trimmed = text.trim();
  return trimmed || `[${placeholder}]`;
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{children}</Text>
    </View>
  );
}

function SignatureBlock({ label, party }: { label: string; party: Party }) {
  const rows: [string, string][] = [
    ["Company", party.company],
    ["Signature", ""],
    ["Print Name", party.name],
    ["Title", party.title],
    ["Notice Address", party.noticeAddress],
    ["Date", ""],
  ];
  return (
    <View style={styles.signatureCol}>
      <Text style={styles.signatureHeading}>{label}</Text>
      {rows.map(([term, value]) => (
        <View key={term}>
          <Text style={styles.sigTerm}>{term}</Text>
          <Text style={styles.sigLine}>{value.trim()}</Text>
        </View>
      ))}
    </View>
  );
}

export function NdaDocument({ data }: { data: NdaData }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" author="PreLegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.subtitle}>Cover Page</Text>

        <Field label="Purpose">{fieldValue(data.purpose, "Purpose")}</Field>
        <Field label="Effective Date">{formatDate(data.effectiveDate)}</Field>
        <Field label="MNDA Term">{describeTerm(data)}</Field>
        <Field label="Term of Confidentiality">
          {describeConfidentiality(data)}
        </Field>
        <Field label="Governing Law">
          {fieldValue(data.governingLaw, "Fill in state")}
        </Field>
        <Field label="Jurisdiction">
          {fieldValue(data.jurisdiction, "Fill in city/county and state")}
        </Field>
        {data.modifications.trim() ? (
          <Field label="MNDA Modifications">{data.modifications.trim()}</Field>
        ) : null}

        <Text style={styles.intro}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>

        <View style={styles.signatureRow}>
          <SignatureBlock label="Party 1" party={data.party1} />
          <SignatureBlock label="Party 2" party={data.party2} />
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Standard Terms</Text>
        {STANDARD_TERMS.map((term) => (
          <Text key={term.heading} style={styles.term}>
            <Text style={styles.termHeading}>{term.heading}. </Text>
            {term.body}
          </Text>
        ))}
        <Text style={styles.attribution}>{ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}
