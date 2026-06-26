import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  type DocumentData,
  type DocumentDef,
  type Party,
  filledFields,
  signatureParties,
} from "@/lib/document";

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
  placeholder: { marginTop: 10, color: "#a3a3a3" },
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
  term: { marginBottom: 6, textAlign: "justify" },
  termHeading: { fontFamily: "Times-Bold" },
  attribution: { fontSize: 8, color: "#737373", marginTop: 24 },
});

function Field({ label, children }: { label: string; children: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{children}</Text>
    </View>
  );
}

function SignatureBlock({ party }: { party: Party }) {
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
      <Text style={styles.signatureHeading}>{party.role}</Text>
      {rows.map(([term, value]) => (
        <View key={term}>
          <Text style={styles.sigTerm}>{term}</Text>
          <Text style={styles.sigLine}>{value.trim()}</Text>
        </View>
      ))}
    </View>
  );
}

export function DocumentPdf({
  def,
  data,
}: {
  def: DocumentDef;
  data: DocumentData;
}) {
  const fields = filledFields(def, data);
  const parties = signatureParties(def, data);

  return (
    <Document title={def.title} author="PreLegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{def.title}</Text>
        <Text style={styles.subtitle}>Cover Page</Text>

        {fields.length ? (
          fields.map((field) => (
            <Field key={field.key} label={field.key}>
              {field.value.trim()}
            </Field>
          ))
        ) : (
          <Text style={styles.placeholder}>
            [The cover-page terms will appear here as you provide them.]
          </Text>
        )}

        <Text style={styles.intro}>
          By signing this Cover Page, each party agrees to enter into this
          agreement as of the Effective Date.
        </Text>

        <View style={styles.signatureRow}>
          {parties.map((party, i) => (
            <SignatureBlock key={i} party={party} />
          ))}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Standard Terms</Text>
        {def.sections.map((section, i) => (
          <Text
            key={i}
            style={[styles.term, { marginLeft: section.indent * 14 }]}
          >
            {section.heading ? (
              <Text style={styles.termHeading}>{section.heading}. </Text>
            ) : null}
            {section.body}
          </Text>
        ))}
        <Text style={styles.attribution}>{def.attribution}</Text>
      </Page>
    </Document>
  );
}
