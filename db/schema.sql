-- FrontCanvas 数据库 schema
-- 可重复执行（全部 IF NOT EXISTS / OR REPLACE）

-- ============ 线索 ============
CREATE TABLE IF NOT EXISTS leads (
  id                text PRIMARY KEY,
  place_key         text UNIQUE NOT NULL,           -- 来源去重键（name|address 归一化）
  name              text NOT NULL,                  -- 真名，仅内部使用，绝不出现在对外页面
  masked_name       text NOT NULL,                  -- 对外展示用
  slug              text UNIQUE NOT NULL,           -- /p/<slug>，无品牌线索
  website           text,
  domain            text,
  email             text,
  email_source      text,                           -- site|mailto|contact-form|social|guess
  email_confidence  int DEFAULT 0,                  -- 0-100
  phone             text,
  socials           jsonb DEFAULT '{}'::jsonb,
  address           text,
  city              text,
  state             text,
  zip               text,
  lat               double precision,
  lng               double precision,
  rating            numeric(2,1),
  reviews_count     int,
  price_level       int,                            -- 1..4 ($..$$$$)
  cuisine           text,
  is_chain          boolean DEFAULT false,
  buying_power      int DEFAULT 0,                  -- 0-100 购买力评分
  status            text DEFAULT 'new',             -- new|audited|designed|emailed|replied|won|dead|skipped
  skip_reason       text,
  discovered_at     timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_status_idx      ON leads(status);
CREATE INDEX IF NOT EXISTS leads_discovered_idx  ON leads(discovered_at DESC);
CREATE INDEX IF NOT EXISTS leads_buying_idx      ON leads(buying_power DESC);

-- 社媒渠道（2026-08-16）：阶段 A 对每一家都要查 Facebook / Instagram。
-- socials 形如 {"facebook":{"url":...,"name":...,"matchedOn":[...]}, "instagram":{...}}。
-- 单独记时间戳是为了区分「查过、确实没有」和「压根没查过」—— 前者不必重查。
ALTER TABLE leads ADD COLUMN IF NOT EXISTS socials_checked_at timestamptz;

-- ============ 官网烂度审计 ============
CREATE TABLE IF NOT EXISTS audits (
  id                text PRIMARY KEY,
  lead_id           text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  psi_mobile        int,
  psi_desktop       int,
  lcp_ms            int,
  cls               numeric(5,3),
  has_viewport      boolean,
  has_ssl           boolean,
  is_responsive     boolean,
  has_online_menu   boolean,
  has_ordering      boolean,
  has_reservation   boolean,
  platform          text,                           -- wix|squarespace|wordpress|godaddy|weebly|custom|none
  copyright_year    int,
  title             text,
  issues            jsonb DEFAULT '[]'::jsonb,      -- [{code,severity,label,detail}]
  badness           int DEFAULT 0,                  -- 0-100，越高越该重做
  old_shot_key      text,                           -- R2: 旧站截图
  site_images       jsonb DEFAULT '[]'::jsonb,      -- 从他们官网收来的照片 [{key,w,h,bytes,src}]，R2 assets/<slug>/
  audited_at        timestamptz DEFAULT now()
);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS site_images jsonb DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS audits_lead_idx ON audits(lead_id);

-- ============ 我们生成的设计稿 ============
CREATE TABLE IF NOT EXISTS designs (
  id                text PRIMARY KEY,
  lead_id           text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  slug              text UNIQUE NOT NULL,
  headline          text,
  concept           text,
  palette           jsonb DEFAULT '{}'::jsonb,
  shot_desktop_key  text,
  shot_mobile_key   text,
  og_key            text,
  built_at          timestamptz DEFAULT now(),
  deployed_at       timestamptz,
  first_viewed_at   timestamptz,
  views             int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS designs_lead_idx ON designs(lead_id);

-- ============ 外联 ============
CREATE TABLE IF NOT EXISTS outreach (
  id                text PRIMARY KEY,
  lead_id           text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  design_id         text REFERENCES designs(id) ON DELETE SET NULL,
  to_email          text NOT NULL,
  subject           text NOT NULL,
  body_html         text,
  body_text         text,
  provider          text,                           -- workspace|ses|dryrun
  provider_msg_id   text,
  status            text DEFAULT 'queued',          -- queued|sent|failed|bounced|complained|replied|unsubscribed
  error             text,
  unsub_token       text UNIQUE NOT NULL,
  queued_at         timestamptz DEFAULT now(),
  sent_at           timestamptz,
  opened_at         timestamptz,
  clicked_at        timestamptz
);
CREATE INDEX IF NOT EXISTS outreach_status_idx ON outreach(status);
CREATE INDEX IF NOT EXISTS outreach_lead_idx   ON outreach(lead_id);

-- 多渠道外联（2026-08-16）：同一家店可能同时有邮箱、Facebook 主页、Instagram 账号，
-- 三条渠道各发一次、各记一行。channel 区分渠道，to_handle 存社媒主页地址。
-- to_email 的 NOT NULL 一并放开 —— 只有社媒能联系上的店没有邮箱可填。
-- channel: email|facebook|instagram
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS channel   text NOT NULL DEFAULT 'email';
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS to_handle text;
ALTER TABLE outreach ALTER COLUMN to_email DROP NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_channel_idx ON outreach(channel);
-- 「这家店的这条渠道发过没有」是判定表每天要查的问题，建复合索引
CREATE INDEX IF NOT EXISTS outreach_lead_channel_idx ON outreach(lead_id, channel);

-- ============ 收件箱日报（09:00 任务写，/admin 读）============
CREATE TABLE IF NOT EXISTS digests (
  day               date PRIMARY KEY,
  body              text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- ============ 退订抑制（CAN-SPAM 硬要求）============
CREATE TABLE IF NOT EXISTS suppression (
  email             text PRIMARY KEY,
  reason            text NOT NULL,                  -- unsubscribe|bounce|complaint|manual
  source            text,
  created_at        timestamptz DEFAULT now()
);

-- ============ 错误收件箱 ============
CREATE TABLE IF NOT EXISTS errors (
  id                text PRIMARY KEY,
  fingerprint       text UNIQUE NOT NULL,
  name              text,
  message           text,
  stack             text,
  route             text,
  severity          text DEFAULT 'error',           -- warn|error|fatal
  scope             text,                           -- server|client|edge|cron
  meta              jsonb DEFAULT '{}'::jsonb,
  count             int DEFAULT 1,
  first_seen        timestamptz DEFAULT now(),
  last_seen         timestamptz DEFAULT now(),
  resolved          boolean DEFAULT false,
  resolved_at       timestamptz
);
CREATE INDEX IF NOT EXISTS errors_open_idx ON errors(resolved, last_seen DESC);

-- ============ 订单与权益 ============
CREATE TABLE IF NOT EXISTS orders (
  id                text PRIMARY KEY,
  user_id           text,                           -- Clerk user id
  email             text NOT NULL,
  lead_id           text REFERENCES leads(id) ON DELETE SET NULL,
  design_id         text REFERENCES designs(id) ON DELETE SET NULL,
  tier              text NOT NULL,                  -- launch|complete|care
  stripe_session_id text UNIQUE,
  stripe_pi         text,
  amount_cents      int NOT NULL,
  currency          text DEFAULT 'usd',
  status            text DEFAULT 'pending',         -- pending|paid|refunded|canceled
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx  ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email);

-- Stripe webhook 幂等
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id          text PRIMARY KEY,
  type              text,
  processed_at      timestamptz DEFAULT now()
);

-- ============ 联系表单 ============
CREATE TABLE IF NOT EXISTS contacts (
  id                text PRIMARY KEY,
  name              text,
  email             text NOT NULL,
  message           text NOT NULL,
  source            text,
  handled           boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ============ 测试收件箱（Cloudflare Email Worker 写入）============
CREATE TABLE IF NOT EXISTS inbox (
  id                text PRIMARY KEY,
  to_addr           text NOT NULL,
  from_addr         text,
  subject           text,
  body_text         text,
  headers           jsonb DEFAULT '{}'::jsonb,
  auth_results      text,                           -- DKIM/SPF 认证头，注册实测的送达证据
  received_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inbox_to_idx ON inbox(to_addr, received_at DESC);

-- ============ 定时任务运行日志 ============
CREATE TABLE IF NOT EXISTS cron_runs (
  id                text PRIMARY KEY,
  job               text NOT NULL,                  -- discover|design|outreach
  started_at        timestamptz DEFAULT now(),
  finished_at       timestamptz,
  ok                boolean,
  stats             jsonb DEFAULT '{}'::jsonb,
  log               text
);
CREATE INDEX IF NOT EXISTS cron_runs_job_idx ON cron_runs(job, started_at DESC);

-- ============ 已扫描的地理网格（任务A 从 Ypsilanti 向外扩的进度指针）============
CREATE TABLE IF NOT EXISTS geo_cells (
  id                text PRIMARY KEY,               -- "lat,lng,radius"
  lat               double precision NOT NULL,
  lng               double precision NOT NULL,
  radius_m          int NOT NULL,
  ring              int NOT NULL DEFAULT 0,         -- 距 Ypsilanti 的环号，0 = 起点
  label             text,
  scanned_at        timestamptz,
  found_count       int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS geo_cells_ring_idx ON geo_cells(ring, scanned_at NULLS FIRST);

-- 区域阶梯（2026-09-13）：网格按锚点城市分组推进，priority 越小越先扫。
-- 旧的 Ypsilanti 同心环即 priority 0，历史扫描进度原样保留。
ALTER TABLE geo_cells ADD COLUMN IF NOT EXISTS priority int NOT NULL DEFAULT 0;
ALTER TABLE geo_cells ADD COLUMN IF NOT EXISTS region   text;
UPDATE geo_cells SET region = 'MI · Ann Arbor / Ypsilanti' WHERE region IS NULL;
CREATE INDEX IF NOT EXISTS geo_cells_order_idx ON geo_cells(priority, ring, scanned_at NULLS FIRST);
