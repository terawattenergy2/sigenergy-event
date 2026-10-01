CREATE TABLE IF NOT EXISTS event_state (
 id integer PRIMARY KEY CHECK(id=1), registrations_closed boolean NOT NULL DEFAULT false,
 finalized boolean NOT NULL DEFAULT false, reveal_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO event_state(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS participants (
 id uuid PRIMARY KEY, code text NOT NULL UNIQUE CHECK(code ~ '^TE-[0-9]{3}$' AND substring(code FROM 4)::integer BETWEEN 1 AND 150), identity_hash text NOT NULL UNIQUE,
 request_key_hash text NOT NULL UNIQUE, name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 120),
 company text NOT NULL CHECK(char_length(company) BETWEEN 1 AND 120),
 position text NOT NULL CHECK(char_length(position) BETWEEN 1 AND 120),
 consent_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
 line_user_id text UNIQUE, line_linked_at timestamptz
);
CREATE TABLE IF NOT EXISTS prize_types (
 id text PRIMARY KEY, label text NOT NULL, discount integer NOT NULL, cap integer NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0), display_order integer NOT NULL
);
INSERT INTO prize_types(id,label,discount,cap,quantity,display_order) VALUES
 ('sigenstor','SigenStor',5,20000,1,1),('neo','SigenStor NEO',3,10000,2,2),('bundle','Sigenergy + JA Solar',2,5000,10,3)
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS draws (
 id uuid PRIMARY KEY, request_key uuid NOT NULL UNIQUE, participant_id uuid NOT NULL UNIQUE REFERENCES participants(id),
 prize_id text NOT NULL REFERENCES prize_types(id), operator text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS draws_prize_id_idx ON draws(prize_id);
CREATE TABLE IF NOT EXISTS admin_session (
 id integer PRIMARY KEY CHECK(id=1), token_hash text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
 bucket text PRIMARY KEY, hits integer NOT NULL, resets_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS webhook_events (
 event_id text PRIMARY KEY, state text NOT NULL CHECK(state IN ('processing','done')),
 leased_until timestamptz NOT NULL, completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS line_outbox (
 id uuid PRIMARY KEY, participant_id uuid NOT NULL REFERENCES participants(id), kind text NOT NULL CHECK(kind IN ('winner','not_selected')),
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
 leased_until timestamptz, sent_at timestamptz, last_error text,
 UNIQUE(participant_id,kind)
);
CREATE INDEX IF NOT EXISTS line_outbox_pending_idx ON line_outbox(available_at) WHERE sent_at IS NULL;
