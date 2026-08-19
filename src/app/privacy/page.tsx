import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalContact,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="What SynapseDoc collects, why it is processed, which providers are involved, and the controls available to you."
    >
      <LegalSection title="1. Scope and operator">
        <p>
          This policy applies to SynapseDoc. The service is operated by
          Sochettra Srun. Privacy questions and requests may be sent to{" "}
          <LegalContact />.
        </p>
      </LegalSection>
      <LegalSection title="2. Information we process">
        <LegalList>
          <li>
            <strong className="text-foreground">Account data:</strong> email
            address, display name, authentication identifiers, and profile
            information supplied through email/password or Google sign-in.
          </li>
          <li>
            <strong className="text-foreground">Uploaded content:</strong> PDFs,
            file names, sizes, metadata, extracted text, page references,
            chunks, vector embeddings, and generated summaries.
          </li>
          <li>
            <strong className="text-foreground">Conversation data:</strong>{" "}
            questions, generated answers, citations, conversation titles,
            token-usage metadata, and timestamps.
          </li>
          <li>
            <strong className="text-foreground">
              Technical and security data:
            </strong>{" "}
            session cookies, request timing, error details, rate-limit
            identifiers, and limited operational logs needed to secure and
            troubleshoot the service.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="3. Why we process it">
        <LegalList>
          <li>
            Provide authentication, document storage, search, summarization,
            chat, citations, downloads, and account features.
          </li>
          <li>
            Protect users and the service through authorization checks, rate
            limiting, abuse prevention, and debugging.
          </li>
          <li>
            Maintain reliability, understand failures, and comply with legal
            obligations.
          </li>
        </LegalList>
        <p>
          Where applicable law requires a legal basis, processing is generally
          necessary to provide the service you request, based on legitimate
          interests in securing and operating it, based on consent where
          specifically requested, or required by law.
        </p>
      </LegalSection>
      <LegalSection title="4. AI processing">
        <p>
          Document text, relevant retrieved passages, your questions, and
          limited conversation context are transmitted to Google&apos;s Gemini
          API to generate embeddings, summaries, OCR fallback results, and
          answers. Do not upload material you are not authorized to send to an
          external AI provider. Read the{" "}
          <Link className="text-primary underline" href="/ai-disclosure">
            AI &amp; Data Processing Notice
          </Link>{" "}
          for details.
        </p>
      </LegalSection>
      <LegalSection title="5. Service providers">
        <LegalList>
          <li>
            <strong className="text-foreground">Supabase:</strong>{" "}
            authentication, PostgreSQL database, private object storage, and
            related infrastructure.
          </li>
          <li>
            <strong className="text-foreground">Google Gemini API:</strong>{" "}
            embeddings, text generation, summarization, and OCR fallback.
          </li>
          <li>
            <strong className="text-foreground">Vercel:</strong> application
            hosting and server execution.
          </li>
          <li>
            <strong className="text-foreground">Upstash:</strong> rate limiting
            when configured.
          </li>
          <li>
            <strong className="text-foreground">Langfuse:</strong> optional AI
            observability when configured. The repository currently contains a
            no-op LangChain callback; separate Langfuse SDK initialization may
            still create provider-side behavior if enabled and must be verified
            before launch.
          </li>
        </LegalList>
        <p>
          These providers may process data in other countries under their own
          terms and data-protection commitments.
        </p>
      </LegalSection>
      <LegalSection title="6. Storage, retention, and deletion">
        <p>
          Documents and application records remain until you delete the document
          or request account deletion, except where temporary copies, backups,
          security logs, or legal obligations require limited additional
          retention. Deleting a document is intended to remove its stored file
          and database record, with related chunks and single-document
          conversations removed according to database relationships.
        </p>
        <p>
          Multi-document conversation references are stored as an array without
          a database foreign-key cascade. The operator must verify and clean
          orphaned references. Do not promise immediate, complete deletion until
          production database and backup behavior are verified.
        </p>
      </LegalSection>
      <LegalSection title="7. Security">
        <p>
          SynapseDoc uses authenticated sessions, private storage, per-user
          access checks, database row-level-security design, HTTPS in
          production, input validation, and rate limiting when configured. No
          system is perfectly secure, and we cannot guarantee that unauthorized
          access or data loss will never occur.
        </p>
      </LegalSection>
      <LegalSection title="8. Your choices and rights">
        <LegalList>
          <li>Access documents and conversations available in your account.</li>
          <li>
            Delete individual documents and conversations through the product
            where those controls are offered.
          </li>
          <li>
            Request access, correction, export, restriction, objection, or
            deletion by contacting us. Rights vary by location.
          </li>
          <li>Sign out and stop using the service.</li>
        </LegalList>
        <p>
          You may delete your account and associated documents directly in
          Account Settings, or request deletion by contacting us. Automated data
          export is not currently implemented and requests must be handled
          manually upon identity verification.
        </p>
      </LegalSection>
      <LegalSection title="9. Cookies">
        <p>
          SynapseDoc uses essential authentication and session cookies. The
          reviewed code does not show advertising cookies or a marketing
          analytics platform. If non-essential analytics or tracking is later
          added, this policy and any consent controls must be updated before
          deployment.
        </p>
      </LegalSection>
      <LegalSection title="10. Children">
        <p>
          SynapseDoc is not directed to anyone under 18. Do not create an
          account or submit personal data if you are under 18.
        </p>
      </LegalSection>
      <LegalSection title="11. Changes">
        <p>
          We may update this policy as the service or legal requirements change.
          Material changes should be announced in the product or by another
          appropriate method, and the date above will be updated.
        </p>
      </LegalSection>
      <LegalSection title="12. Contact">
        <p>
          Privacy requests: <LegalContact />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
