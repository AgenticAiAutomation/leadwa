'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Link, LinkStats } from '@/lib/api';
import { Sparkline } from '@/components/Sparkline';

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

  useEffect(() => {
    loadLinks();
  }, []);

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
    } catch (err) {
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
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="my-custom-link"
                    pattern="[a-z0-9-]{3,32}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-32 chars, lowercase letters, numbers, hyphens
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
