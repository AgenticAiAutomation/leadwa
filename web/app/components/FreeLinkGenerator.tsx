'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface GeneratedLink {
  slug: string;
  shortUrl: string;
  qrDataUrl: string;
  whatsappNumber: string;
  prefillMessage: string;
  timestamp: number;
}

export default function FreeLinkGenerator() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [prefillMessage, setPrefillMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null);
  const [error, setError] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('leadwa_anonymous_link');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGeneratedLink(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const generateSlug = () => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let slug = '';
    for (let i = 0; i < 6; i++) {
      slug += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return slug;
  };

  const handleGenerate = async () => {
    setError('');

    // Validate WhatsApp number
    const cleaned = whatsappNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid WhatsApp number');
      return;
    }

    setIsGenerating(true);

    try {
      const slug = generateSlug();
      const shortUrl = `https://leadwa.link/${slug}`;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(shortUrl, {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const link: GeneratedLink = {
        slug,
        shortUrl,
        qrDataUrl,
        whatsappNumber: cleaned,
        prefillMessage: prefillMessage || '',
        timestamp: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem('leadwa_anonymous_link', JSON.stringify(link));
      setGeneratedLink(link);
    } catch {
      setError('Failed to generate link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedLink) return;

    const link = document.createElement('a');
    link.download = `leadwa-${generatedLink.slug}-qr.png`;
    link.href = generatedLink.qrDataUrl;
    link.click();
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink.shortUrl);
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setWhatsappNumber('');
    setPrefillMessage('');
    localStorage.removeItem('leadwa_anonymous_link');
  };

  if (generatedLink) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-bottle-green">
        <h3 className="font-headline text-2xl text-bottle-green mb-4">Your free link is ready!</h3>

        <div className="mb-4 p-4 bg-paper rounded">
          <div className="text-sm text-ink/60 mb-1">Short URL:</div>
          <div className="font-mono text-lg text-ink break-all">{generatedLink.shortUrl}</div>
        </div>

        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={generatedLink.qrDataUrl} alt="QR Code" className="w-48 h-48" />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full bg-bottle-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-bottle-green-light transition"
          >
            Copy link
          </button>
          <button
            onClick={handleDownloadQR}
            className="w-full bg-ink text-white py-3 px-6 rounded-lg font-semibold hover:bg-ink/80 transition"
          >
            Download QR code
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-paper text-ink py-2 px-6 rounded-lg font-semibold border border-ink/20 hover:bg-ink/5 transition"
          >
            Create another link
          </button>
        </div>

        <div className="mt-6 p-4 bg-bottle-green/5 rounded border border-bottle-green/20">
          <div className="text-sm text-ink/80 mb-2">
            <strong>Want to track clicks and get follow-up alerts?</strong>
          </div>
          <a
            href="/login"
            className="inline-block text-bottle-green font-semibold hover:underline"
          >
            Save &amp; track this link →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="font-headline text-2xl text-ink mb-4">Create your free WhatsApp link</h3>
      <p className="text-ink/70 mb-6">No signup required. Get your link + QR code instantly.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            Your WhatsApp Number <span className="text-terracotta">*</span>
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            Pre-fill message (optional)
          </label>
          <textarea
            value={prefillMessage}
            onChange={(e) => setPrefillMessage(e.target.value)}
            placeholder="Hi, I'm interested in..."
            rows={3}
            className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-terracotta/10 border border-terracotta/20 rounded text-terracotta text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-bottle-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-bottle-green-light transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate free link'}
        </button>
      </div>
    </div>
  );
}
