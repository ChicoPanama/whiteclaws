-- Insert Immunefi Audit Reports into Resources
-- These are static PDFs in public/audits/ for WhiteClaws Research Tab

INSERT INTO resources (title, description, type, url, file_path, author_id, downloads, tags) VALUES
(
  'Oak Network Audit Report',
  'Immunefi security audit report for Oak Network covering PaymentTreasury functionality.',
  'pdf',
  '/audits/001_Oak_Network.pdf',
  'audits/001_Oak_Network.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'oak-network', 'payment', 'treasury']
),
(
  'Layer3.xyz Audit Report',
  'Comprehensive security audit of Layer3.xyz platform by Immunefi.',
  'pdf',
  '/audits/002_xyz.pdf',
  'audits/002_xyz.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'layer3', 'web3', 'rewards']
),
(
  'CC Protocol Audit Report',
  'Immunefi security assessment for CC Protocol smart contracts.',
  'pdf',
  '/audits/003_CC_Protocol.pdf',
  'audits/003_CC_Protocol.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'cc-protocol', 'defi', 'lending']
),
(
  'Plume Network Audit Report',
  'Full-scope security audit for Plume Network by Immunefi.',
  'pdf',
  '/audits/004_Plume_Network.pdf',
  'audits/004_Plume_Network.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'plume-network', 'rwa', 'tokenization']
),
(
  'Plaza Finance Audit Report',
  'Smart contract security audit for Plaza Finance DeFi protocol.',
  'pdf',
  '/audits/005_Plaza_Finance.pdf',
  'audits/005_Plaza_Finance.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'plaza-finance', 'defi', 'yield']
),
(
  'Hoenn Audit Report',
  'Security audit report for Hoenn protocol by Immunefi.',
  'pdf',
  '/audits/006_Hoenn.pdf',
  'audits/006_Hoenn.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'hoenn', 'gaming', 'nft']
),
(
  'Helios Finance Audit Report',
  'Comprehensive smart contract audit for Helios Finance.',
  'pdf',
  '/audits/007_Helios.pdf',
  'audits/007_Helios.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'helios-finance', 'defi', 'trading']
),
(
  'Halogen Audit Report',
  'Immunefi security audit for Halogen protocol.',
  'pdf',
  '/audits/008_Halogen.pdf',
  'audits/008_Halogen.pdf',
  NULL,
  0,
  ARRAY['immunefi', 'audit', 'halogen', 'defi', 'staking']
);

-- Create index for audit report queries
CREATE INDEX IF NOT EXISTS idx_resources_audit ON resources USING GIN(tags) WHERE type = 'pdf';
