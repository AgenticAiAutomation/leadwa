import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import ScrollNav from './components/ScrollNav';
import FreeLinkGenerator from './components/FreeLinkGenerator';
import AnimatedCounter from './components/AnimatedCounter';

export const metadata: Metadata = {
  title: 'Leadwa — Your leads stop dying on WhatsApp',
  description: 'No lead ever dies on your WhatsApp. Smart link generator with QR codes, click tracking, and follow-up alerts for Indian SMEs. One honest price, no hidden fees.',
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Leadwa',
    applicationCategory: 'BusinessApplication',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'INR',
        description: 'Link generator, QR code, mini page, click count',
      },
      {
        '@type': 'Offer',
        name: 'Basic Plan',
        price: '199',
        priceCurrency: 'INR',
        description: 'Alerts, follow-ups, source tracking, inbox',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '999',
        priceCurrency: 'INR',
        description: 'API automation, drips, team features',
      },
    ],
    description: 'Smart WhatsApp link generator for Indian SMEs. Track every lead, never miss follow-ups.',
    operatingSystem: 'Web',
    url: 'https://leadwa.co',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ScrollNav />

      <div className="min-h-screen bg-paper">
        {/* Hero Section */}
        <section id="hero" className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-ink leading-tight">
                  Your leads stop dying on WhatsApp.
                </h1>
                <p className="text-xl md:text-2xl text-ink/70 leading-relaxed">
                  One honest price. No hidden fees. Works on the WhatsApp you already use.
                </p>
              </div>

              <div>
                <FreeLinkGenerator />
              </div>
            </div>
          </div>
        </section>

        {/* Leak Story - Terracotta */}
        <section className="py-20 px-4 bg-gradient-to-b from-paper to-terracotta/10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink mb-6">
                Ramesh runs a coaching institute
              </h2>
              <p className="text-lg md:text-xl text-ink/80 leading-relaxed">
                Last month, he got enquiries from parents on WhatsApp, Facebook, and his website. Here&rsquo;s what happened:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center p-6 bg-white rounded-lg border-2 border-terracotta/20">
                <div className="text-6xl font-bold text-terracotta mb-2">
                  <AnimatedCounter end={143} />
                </div>
                <div className="text-ink/70">enquiries received</div>
              </div>

              <div className="text-center p-6 bg-white rounded-lg border-2 border-terracotta/20">
                <div className="text-6xl font-bold text-terracotta mb-2">
                  <AnimatedCounter end={61} />
                </div>
                <div className="text-ink/70">answered on time</div>
              </div>

              <div className="text-center p-6 bg-white rounded-lg border-2 border-terracotta/20">
                <div className="text-6xl font-bold text-terracotta mb-2">
                  <AnimatedCounter end={82} />
                </div>
                <div className="text-ink/70">gone forever</div>
              </div>
            </div>

            <div className="text-center p-8 bg-terracotta/20 rounded-lg border-2 border-terracotta">
              <div className="font-headline text-5xl md:text-6xl font-bold text-terracotta mb-2">
                ₹<AnimatedCounter end={11} /> lakh
              </div>
              <div className="text-xl text-ink/80">he never saw leave</div>
              <div className="text-sm text-ink/60 mt-4 italic">Illustrative example</div>
            </div>
          </div>
        </section>

        {/* The Turn */}
        <section className="py-20 px-4 bg-gradient-to-b from-terracotta/10 via-paper to-bottle-green/10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block p-8 bg-white rounded-lg shadow-xl border-2 border-ink/10 mb-8">
              <div className="text-sm font-semibold text-terracotta mb-3">🔔 LEADWA ALERT</div>
              <div className="text-lg font-semibold text-ink mb-2">3 parents messaged</div>
              <div className="text-ink/70">No reply in 2 hours</div>
              <div className="text-xs text-ink/50 mt-3">From: Instagram ad campaign</div>
            </div>
            <p className="text-xl text-ink/80">
              Ramesh saw the alert during lunch. He replied in 10 minutes.
            </p>
          </div>
        </section>

        {/* Recovery - Green */}
        <section className="py-20 px-4 bg-gradient-to-b from-bottle-green/10 to-paper">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-bottle-green mb-6">
                Two months later
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <div className="text-6xl font-bold text-bottle-green mb-2">
                  <AnimatedCounter end={167} />
                </div>
                <div className="text-ink/70">enquiries captured</div>
              </div>

              <div className="text-center p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <div className="text-6xl font-bold text-bottle-green mb-2">
                  <AnimatedCounter end={159} />
                </div>
                <div className="text-ink/70">followed up day 1/3/7</div>
              </div>

              <div className="text-center p-6 bg-white rounded-lg border-2 border-bottle-green/20">
                <div className="text-6xl font-bold text-bottle-green mb-2">
                  <AnimatedCounter end={167} />
                </div>
                <div className="text-ink/70">source tracked</div>
              </div>
            </div>

            <div className="text-center p-8 bg-bottle-green/20 rounded-lg border-2 border-bottle-green">
              <div className="font-headline text-5xl md:text-6xl font-bold text-bottle-green mb-2">
                <AnimatedCounter end={37} /> admissions
              </div>
              <div className="text-xl text-ink/80">recovered from the lost pile</div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink text-center mb-16">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-bottle-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-bottle-green">1</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-ink mb-4">Print the QR</h3>
                <p className="text-ink/70 leading-relaxed">
                  Put it on your shop, hoarding, pamphlet, or Instagram bio. Each campaign gets its own link.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-bottle-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-bottle-green">2</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-ink mb-4">Lead scans</h3>
                <p className="text-ink/70 leading-relaxed">
                  The QR opens WhatsApp directly on their phone. No app install, no signup, no friction.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-bottle-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-bottle-green">3</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-ink mb-4">You get the alert</h3>
                <p className="text-ink/70 leading-relaxed">
                  Instant notification + follow-up reminders. You know which campaign sent them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 bg-paper">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink text-center mb-6">
              One honest price
            </h2>
            <p className="text-xl text-ink/70 text-center mb-16">
              No setup fees. No template fees. No per-agent charges. That honesty is the differentiator.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Free */}
              <div className="bg-white p-8 rounded-lg border-2 border-ink/10 hover:border-bottle-green/50 transition">
                <h3 className="font-headline text-2xl font-bold text-ink mb-2">Free</h3>
                <div className="text-4xl font-bold text-ink mb-6">₹0</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Link generator</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">QR code download</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Mini share page</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Click count</span>
                  </li>
                </ul>
                <a
                  href="#hero"
                  className="block w-full text-center bg-ink/5 text-ink py-3 px-6 rounded-lg font-semibold hover:bg-ink/10 transition"
                >
                  Start free
                </a>
              </div>

              {/* Basic */}
              <div className="bg-white p-8 rounded-lg border-2 border-bottle-green shadow-xl relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bottle-green text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most popular
                </div>
                <h3 className="font-headline text-2xl font-bold text-ink mb-2">Basic</h3>
                <div className="text-4xl font-bold text-ink mb-6">
                  ₹199<span className="text-lg text-ink/60">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Everything in Free</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Instant alerts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Follow-up reminders</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Source tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Inbox dashboard</span>
                  </li>
                </ul>
                <a
                  href="/login"
                  className="block w-full text-center bg-bottle-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-bottle-green-light transition"
                >
                  Get started
                </a>
              </div>

              {/* Pro */}
              <div className="bg-white p-8 rounded-lg border-2 border-ink/10 hover:border-bottle-green/50 transition">
                <h3 className="font-headline text-2xl font-bold text-ink mb-2">Pro</h3>
                <div className="text-4xl font-bold text-ink mb-6">
                  ₹999<span className="text-lg text-ink/60">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Everything in Basic</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">API automation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Drip campaigns</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Team features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-bottle-green mr-2" />
                    <span className="text-ink/80">Priority support</span>
                  </li>
                </ul>
                <a
                  href="/login"
                  className="block w-full text-center bg-ink/5 text-ink py-3 px-6 rounded-lg font-semibold hover:bg-ink/10 transition"
                >
                  Get started
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-20 px-4 bg-bottle-green text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">
              Stop losing leads tonight
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Create your first WhatsApp link in 30 seconds. No signup required.
            </p>
            <a
              href="#hero"
              className="inline-block bg-white text-bottle-green py-4 px-10 rounded-lg font-bold text-lg hover:bg-paper transition"
            >
              Create free link
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-ink text-white/70 text-center">
          <p>A product by Agentic AI Automation</p>
        </footer>
      </div>
    </>
  );
}
