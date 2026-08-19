import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalContact,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
export const metadata: Metadata = { title: "Terms of Service" };
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="The rules for using SynapseDoc, including document uploads, AI-generated results, account responsibilities, and service limits."
    >
      <LegalSection title="1. Agreement and eligibility">
        <p>
          By creating an account or using SynapseDoc, you agree to these Terms
          and the Privacy Policy. You must be at least 18 years old and legally
          able to enter into this agreement. Do not use the service if you do
          not agree.
        </p>
      </LegalSection>
      <LegalSection title="2. What SynapseDoc provides">
        <p>
          SynapseDoc lets you upload PDFs, extract and index text, generate
          summaries, ask questions, compare documents, and receive source-linked
          answers. Features may change, be limited, or be discontinued. The
          service is provided as an early-stage research tool, not as a
          guaranteed archive or professional advisory service.
        </p>
      </LegalSection>
      <LegalSection title="3. Your account">
        <LegalList>
          <li>
            Provide accurate account information and keep access credentials
            secure.
          </li>
          <li>
            You are responsible for activity performed through your account.
          </li>
          <li>
            Notify us promptly if you believe your account has been compromised.
          </li>
          <li>
            We may suspend or terminate accounts used unlawfully, abusively, or
            in breach of these Terms.
          </li>
        </LegalList>
      </LegalSection>
      <LegalSection title="4. Your documents and permissions">
        <p>
          You retain ownership of documents and text you upload. You grant
          SynapseDoc a limited, non-exclusive permission to host, copy, parse,
          transform, embed, transmit to service providers, and otherwise process
          that content only as reasonably necessary to operate, secure, and
          improve the service.
        </p>
        <p>
          You must have the rights and authority to upload each document. Do not
          upload confidential, classified, illegally obtained, infringing, or
          highly sensitive material unless you have assessed the risks and are
          authorized to use the service for it.
        </p>
      </LegalSection>
      <LegalSection title="5. AI output and citations">
        <p>
          AI-generated summaries and answers can be incomplete, inaccurate,
          outdated, or misleading. Citations help you check the source, but they
          do not guarantee that an answer is correct. Verify important claims
          against the original document. Do not rely on SynapseDoc as a
          substitute for legal, medical, financial, academic, or other
          professional judgment.
        </p>
      </LegalSection>
      <LegalSection title="6. Service limits">
        <p>
          Current technical limits are published on the{" "}
          <Link className="text-primary underline" href="/limits">
            Service Limits page
          </Link>
          . Limits may change to protect reliability, control cost, or prevent
          abuse. Attempts to evade limits are prohibited.
        </p>
      </LegalSection>
      <LegalSection title="7. Acceptable use">
        <p>
          You must follow the{" "}
          <Link className="text-primary underline" href="/acceptable-use">
            Acceptable Use Policy
          </Link>
          . Among other things, you may not use SynapseDoc to violate law,
          infringe rights, distribute malware, probe other users&apos; data,
          bypass security controls, or overload the service.
        </p>
      </LegalSection>
      <LegalSection title="8. Availability and changes">
        <p>
          We do not promise uninterrupted availability, permanent storage,
          error-free processing, or that every PDF will be readable. Keep your
          own copies. Maintenance, provider outages, quotas, model changes, file
          corruption, and other events may interrupt or alter the service.
        </p>
      </LegalSection>
      <LegalSection title="9. Suspension and termination">
        <p>
          You may stop using the service at any time. We may restrict or
          terminate access when reasonably necessary for security, legal
          compliance, provider requirements, abuse prevention, or material
          breach. You can delete your account and associated documents directly
          in Account Settings, or contact us to request manual deletion.
        </p>
      </LegalSection>
      <LegalSection title="10. Disclaimers and liability">
        <p>
          To the fullest extent permitted by applicable law, SynapseDoc is
          provided “as is” and “as available,” without warranties of accuracy,
          fitness for a particular purpose, non-infringement, availability, or
          data preservation. To the fullest extent permitted by law, the
          operator is not liable for indirect, incidental, special,
          consequential, or punitive damages, or for loss of data, profits,
          opportunities, or reputation arising from use of the service.
        </p>
        <p>
          Nothing in these Terms excludes rights or liabilities that cannot
          legally be excluded.
        </p>
      </LegalSection>
      <LegalSection title="11. Governing law and disputes">
        <p>
          These Terms are governed by the laws of Cambodia, without overriding
          mandatory consumer or data-protection rights that apply to you. Before
          filing a formal claim, contact us and allow a reasonable opportunity
          to resolve the issue informally.
        </p>
      </LegalSection>
      <LegalSection title="12. Contact">
        <p>
          Questions about these Terms: <LegalContact />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
