'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Link, LinkStats, Lead } from '@/lib/api';
import { Sparkline } from '@/components/Sparkline';
import {
  Check, X, Copy, Download, Edit2, Trash2, Link as LinkIcon,
  Phone, UserPlus, TrendingUp, IndianRupee
} from 'lucide-react';

interface LinkWithStats extends Link {
  stats?: LinkStats;
}

const SOURCE_TAGS = ['Instagram', 'Hoarding', 'JustDial', 'IndiaMART', 'Referral', 'Other'];

type Tab = 'overview' | 'links' | 'leads' | 'missed-calls';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'text-ink bg-paper' },
  { value: 'contacted', label: 'Contacted', color: 'text-blue-700 bg-blue-50' },
  { value: 'quoted', label: 'Quoted', color: 'text-purple-700 bg-purple-50' },
  { value: 'won', label: 'Won', color: 'text-bottle-green bg-bottle-green/10' },
  { value: 'lost', label: 'Lost', color: 'text-terracotta bg-terracotta/10' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [links, setLinks] = useState<LinkWithStats[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [linkFormData, setLinkFormData] = useState({
    title: '',
    dest_number: '',
    prefill_text: '',
    source_tag: '',
    slug: '',
  });
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);

  const [leadFormData, setLeadFormData] = useState({
    contact_number: '',
    notes: '',
    link_id: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [fetchedLinks, fetchedLeads] = await Promise.all([
        api.getLinks(),
        api.getLeads(),
      ]);

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
      setLeads(fetchedLeads);
    } catch (err) {
      if (err instanceof Error && err.message === 'Not authenticated') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Slug checker
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugCheckStatus('idle');
      return;
    }
    if (!/^[a-z0-9-]{3,32}$/.test(slug)) {
      setSlugCheckStatus('unavailable');
      setSlugSuggestions([]);
      return;
    }

    setSlugCheckStatus('checking');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.leadwa.co'}/links/check-slug?slug=${encodeURIComponent(slug)}`,
        { credentials: 'include' }
      );
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
    if (!editingLink && linkFormData.slug) {
      const timer = setTimeout(() => {
        checkSlugAvailability(linkFormData.slug);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSlugCheckStatus('idle');
    }
  }, [linkFormData.slug, editingLink, checkSlugAvailability]);

  const openCreateLinkModal = () => {
    setEditingLink(null);
    setLinkFormData({ title: '', dest_number: '', prefill_text: '', source_tag: '', slug: '' });
    setSlugCheckStatus('idle');
    setSlugSuggestions([]);
    setShowLinkModal(true);
  };

  const openEditLinkModal = (link: Link) => {
    setEditingLink(link);
    setLinkFormData({
      title: link.title,
      dest_number: link.dest_number,
      prefill_text: link.prefill_text || '',
      source_tag: link.source_tag || '',
      slug: link.slug,
    });
    setShowLinkModal(true);
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await api.updateLink(editingLink.id, {
          title: linkFormData.title,
          dest_number: linkFormData.dest_number,
          prefill_text: linkFormData.prefill_text || undefined,
          source_tag: linkFormData.source_tag || undefined,
        });
      } else {
        await api.createLink({
          title: linkFormData.title,
          dest_number: linkFormData.dest_number,
          prefill_text: linkFormData.prefill_text || undefined,
          source_tag: linkFormData.source_tag || undefined,
          slug: linkFormData.slug || undefined,
        });
      }
      setShowLinkModal(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await api.deleteLink(id);
      loadData();
    } catch {
      alert('Failed to delete link');
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({
        contact_number: leadFormData.contact_number,
        notes: leadFormData.notes || undefined,
        link_id: leadFormData.link_id || undefined,
      });
      setShowLeadModal(false);
      setLeadFormData({ contact_number: '', notes: '', link_id: '' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create lead');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      await api.updateLead(leadId, { status });
      loadData();
    } catch {
      alert('Failed to update lead status');
    }
  };

  const handleUpdateLeadValue = async (leadId: string, value: number) => {
    try {
      await api.updateLead(leadId, { value_inr: value });
      loadData();
    } catch {
      alert('Failed to update lead value');
    }
  };

  const copyShortUrl = (slug: string) => {
    const url = `https://leadwa.link/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const downloadQR = async (linkId: string, slug: string, format: 'png' | 'svg') => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.leadwa.co'}/links/${linkId}/qr?format=${format}`;
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

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  const filteredLeads = (source?: 'missed_call' | 'link_click' | 'manual') =>
    source ? leads.filter((l) => l.source === source) : leads;

  // Overview metrics
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'won').length;
  const totalValue = leads
    .filter((l) => l.status === 'won')
    .reduce((sum, l) => sum + (l.value_inr || 0), 0);

  const leadsBySource = {
    link_click: leads.filter((l) => l.source === 'link_click').length,
    missed_call: leads.filter((l) => l.source === 'missed_call').length,
    manual: leads.filter((l) => l.source === 'manual').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-ink">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-headline text-2xl text-ink">Leadwa</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-ink/60 hover:text-ink transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { key: 'overview' as Tab, label: 'Overview', icon: TrendingUp },
              { key: 'links' as Tab, label: 'Links', icon: LinkIcon },
              { key: 'leads' as Tab, label: 'Leads', icon: UserPlus },
              { key: 'missed-calls' as Tab, label: 'Missed Calls', icon: Phone },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === key
                    ? 'border-bottle-green text-bottle-green'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-ink/10">
                <div className="text-sm text-ink/60 mb-1">Total Leads</div>
                <div className="text-3xl font-headline text-ink">{totalLeads}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-ink/10">
                <div className="text-sm text-ink/60 mb-1">Won</div>
                <div className="text-3xl font-headline text-bottle-green">{wonLeads}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-ink/10">
                <div className="text-sm text-ink/60 mb-1">Total Value</div>
                <div className="text-3xl font-headline text-bottle-green flex items-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {totalValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-ink/10">
              <h3 className="font-headline text-lg text-ink mb-4">Leads by Source</h3>
              <div className="space-y-3">
                {Object.entries(leadsBySource).map(([source, count]) => (
                  <div key={source} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-ink/70 capitalize">{source.replace('_', ' ')}</div>
                    <div className="flex-1 bg-paper rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-bottle-green h-full transition-all"
                        style={{ width: `${totalLeads ? (count / totalLeads) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm font-semibold text-ink">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl text-ink">My Links</h2>
              <button
                onClick={openCreateLinkModal}
                className="bg-bottle-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-bottle-green/90 transition-all cursor-pointer"
              >
                + Create Link
              </button>
            </div>

            {links.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-ink/10">
                <p className="text-ink/60 mb-4">No links yet. Create your first one!</p>
                <button
                  onClick={openCreateLinkModal}
                  className="bg-bottle-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-bottle-green/90 transition-all cursor-pointer"
                >
                  Create Link
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-ink/10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-paper border-b border-ink/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Short URL</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Clicks</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Last 7d</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">QR</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {links.map((link) => (
                        <tr key={link.id} className="hover:bg-paper/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-ink">{link.title}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => copyShortUrl(link.slug)}
                              className="text-bottle-green hover:text-bottle-green/80 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              leadwa.link/{link.slug}
                              {copiedSlug === link.slug ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink/60">{link.source_tag || '—'}</td>
                          <td className="px-4 py-3 text-sm text-ink">{link.stats?.total_clicks ?? 0}</td>
                          <td className="px-4 py-3">
                            {link.stats?.clicks_last_7_days ? (
                              <Sparkline data={link.stats.clicks_last_7_days} className="text-bottle-green" />
                            ) : (
                              <span className="text-xs text-ink/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => downloadQR(link.id, link.slug, 'png')}
                              className="text-bottle-green hover:text-bottle-green/80 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              PNG
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm flex gap-2">
                            <button
                              onClick={() => openEditLinkModal(link)}
                              className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="text-terracotta hover:text-terracotta/80 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl text-ink">All Leads</h2>
              <button
                onClick={() => setShowLeadModal(true)}
                className="bg-bottle-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-bottle-green/90 transition-all cursor-pointer"
              >
                + Add Lead
              </button>
            </div>

            <LeadsTable
              leads={filteredLeads()}
              onUpdateStatus={handleUpdateLeadStatus}
              onUpdateValue={handleUpdateLeadValue}
            />
          </div>
        )}

        {/* Missed Calls Tab */}
        {activeTab === 'missed-calls' && (
          <div>
            <h2 className="font-headline text-xl text-ink mb-6">Missed Calls</h2>
            <LeadsTable
              leads={filteredLeads('missed_call')}
              onUpdateStatus={handleUpdateLeadStatus}
              onUpdateValue={handleUpdateLeadValue}
            />
          </div>
        )}
      </main>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline text-xl text-ink mb-4">
              {editingLink ? 'Edit Link' : 'Create Link'}
            </h3>
            <form onSubmit={handleSubmitLink} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Title <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={linkFormData.title}
                  onChange={(e) => setLinkFormData({ ...linkFormData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  WhatsApp Number <span className="text-terracotta">*</span>
                </label>
                <input
                  type="tel"
                  value={linkFormData.dest_number}
                  onChange={(e) => setLinkFormData({ ...linkFormData, dest_number: e.target.value })}
                  placeholder="919876543210"
                  required
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Prefill Text</label>
                <textarea
                  value={linkFormData.prefill_text}
                  onChange={(e) => setLinkFormData({ ...linkFormData, prefill_text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Source Tag</label>
                <select
                  value={linkFormData.source_tag}
                  onChange={(e) => setLinkFormData({ ...linkFormData, source_tag: e.target.value })}
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
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
                  <label className="block text-sm font-semibold text-ink mb-2">Custom Slug (optional)</label>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-ink/60">leadwa.link/</span>
                    <input
                      type="text"
                      value={linkFormData.slug}
                      onChange={(e) => setLinkFormData({ ...linkFormData, slug: e.target.value.toLowerCase() })}
                      placeholder="my-custom-link"
                      pattern="[a-z0-9-]{3,32}"
                      className="flex-1 px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
                    />
                    {slugCheckStatus === 'checking' && (
                      <div className="w-5 h-5 border-2 border-bottle-green border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {slugCheckStatus === 'available' && <Check className="w-5 h-5 text-bottle-green" />}
                    {slugCheckStatus === 'unavailable' && <X className="w-5 h-5 text-terracotta" />}
                  </div>
                  {slugCheckStatus === 'available' && (
                    <p className="text-sm text-bottle-green flex items-center gap-1 mb-1">
                      <Check className="w-4 h-4" /> leadwa.link/{linkFormData.slug} is available
                    </p>
                  )}
                  {slugCheckStatus === 'unavailable' && (
                    <div className="mb-1">
                      <p className="text-sm text-terracotta flex items-center gap-1 mb-2">
                        <X className="w-4 h-4" /> Already taken, try another
                      </p>
                      {slugSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {slugSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setLinkFormData({ ...linkFormData, slug: suggestion })}
                              className="text-xs px-2 py-1 bg-paper border border-ink/20 rounded hover:bg-ink/5 transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-ink/60 mt-1">
                    3-32 chars, lowercase letters, numbers, hyphens. Leave blank for random.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-3 border border-ink/20 rounded-lg text-ink hover:bg-paper transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!(!editingLink && linkFormData.slug && slugCheckStatus !== 'available')}
                  className="flex-1 px-4 py-3 bg-bottle-green text-white rounded-lg hover:bg-bottle-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="font-headline text-xl text-ink mb-4">Add Lead Manually</h3>
            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Contact Number <span className="text-terracotta">*</span>
                </label>
                <input
                  type="tel"
                  value={leadFormData.contact_number}
                  onChange={(e) => setLeadFormData({ ...leadFormData, contact_number: e.target.value })}
                  placeholder="919876543210"
                  required
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Link (optional)</label>
                <select
                  value={leadFormData.link_id}
                  onChange={(e) => setLeadFormData({ ...leadFormData, link_id: e.target.value })}
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all"
                >
                  <option value="">No link</option>
                  {links.map((link) => (
                    <option key={link.id} value={link.id}>
                      {link.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Notes</label>
                <textarea
                  value={leadFormData.notes}
                  onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="flex-1 px-4 py-3 border border-ink/20 rounded-lg text-ink hover:bg-paper transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-bottle-green text-white rounded-lg hover:bg-bottle-green/90 transition-all cursor-pointer"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Leads Table Component
function LeadsTable({
  leads,
  onUpdateStatus,
  onUpdateValue,
}: {
  leads: Lead[];
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateValue: (id: string, value: number) => void;
}) {
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-ink/10">
        <p className="text-ink/60">No leads yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-ink/10">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-paper border-b border-ink/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Link</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Value (₹)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink/70 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {leads.map((lead) => {
              const statusOption = STATUS_OPTIONS.find((opt) => opt.value === lead.status);
              return (
                <tr key={lead.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{lead.contact_number}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-ink/60">
                      {lead.source === 'link_click' && <LinkIcon className="w-3 h-3" />}
                      {lead.source === 'missed_call' && <Phone className="w-3 h-3" />}
                      {lead.source === 'manual' && <UserPlus className="w-3 h-3" />}
                      {lead.source.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink/60">{lead.link_title || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-bottle-green transition-all cursor-pointer ${statusOption?.color}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingValue === lead.id ? (
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => {
                          if (tempValue) onUpdateValue(lead.id, parseInt(tempValue, 10));
                          setEditingValue(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (tempValue) onUpdateValue(lead.id, parseInt(tempValue, 10));
                            setEditingValue(null);
                          }
                        }}
                        autoFocus
                        className="w-24 px-2 py-1 border border-bottle-green rounded focus:outline-none focus:ring-2 focus:ring-bottle-green"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingValue(lead.id);
                          setTempValue(lead.value_inr?.toString() || '');
                        }}
                        className="text-ink hover:text-bottle-green transition-colors cursor-pointer"
                      >
                        {lead.value_inr ? `₹${lead.value_inr.toLocaleString('en-IN')}` : '—'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink/60">
                    {new Date(lead.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
