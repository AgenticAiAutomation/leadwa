/**
 * API client for Leadwa backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

export interface User {
  id: string;
  email: string;
  business_name?: string;
  whatsapp_number?: string;
  created_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  slug: string;
  dest_number: string;
  prefill_text?: string;
  title: string;
  source_tag?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkStats {
  total_clicks: number;
  clicks_last_7_days: { date: string; count: number }[];
  top_country?: string;
  mobile_count: number;
  desktop_count: number;
}

export interface Lead {
  id: string;
  user_id: string;
  source: 'link_click' | 'missed_call' | 'manual';
  contact_number: string;
  link_id?: string;
  link_title?: string;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  value_inr?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SignupData {
  email: string;
  password: string;
  business_name?: string;
  whatsapp_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateLinkData {
  title: string;
  dest_number: string;
  prefill_text?: string;
  source_tag?: string;
  slug?: string;
}

export interface UpdateLinkData {
  title?: string;
  dest_number?: string;
  prefill_text?: string;
  source_tag?: string;
  slug?: string;
}

class ApiClient {
  async signup(data: SignupData): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Signup failed' }));
      throw new Error(err.detail || 'Signup failed');
    }
  }

  async login(data: LoginData): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async me(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  }

  async getLinks(): Promise<Link[]> {
    const res = await fetch(`${API_BASE}/links`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch links');
    return res.json();
  }

  async createLink(data: CreateLinkData): Promise<Link> {
    const res = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create link' }));
      throw new Error(err.detail || 'Failed to create link');
    }
    return res.json();
  }

  async updateLink(id: string, data: UpdateLinkData): Promise<Link> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update link');
    return res.json();
  }

  async deleteLink(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete link');
  }

  async getLinkStats(id: string): Promise<LinkStats> {
    const res = await fetch(`${API_BASE}/links/${id}/stats`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }

  async getLeads(source?: string, status?: string): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE}/leads${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  }

  async createLead(data: { contact_number: string; notes?: string; link_id?: string }): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create lead' }));
      throw new Error(err.detail || 'Failed to create lead');
    }
    return res.json();
  }

  async updateLead(id: string, data: { status?: string; value_inr?: number; notes?: string }): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  }
}

export const api = new ApiClient();
