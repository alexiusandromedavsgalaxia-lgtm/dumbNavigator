CREATE TABLE IF NOT EXISTS sites (
 domain TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 type TEXT NOT NULL,
 entry TEXT NOT NULL,
 token_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS site_files (
 domain TEXT NOT NULL,
 path TEXT NOT NULL,
 encoding TEXT NOT NULL CHECK (encoding IN ('utf8','base64')),
 content TEXT NOT NULL,
 PRIMARY KEY (domain,path),
 FOREIGN KEY (domain) REFERENCES sites(domain) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sites_published ON sites(published);
CREATE INDEX IF NOT EXISTS idx_site_files_domain ON site_files(domain);
