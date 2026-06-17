"use client";

import Link from "next/link";
import { Mail, Phone, Building2 } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";
import { resolveUiText } from "@/lib/ui-text";

const FOOTER_LINKS: Array<{ key: string; href: string }> = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.students", href: "/students" },
  { key: "nav.publications", href: "/publications" },
  { key: "nav.photos", href: "/photos" },
  { key: "nav.archive", href: "/archive" },
  { key: "nav.contacts", href: "/contacts" },
];

export function PortalPublicFooter() {
  const { state } = usePortal();
  const about = state.pages.about;
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <EditableText as="div" id="footer.title" className="serif-title" style={{ fontSize: 22, fontWeight: 600 }} />
            <EditableText as="p" id="footer.about" className="footer-tagline" multiline />
          </div>

          <div className="footer-col">
            <EditableText as="div" id="footer.sectionsTitle" className="footer-col-title" />
            <nav>
              {FOOTER_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="footer-link">
                  {resolveUiText(state.uiText, item.key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-col">
            <EditableText as="div" id="footer.contactsTitle" className="footer-col-title" />
            {about.email && (
              <div className="footer-contact-row">
                <Mail size={13} strokeWidth={1.9} style={{ verticalAlign: -2, marginRight: 7, color: "var(--clay)" }} />
                <a href={`mailto:${about.email}`}>{about.email}</a>
              </div>
            )}
            {about.phone && (
              <div className="footer-contact-row">
                <Phone size={13} strokeWidth={1.9} style={{ verticalAlign: -2, marginRight: 7, color: "var(--clay)" }} />
                {about.phone}
              </div>
            )}
            {about.department && (
              <div className="footer-contact-row" style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <Building2 size={13} strokeWidth={1.9} style={{ marginTop: 3, flexShrink: 0, color: "var(--clay)" }} />
                <span>{about.department}</span>
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} В. В. Силантьев</span>
        </div>
      </div>
    </footer>
  );
}
