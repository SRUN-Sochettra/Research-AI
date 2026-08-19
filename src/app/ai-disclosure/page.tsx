import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
export const metadata: Metadata = { title: "AI & Data Processing Notice" };
export default function AiDisclosurePage() {
  return (
    <LegalPage
      title="AI & Data Processing Notice"
      summary="How SynapseDoc uses generative AI, what is sent to the model provider, and what users must verify themselves."
    >
      <LegalSection title="What AI does">
        <LegalList>
          <li>
            Extracts text from PDFs that lack a usable text layer through an OCR
            fallback.
          </li>
          <li>
            Creates vector embeddings used to retrieve relevant document
            passages.
          </li>
          <li>Generates document summaries and answers to questions.</li>
          <li>
            Reformulates follow-up questions using limited conversation history.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="What may be sent to Google">
        <p>
          Depending on the feature, SynapseDoc may send PDF content, extracted
          text, sampled chunks, retrieved passages, your question, and recent
          conversation context to the Gemini API. Account passwords are not
          intentionally sent. File content may still contain names, contact
          details, confidential information, or other personal data supplied by
          you.
        </p>
      </LegalSection>
      <LegalSection title="Model limitations">
        <LegalList>
          <li>
            Outputs may be wrong, incomplete, fabricated, biased, or
            inconsistent.
          </li>
          <li>
            A citation shows which passage was retrieved; it does not prove the
            generated interpretation is correct.
          </li>
          <li>
            Scanned, image-heavy, damaged, protected, or unusually formatted
            PDFs may process poorly.
          </li>
          <li>
            Model versions, quotas, safety filters, and availability can change.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="Your responsibility">
        <p>
          Review original pages before relying on an answer. Do not use
          SynapseDoc as the sole source for high-impact or professional
          decisions. Do not upload content that you are prohibited from sharing
          with an external AI provider.
        </p>
      </LegalSection>
      <LegalSection title="No training claim">
        <p>
          SynapseDoc itself does not train a model on your documents. Provider
          handling of API data depends on the applicable Google account, billing
          status, region, product terms, and settings. The operator must verify
          the production Gemini plan and its current terms before claiming that
          provider data is never retained or used for improvement.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
