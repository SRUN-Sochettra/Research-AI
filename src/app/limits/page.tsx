import type { Metadata } from "next";
import { LIMITS } from "@/lib/utils/constants";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
export const metadata: Metadata = { title: "Service Limits" };
const mb = LIMITS.maxFileSize / (1024 * 1024);
export default function LimitsPage() {
  return (
    <LegalPage
      title="Service Limits"
      summary="Current product limits and practical guidance for documents, chats, processing, and storage."
    >
      <LegalSection title="Uploads">
        <LegalList>
          <li>
            <strong className="text-foreground">Format:</strong> PDF only.
          </li>
          <li>
            <strong className="text-foreground">Maximum file size:</strong> {mb}{" "}
            MB per PDF.
          </li>
          <li>
            <strong className="text-foreground">
              Maximum stored documents:
            </strong>{" "}
            {LIMITS.maxDocumentsPerUser} per account.
          </li>
          <li>
            Empty files, non-PDF files, and files above the limit are rejected.
          </li>
          <li>
            Password-protected, corrupted, scanned, image-heavy, or unusually
            formatted PDFs may fail or produce incomplete text.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="Chat and conversations">
        <LegalList>
          <li>
            <strong className="text-foreground">Maximum message length:</strong>{" "}
            {LIMITS.maxMessageLength.toLocaleString()} characters.
          </li>
          <li>
            <strong className="text-foreground">
              Maximum conversations per document:
            </strong>{" "}
            {LIMITS.maxConversationsPerDocument}.
          </li>
          <li>
            <strong className="text-foreground">
              Typical application rate limit:
            </strong>{" "}
            {LIMITS.rateLimit.maxRequests} requests per minute per user/action
            when Upstash is configured.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="Processing">
        <p>
          Upload and chat server operations are configured for a 60-second
          execution window. Processing may continue after upload, but very large
          or complex PDFs may time out or fail. Keep your original file and
          retry later if a provider is temporarily unavailable.
        </p>
      </LegalSection>
      <LegalSection title="How to prepare a PDF">
        <LegalList>
          <li>Prefer searchable text PDFs rather than photo-only scans.</li>
          <li>Remove unnecessary pages and compress oversized images.</li>
          <li>
            Do not upload files containing secrets or sensitive information
            unless necessary and authorized.
          </li>
          <li>Split a document if it exceeds {mb} MB.</li>
        </LegalList>
      </LegalSection>
      <LegalSection title="Limits can change">
        <p>
          Limits may be adjusted for reliability, security, provider quotas, or
          cost control. This page should be updated whenever the constants or
          production infrastructure change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
