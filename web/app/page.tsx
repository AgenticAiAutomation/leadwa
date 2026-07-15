import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leadwa — Your leads stop dying on WhatsApp',
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Leadwa',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
    },
    description: 'Smart WhatsApp links for Indian SMEs. Track every lead, never miss follow-ups.',
    operatingSystem: 'Web',
    url: 'https://leadwa.co',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        <header className="px-4 py-6 max-w-4xl mx-auto">
          <div className="text-xl font-bold text-gray-900">Leadwa</div>
        </header>

        <main>
          <section className="px-4 py-16 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your leads stop dying on WhatsApp.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              One honest price. No hidden fees.
            </p>
            <a
              href="/signup"
              className="inline-block bg-green-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Create your free link
            </a>
          </section>

          <section className="px-4 py-12 max-w-4xl mx-auto border-t border-gray-200">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Late replies kill deals</h2>
              <p className="text-lg text-gray-700 mb-2">
                Your customer WhatsApps at 11 PM. You see it at 9 AM. They already bought from someone else.
              </p>
              <p className="text-4xl font-bold text-red-600">67% of leads lost</p>
              <p className="text-sm text-gray-500">because you replied after 8 hours</p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">No follow-up means no sale</h2>
              <p className="text-lg text-gray-700 mb-2">
                Customer says &ldquo;I&rsquo;ll think about it.&rdquo; You forget to follow up in 3 days. Deal dies in your chat list.
              </p>
              <p className="text-4xl font-bold text-red-600">54% of deals close</p>
              <p className="text-sm text-gray-500">only after 2-4 follow-ups</p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">You have no idea what works</h2>
              <p className="text-lg text-gray-700 mb-2">
                You paid ₹8,000 for that hoarding. You paid ₹12,000 for JustDial. Which one sent you customers? You don&rsquo;t know.
              </p>
              <p className="text-4xl font-bold text-red-600">₹0 spent wisely</p>
              <p className="text-sm text-gray-500">when you can&rsquo;t track what&rsquo;s working</p>
            </div>
          </section>

          <section className="px-4 py-16 max-w-4xl mx-auto text-center bg-gray-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Leadwa fixes all three
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              One smart link per campaign. Track every click. See which hoarding, which JustDial ad, which Instagram post sent you leads. Never lose another deal.
            </p>
            <a
              href="/signup"
              className="inline-block bg-green-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Create your free link
            </a>
          </section>
        </main>

        <footer className="px-4 py-8 max-w-4xl mx-auto text-center text-gray-600 border-t border-gray-200">
          <p>A product by Agentic AI Automation</p>
        </footer>
      </div>
    </>
  );
}
