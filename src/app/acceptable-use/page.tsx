import type { Metadata } from "next";
import {
  LegalContact,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
export const metadata: Metadata = { title: "Acceptable Use Policy" };
export default function AcceptableUsePage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      summary="Rules designed to protect users, documents, providers, and the reliability of SynapseDoc."
    >
      <LegalSection title="You may not use SynapseDoc to">
        <LegalList>
          <li>Break applicable law or encourage illegal activity.</li>
          <li>
            Upload content you do not have the right or authority to process.
          </li>
          <li>
            Infringe copyright, privacy, confidentiality, contractual, or other
            rights.
          </li>
          <li>
            Upload malware, exploit code, malicious PDFs, or content intended to
            compromise systems.
          </li>
          <li>
            Access, infer, enumerate, or expose another user&apos;s account,
            documents, conversations, or identifiers.
          </li>
          <li>
            Bypass authentication, authorization, safety filters, file limits,
            quotas, rate limits, or provider restrictions.
          </li>
          <li>
            Automate excessive requests, scrape the service, resell access, or
            impose unreasonable load without written permission.
          </li>
          <li>
            Use outputs as the sole basis for decisions that materially affect a
            person&apos;s rights, safety, education, employment, credit,
            housing, healthcare, or legal position.
          </li>
          <li>
            Misrepresent AI-generated output as verified fact or conceal
            required attribution or review.
          </li>
          <li>
            Use the service for spam, fraud, impersonation, harassment, or
            deceptive activity.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="Enforcement">
        <p>
          We may block uploads, throttle requests, preserve relevant security
          evidence, suspend accounts, or report conduct when reasonably
          necessary. Enforcement should be proportionate to the risk and may
          occur without advance notice where immediate action is needed.
        </p>
      </LegalSection>
      <LegalSection title="Report misuse">
        <p>
          Report suspected abuse or security issues to <LegalContact />. Do not
          include sensitive documents in an initial report.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
