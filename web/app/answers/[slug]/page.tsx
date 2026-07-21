import type { Metadata } from 'next';
import { questions } from '@/content/questions';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return questions.map((q) => ({
    slug: q.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const question = questions.find((q) => q.slug === params.slug);
  if (!question) {
    return { title: 'Question Not Found' };
  }

  const title = `${question.question} — Leadwa`;
  const description = question.answer.slice(0, 155) + '...';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://leadwa.co/answers/${question.slug}`,
      siteName: 'Leadwa',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `https://leadwa.co/answers/${question.slug}`,
    },
  };
}

export default function AnswerPage({ params }: PageProps) {
  const question = questions.find((q) => q.slug === params.slug);

  if (!question) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold text-ink mb-4">Question not found</h1>
          <Link href="/answers" className="text-bottle-green hover:underline">
            Browse all questions
          </Link>
        </div>
      </div>
    );
  }

  const relatedQuestions = questions.filter((q) => question.relatedSlugs.includes(q.slug));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question.question,
      text: question.question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.answer,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-paper">
        {/* Breadcrumb */}
        <div className="pt-24 pb-8 px-4 border-b border-ink/10">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-ink/60">
              <Link href="/" className="hover:text-ink transition">Home</Link>
              <span>/</span>
              <Link href="/answers" className="hover:text-ink transition">Answers</Link>
              <span>/</span>
              <span className="text-ink capitalize">{question.category.replace('-', ' ')}</span>
            </nav>
          </div>
        </div>

        {/* Question & Answer */}
        <article className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-ink mb-8 leading-tight">
              {question.question}
            </h1>

            <div className="prose prose-lg max-w-none">
              {question.answer.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-lg text-ink/80 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>

        {/* Related Questions */}
        {relatedQuestions.length > 0 && (
          <section className="py-16 px-4 bg-gradient-to-b from-paper to-bottle-green/5">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-3xl font-bold text-ink mb-8">Related questions</h2>
              <div className="space-y-4">
                {relatedQuestions.map((rq) => (
                  <Link
                    key={rq.slug}
                    href={`/answers/${rq.slug}`}
                    className="block p-6 bg-white rounded-lg border-2 border-ink/10 hover:border-bottle-green transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold text-ink group-hover:text-bottle-green transition">
                        {rq.question}
                      </h3>
                      <ArrowRight className="w-6 h-6 text-bottle-green flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 px-4 bg-terracotta/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-ink mb-6">
              Stop losing leads on WhatsApp
            </h2>
            <p className="text-xl text-ink/70 mb-8">
              Generate your free WhatsApp link now. No signup, no credit card.
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
    </>
  );
}
