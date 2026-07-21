'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Check, X } from 'lucide-react';

interface GeneratedLink {
  slug: string;
  shortUrl: string;
  qrDataUrl: string;
  whatsappNumber: string;
  prefillMessage: string;
  title: string;
  timestamp: number;
}

interface SlugCheckResponse {
  available: boolean;
  reason?: string;
  suggestions?: string[];
}

export default function FreeLinkGenerator() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [prefillMessage, setPrefillMessage] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
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

  // Debounced slug availability check
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugCheckStatus('idle');
      return;
    }

    // Validate format
    if (!/^[a-z0-9-]{3,32}$/.test(slug)) {
      setSlugCheckStatus('unavailable');
      setSlugSuggestions([]);
      return;
    }

    setSlugCheckStatus('checking');

    try {
      const response = await fetch(`https://api.leadwa.co/links/check-slug?slug=${encodeURIComponent(slug)}`);
      const data: SlugCheckResponse = await response.json();

      if (data.available) {
        setSlugCheckStatus('available');
        setSlugSuggestions([]);
      } else {
        setSlugCheckStatus('unavailable');
        setSlugSuggestions(data.suggestions || []);
      }
    } catch {
      setSlugCheckStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customSlug) {
        checkSlugAvailability(customSlug);
      } else {
        setSlugCheckStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customSlug, checkSlugAvailability]);

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
      // Call anonymous link creation API
      const response = await fetch('https://api.leadwa.co/links/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dest_number: cleaned,
          prefill_text: prefillMessage || undefined,
          title: title || 'Free Link',
          slug: customSlug || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create link');
      }

      const data = await response.json();
      const { slug, short_url } = data;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(short_url, {
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
        shortUrl: short_url,
        qrDataUrl,
        whatsappNumber: cleaned,
        prefillMessage: prefillMessage || '',
        title: title || 'Free Link',
        timestamp: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem('leadwa_anonymous_link', JSON.stringify(link));
      setGeneratedLink(link);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate link. Please try again.';
      setError(message);
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
    setTitle('');
    setCustomSlug('');
    setSlugCheckStatus('idle');
    setSlugSuggestions([]);
    localStorage.removeItem('leadwa_anonymous_link');
  };

  if (generatedLink) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-bottle-green">
        <h3 className="font-headline text-3xl text-bottle-green mb-6">Your free link is ready!</h3>

        <div className="mb-6 p-5 bg-paper rounded-lg border border-ink/10">
          <div className="text-sm font-medium text-ink/60 mb-2">Short URL:</div>
          <div className="font-mono text-lg text-ink break-all font-semibold">{generatedLink.shortUrl}</div>
        </div>

        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={generatedLink.qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-lg shadow-md" />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full bg-bottle-green text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-bottle-green-light hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            Copy link
          </button>
          <button
            onClick={handleDownloadQR}
            className="w-full bg-ink text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-ink/80 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            Download QR code
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-paper text-ink py-3 px-6 rounded-lg font-semibold border-2 border-ink/20 hover:bg-ink/5 hover:border-ink/30 active:scale-[0.98] transition-all duration-200"
          >
            Create another link
          </button>
        </div>

        <div className="mt-8 p-5 bg-bottle-green/5 rounded-lg border border-bottle-green/20">
          <div className="text-sm text-ink/80 mb-3">
            <strong>Want to track clicks and get follow-up alerts?</strong>
          </div>
          <a
            href="/login"
            className="inline-block text-bottle-green font-semibold hover:underline transition-all"
          >
            Save &amp; track this link →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl border border-ink/5">
      <h3 className="font-headline text-2xl text-ink mb-2">Create your free WhatsApp link</h3>
      <p className="text-ink/70 mb-8">No signup required. Get your link + QR code instantly.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            What should we call this link? <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Instagram Bio Link"
            className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
          />
          <p className="text-xs text-ink/60 mt-1">A friendly name to remember this link</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            Custom URL (optional)
          </label>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-ink/60">leadwa.link/</span>
            <input
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
              placeholder="my-link"
              pattern="[a-z0-9-]{3,32}"
              className="flex-1 px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
            />
            {slugCheckStatus === 'checking' && (
              <div className="w-5 h-5 border-2 border-bottle-green border-t-transparent rounded-full animate-spin"></div>
            )}
            {slugCheckStatus === 'available' && (
              <Check className="w-5 h-5 text-bottle-green" />
            )}
            {slugCheckStatus === 'unavailable' && (
              <X className="w-5 h-5 text-terracotta" />
            )}
          </div>
          {slugCheckStatus === 'available' && (
            <p className="text-sm text-bottle-green flex items-center gap-1">
              <Check className="w-4 h-4" /> leadwa.link/{customSlug} is available
            </p>
          )}
          {slugCheckStatus === 'unavailable' && (
            <div>
              <p className="text-sm text-terracotta flex items-center gap-1 mb-2">
                <X className="w-4 h-4" /> Already taken, try another
              </p>
              {slugSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {slugSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setCustomSlug(suggestion)}
                      className="text-xs px-2 py-1 bg-paper border border-ink/20 rounded hover:bg-ink/5 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-ink/60 mt-1">3-32 chars, lowercase letters, numbers, hyphens only. Leave blank for random.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            Your WhatsApp Number <span className="text-terracotta">*</span>
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
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
            className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green resize-none transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-terracotta/10 border border-terracotta/20 rounded text-terracotta text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !!(customSlug && slugCheckStatus !== 'available')}
          className="w-full bg-bottle-green text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-bottle-green/90 hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
        >
          {isGenerating ? 'Generating...' : 'Generate free link'}
        </button>
      </div>
    </div>
  );
}
