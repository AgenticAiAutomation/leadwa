'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Link, LinkStats } from '@/lib/api';
import { Sparkline } from '@/components/Sparkline';
import { Check, X } from 'lucide-react';

interface LinkWithStats extends Link {
  stats?: LinkStats;
}

const SOURCE_TAGS = [
  'Instagram',
  'Hoarding',
  'JustDial',
  'IndiaMART',
  'Referral',
  'Other',
];

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    dest_number: '',
    prefill_text: '',
    source_tag: '',
    slug: '',
  });
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.leadwa.co'}/links/check-slug?slug=${encodeURIComponent(slug)}`, {
        credentials: 'include',
      });
      const data = await response.json();

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
    if (!editingLink && formData.slug) {
      const timer = setTimeout(() => {
        checkSlugAvailability(formData.slug);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSlugCheckStatus('idle');
    }
  }, [formData.slug, editingLink, checkSlugAvailability]);

  const loadLinks = async () => {
    try {
      const fetchedLinks = await api.getLinks();
      const linksWithStats = await Promise.all(
        fetchedLinks.map(async (link) => {
          try {
            const stats = await api.getLinkStats(link.id);
            return { ...link, stats };
          } catch {
            return link;
          }
        })
      );
      setLinks(linksWithStats);
    } catch (err) {
      if (err instanceof Error && err.message === 'Not authenticated') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLink(null);
    setFormData({ title: '', dest_number: '', prefill_text: '', source_tag: '', slug: '' });
    setSlugCheckStatus('idle');
    setSlugSuggestions([]);
    setShowModal(true);
  };

  const openEditModal = (link: Link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      dest_number: link.dest_number,
      prefill_text: link.prefill_text || '',
      source_tag: link.source_tag || '',
      slug: link.slug,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await api.updateLink(editingLink.id, {
          title: formData.title,
          dest_number: formData.dest_number,
          prefill_text: formData.prefill_text || undefined,
          source_tag: formData.source_tag || undefined,
        });
      } else {
        await api.createLink({
          title: formData.title,
          dest_number: formData.dest_number,
          prefill_text: formData.prefill_text || undefined,
          source_tag: formData.source_tag || undefined,
          slug: formData.slug || undefined,
        });
      }
      setShowModal(false);
      loadLinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await api.deleteLink(id);
      loadLinks();
    } catch {
      alert('Failed to delete link');
    }
  };

  const copyShortUrl = (slug: string) => {
    const url = `https://leadwa.link/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  const downloadQR = async (linkId: string, slug: string, format: 'png' | 'svg') => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/links/${linkId}/qr?format=${format}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to download QR code');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `leadwa-${slug}-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Leadwa</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Links</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            + Create Link
          </button>
        </div>

        {links.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-4">No links yet. Create your first one!</p>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Create Link
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short URL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last 7d</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{link.title}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => copyShortUrl(link.slug)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          leadwa.link/{link.slug}
                          {copiedSlug === link.slug ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <span className="text-xs">📋</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{link.source_tag || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {link.stats?.total_clicks ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {link.stats?.clicks_last_7_days ? (
                          <Sparkline
                            data={link.stats.clicks_last_7_days}
                            className="text-blue-500"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/links/${link.id}/qr?format=svg`}
                            alt="QR Code"
                            className="w-16 h-16 border border-gray-200 rounded"
                          />
                          <button
                            onClick={() => downloadQR(link.id, link.slug, 'png')}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Download for print
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => openEditModal(link)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingLink ? 'Edit Link' : 'Create Link'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={formData.dest_number}
                  onChange={(e) => setFormData({ ...formData, dest_number: e.target.value })}
                  placeholder="919876543210"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefill Text
                </label>
                <textarea
                  value={formData.prefill_text}
                  onChange={(e) => setFormData({ ...formData, prefill_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Tag
                </label>
                <select
                  value={formData.source_tag}
                  onChange={(e) => setFormData({ ...formData, source_tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a source</option>
                  {SOURCE_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {!editingLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Slug (optional)
                  </label>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">leadwa.link/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                      placeholder="my-custom-link"
                      pattern="[a-z0-9-]{3,32}"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {slugCheckStatus === 'checking' && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {slugCheckStatus === 'available' && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                    {slugCheckStatus === 'unavailable' && (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  {slugCheckStatus === 'available' && (
                    <p className="text-sm text-green-600 flex items-center gap-1 mb-1">
                      <Check className="w-4 h-4" /> leadwa.link/{formData.slug} is available
                    </p>
                  )}
                  {slugCheckStatus === 'unavailable' && (
                    <div className="mb-1">
                      <p className="text-sm text-red-600 flex items-center gap-1 mb-2">
                        <X className="w-4 h-4" /> Already taken, try another
                      </p>
                      {slugSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {slugSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setFormData({ ...formData, slug: suggestion })}
                              className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    3-32 chars, lowercase letters, numbers, hyphens. Leave blank for random.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!(!editingLink && formData.slug && slugCheckStatus !== 'available')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
