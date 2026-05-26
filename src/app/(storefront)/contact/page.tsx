import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "./contact-form";
import { getSiteSettings } from "@/lib/site-settings";
import { contactContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "צרו קשר עם הצוות שלנו לכל שאלה או לקביעת פגישת ייעוץ.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "צור קשר" }]} />
      <PageHero title="צור קשר" eyebrow="Contact" />
      <main className="py-14 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
          <div>
            <p className="text-[0.98rem] leading-loose text-brand-text font-light mb-8">
              {contactContent.intro}
            </p>
            <ul className="space-y-5">
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-1">טלפון</div>
                  <a href={`tel:${settings.contact.phoneIntl}`} className="text-brand-primary hover:text-brand-accent">
                    {settings.contact.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-1">אימייל</div>
                  <a href={`mailto:${settings.contact.email}`} className="text-brand-primary hover:text-brand-accent">
                    {settings.contact.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="w-5 h-5 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-1">WhatsApp</div>
                  <a href={settings.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-accent">
                    שלחו הודעה
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-1">הסטודיו</div>
                  <div className="text-brand-primary">{settings.contact.address}</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="w-5 h-5 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-1">שעות פתיחה</div>
                  <div className="text-brand-primary">{contactContent.studio.hours}</div>
                </div>
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </main>
    </>
  );
}
