import type { Metadata } from 'next';
import { countries, type Country } from '@/content/countries';
import FreeLinkGenerator from '@/app/components/FreeLinkGenerator';
import { HelpCircle } from 'lucide-react';

interface PageProps {
  params: { country: string };
}

export async function generateStaticParams() {
  return countries.map((country) => ({
    country: country.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = countries.find((c) => c.slug === params.country);
  if (!country) {
    return {
      title: 'Country Not Found',
    };
  }

  const title = `Free WhatsApp Link Generator for ${country.country} Businesses — Leadwa`;
  const description = `Generate free WhatsApp links and QR codes for your ${country.country} business. Track clicks, capture leads, never miss a follow-up. ${country.whatsappNote}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://leadwa.co/whatsapp-link-generator/${country.slug}`,
      siteName: 'Leadwa',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://leadwa.co/whatsapp-link-generator/${country.slug}`,
    },
  };
}

export default function CountryPage({ params }: PageProps) {
  const country = countries.find((c) => c.slug === params.country);

  if (!country) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold text-ink mb-4">Country not found</h1>
          <a href="/" className="text-bottle-green hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Leadwa — WhatsApp Link Generator for ${country.country}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: country.currency,
        description: 'Free WhatsApp link generator with QR code',
      },
      {
        '@type': 'Offer',
        name: 'Basic Plan',
        price: country.priceLocal.split('/')[0].replace(/[^\d.]/g, ''),
        priceCurrency: country.currency,
        description: 'Click tracking, lead alerts, follow-up reminders',
      },
    ],
    description: `Free WhatsApp link generator for ${country.country} businesses. Create custom links, QR codes, track every lead.`,
    url: `https://leadwa.co/whatsapp-link-generator/${country.slug}`,
  };

  const faqs = getFAQsForCountry(country);

  const jsonLdFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />

      <div className="min-h-screen bg-paper">
        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h1 className="font-headline text-5xl md:text-6xl font-bold text-ink leading-tight">
                  Free WhatsApp Link Generator for {country.country} Businesses
                </h1>
                <p className="text-xl text-ink/70 leading-relaxed">
                  Create custom WhatsApp links and QR codes in seconds. No signup required. {country.whatsappNote}
                </p>
              </div>

              <div>
                <FreeLinkGenerator />
              </div>
            </div>
          </div>
        </section>

        {/* Pain Story */}
        <section className="py-20 px-4 bg-gradient-to-b from-paper to-terracotta/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink mb-8 text-center">
              Why {country.country} businesses lose leads on WhatsApp
            </h2>
            <div className="prose prose-lg max-w-none text-ink/80 leading-relaxed">
              <p className="text-lg mb-6">{country.localPainExample}</p>
              <p className="text-lg mb-6">
                The problem isn&rsquo;t volume. It&rsquo;s visibility. WhatsApp mixes business enquiries with family chats, spam, and groups. Critical messages get buried.
              </p>
              <p className="text-lg">
                Leadwa solves this. Every lead that clicks your link appears in your Leadwa dashboard with timestamp, source, location, and device. You get alerts when a hot lead goes cold. No lead ever dies in the scroll again.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-headline text-4xl font-bold text-ink mb-12 text-center">
              What you get with Leadwa
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <h3 className="font-headline text-2xl font-bold text-bottle-green mb-4">Free link + QR</h3>
                <p className="text-ink/70">
                  Generate custom WhatsApp links and downloadable QR codes instantly. Perfect for Instagram bios, ads, and print materials.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <h3 className="font-headline text-2xl font-bold text-bottle-green mb-4">Click tracking</h3>
                <p className="text-ink/70">
                  See exactly where your leads come from—Instagram, Facebook, Google, or your QR code. Know what&rsquo;s working.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <h3 className="font-headline text-2xl font-bold text-bottle-green mb-4">Follow-up alerts</h3>
                <p className="text-ink/70">
                  Get notified when a lead hasn&rsquo;t replied in 24 hours. Never let a hot enquiry go cold again.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-gradient-to-b from-paper to-bottle-green/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-4xl font-bold text-ink mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border-2 border-ink/10">
                  <h3 className="font-semibold text-xl text-ink mb-3 flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-bottle-green flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-ink/70 leading-relaxed pl-9">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink mb-6">
              Stop losing leads on WhatsApp
            </h2>
            <p className="text-xl text-ink/70 mb-8">
              Generate your free link now. No signup, no credit card. Just your link and QR code.
            </p>
            <a
              href="#hero"
              className="inline-block bg-bottle-green text-white text-lg font-semibold py-4 px-8 rounded-lg hover:bg-bottle-green/90 transition-all duration-200 cursor-pointer"
            >
              Create free link
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

function getFAQsForCountry(country: Country): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Does this work with my ${country.country} WhatsApp number?`,
      answer: `Yes! Leadwa works with any WhatsApp-enabled number in ${country.country}. ${country.whatsappNote} Just enter your number, and we'll generate a working link instantly.`,
    },
    {
      question: 'Do I need to sign up to use the free link generator?',
      answer: 'Nope. The free link generator is completely anonymous. Enter your WhatsApp number, get your link and QR code. If you want click tracking and follow-up alerts, you can save your link by creating a free account.',
    },
    {
      question: 'Can I use custom text in the link?',
      answer: 'Absolutely. You can set a "pre-fill message" that appears in the user\'s WhatsApp chat when they click your link. Perfect for qualifying leads ("Hi, I saw your ad on Instagram") or saving them typing.',
    },
    {
      question: 'Where can I use the QR code?',
      answer: 'Anywhere you print or display: shop counters, restaurant tables, vehicle wraps, business cards, posters, pamphlets, event booths. Customers scan it, WhatsApp opens with your number pre-filled. One tap to start the conversation.',
    },
    {
      question: 'How is this different from WhatsApp Business API?',
      answer: 'WhatsApp Business API is expensive, requires approval, and is designed for large companies sending bulk messages. Leadwa works on your existing WhatsApp (personal or Business app). No approval, no integration, no monthly minimums. You get the link, they message you, you reply from your phone. Simple.',
    },
  ];
}
