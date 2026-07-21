import type { Metadata } from 'next';
import { questions } from '@/content/questions';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WhatsApp Lead Capture Questions — Leadwa',
  description: 'Common questions about WhatsApp lead capture, click tracking, follow-up, and avoiding bans. Honest answers for small businesses.',
  openGraph: {
    title: 'WhatsApp Lead Capture Questions — Leadwa',
    description: 'Common questions about WhatsApp lead capture, click tracking, follow-up, and avoiding bans.',
    url: 'https://leadwa.co/answers',
    siteName: 'Leadwa',
    type: 'website',
  },
  alternates: {
    canonical: 'https://leadwa.co/answers',
  },
};

const categories = [
  { slug: 'getting-started', title: 'Getting Started', description: 'Create links, QR codes, and set up your first campaign' },
  { slug: 'tracking', title: 'Tracking & Analytics', description: 'Know which ad, post, or QR code is bringing leads' },
  { slug: 'follow-up', title: 'Follow-up & Automation', description: 'Never miss a hot lead, without being spammy' },
  { slug: 'avoiding-bans', title: 'Avoiding Bans', description: 'Stay compliant and keep your WhatsApp number safe' },
];

export default function AnswersPage() {
  const questionsByCategory = categories.map((cat) => ({
    ...cat,
    questions: questions.filter((q) => q.category === cat.slug),
  }));

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-ink mb-6 leading-tight">
            Questions about WhatsApp lead capture?
          </h1>
          <p className="text-xl md:text-2xl text-ink/70 leading-relaxed max-w-3xl mx-auto">
            Honest answers to the questions small business owners actually ask. No jargon, no fluff.
          </p>
        </div>
      </section>

      {/* Questions by Category */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          {questionsByCategory.map((cat) => (
            <div key={cat.slug}>
              <div className="mb-8">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-ink mb-3">
                  {cat.title}
                </h2>
                <p className="text-lg text-ink/60">{cat.description}</p>
              </div>

              <div className="space-y-4">
                {cat.questions.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/answers/${q.slug}`}
                    className="block p-6 bg-white rounded-lg border-2 border-ink/10 hover:border-bottle-green transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-ink group-hover:text-bottle-green transition mb-2">
                          {q.question}
                        </h3>
                        <p className="text-ink/60 line-clamp-2">
                          {q.answer.slice(0, 120)}...
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-bottle-green flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-paper to-bottle-green/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-ink mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-ink/70 mb-8">
            Try it free. No signup, no credit card. Just your WhatsApp link and QR code.
          </p>
          <Link
            href="/"
            className="inline-block bg-bottle-green text-white text-lg font-semibold py-4 px-8 rounded-lg hover:bg-bottle-green/90 transition-all duration-200"
          >
            Create free link
          </Link>
        </div>
      </section>
    </div>
  );
}
