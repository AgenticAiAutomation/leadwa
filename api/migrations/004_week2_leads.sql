-- Week 2: Missed calls bridge + Outcome-based lead ledger

-- Leads table (source of truth for all lead outcomes)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('link_click', 'missed_call', 'manual')),
    contact_number TEXT NOT NULL,
    link_id UUID REFERENCES links(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),
    value_inr INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Missed calls table
CREATE TABLE missed_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caller_number TEXT NOT NULL,
    called_at TIMESTAMPTZ NOT NULL,
    sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missed_calls_user_id ON missed_calls(user_id);
CREATE INDEX idx_missed_calls_called_at ON missed_calls(called_at);
