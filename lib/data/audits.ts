export interface AuditEntry {
  id: string
  title: string
  protocol: string
  auditor: string
  date: string
  pdfPath: string
  category: string
}

// Cataloged from /public/audits/ — every PDF we have
export const auditCatalog: AuditEntry[] = [
  // === WhiteClaws Original Audits ===
  { id: 'wc-001', title: 'Oak Network Security Audit', protocol: 'Oak Network', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/001_Oak_Network.pdf', category: 'DeFi' },
  { id: 'wc-002', title: 'XYZ Protocol Security Audit', protocol: 'XYZ', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/002_xyz.pdf', category: 'DeFi' },
  { id: 'wc-003', title: 'CC Protocol Security Audit', protocol: 'CC Protocol', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/003_CC_Protocol.pdf', category: 'DeFi' },
  { id: 'wc-004', title: 'Plume Network Security Audit', protocol: 'Plume Network', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/004_Plume_Network.pdf', category: 'L1/L2' },
  { id: 'wc-005', title: 'Plaza Finance Security Audit', protocol: 'Plaza Finance', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/005_Plaza_Finance.pdf', category: 'DeFi' },
  { id: 'wc-006', title: 'Hoenn Security Audit', protocol: 'Hoenn', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/006_Hoenn.pdf', category: 'DeFi' },
  { id: 'wc-007', title: 'Helios Security Audit', protocol: 'Helios', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/007_Helios.pdf', category: 'DeFi' },
  { id: 'wc-008', title: 'Halogen Security Audit', protocol: 'Halogen', auditor: 'WhiteClaws', date: '2025', pdfPath: '/audits/008_Halogen.pdf', category: 'DeFi' },

  // === Immunefi ===
  { id: 'imm-vaults', title: 'Immunefi Vaults System Audit', protocol: 'Immunefi', auditor: 'Immunefi Internal', date: '2023-02', pdfPath: '/audits/2023-02-03%20-%20Immunefi%20-%20Internal%20Audit%20of%20the%20Vaults%20system.pdf', category: 'Infrastructure' },

  // === Scroll ===
  { id: 'scroll-zktrie', title: 'Scroll zkTrie Security Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2023-07', pdfPath: '/audits/2023-07-scroll-zktrie-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-l2geth-init', title: 'Scroll L2geth Initial Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2023-08', pdfPath: '/audits/2023-08-scrollL2geth-initial-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-l2geth', title: 'Scroll L2geth Security Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2023-08', pdfPath: '/audits/2023-08-scrollL2geth-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-4844', title: 'Scroll 4844 Blob Security Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2024-04', pdfPath: '/audits/2024-04-scroll-4844-blob-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-euclid1', title: 'Scroll Euclid Phase 1 Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2025-04', pdfPath: '/audits/2025-04-scroll-euclid-phase1-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-euclid2', title: 'Scroll Euclid Phase 2 Review', protocol: 'Scroll', auditor: 'Trail of Bits', date: '2025-04', pdfPath: '/audits/2025-04-scroll-euclid-phase2-securityreview.pdf', category: 'L1/L2' },
  { id: 'scroll-zellic1', title: 'Scroll Zellic Audit (May 2023)', protocol: 'Scroll', auditor: 'Zellic', date: '2023-05', pdfPath: '/audits/Scroll%20-%2005.26.23%20Zellic%20Audit%20Report.pdf', category: 'L1/L2' },
  { id: 'scroll-zellic2', title: 'Scroll Zellic Audit (Sep 2023)', protocol: 'Scroll', auditor: 'Zellic', date: '2023-09', pdfPath: '/audits/Scroll%20-%2009.27.23%20Zellic%20Audit%20Report.pdf', category: 'L1/L2' },
  { id: 'scroll-lido', title: 'Scroll Lido Gateway Audit', protocol: 'Scroll / Lido', auditor: 'Zellic', date: '2023', pdfPath: '/audits/Scroll%20Lido%20Gateway%20-%20Zellic%20Audit%20Report.pdf', category: 'Bridge' },

  // === ALEX ===
  { id: 'alex-bridge', title: 'ALEX Bridge Audit', protocol: 'ALEX', auditor: 'External', date: '2023-04', pdfPath: '/audits/ALEX_Audit_Bridge_2023-04.pdf', category: 'Bridge' },
  { id: 'alex-bridge-cf', title: 'ALEX Bridge Audit (CoinFabrik)', protocol: 'ALEX', auditor: 'CoinFabrik', date: '2022-12', pdfPath: '/audits/ALEX_Audit_bridge_coinfabrik_202212.pdf', category: 'Bridge' },
  { id: 'alex-pool', title: 'ALEX Pool Equation Audit', protocol: 'ALEX', auditor: 'External', date: '2021-11', pdfPath: '/audits/AlexGo_Audit_202111_Pool_Equation.pdf', category: 'DeFi' },
  { id: 'alex-launchpad', title: 'ALEX Launchpad & Vault Audit', protocol: 'ALEX', auditor: 'External', date: '2022-01', pdfPath: '/audits/AlexGo_Audit_202201_Launchpad_Vault_Reserve.pdf', category: 'DeFi' },
  { id: 'alex-dao', title: 'ALEX DAO Audit', protocol: 'ALEX', auditor: 'External', date: '2022-02', pdfPath: '/audits/AlexGo_Audit_202202_DAO.pdf', category: 'Governance' },
  { id: 'alex-crp', title: 'ALEX Launchpad v1.1 & AutoALEX Audit', protocol: 'ALEX', auditor: 'External', date: '2022-04', pdfPath: '/audits/AlexGo_Audit_202204_Launchpadv1.1_AutoALEX_CRP.pdf', category: 'DeFi' },
  { id: 'alex-la', title: 'ALEX Least Authority Audit', protocol: 'ALEX', auditor: 'Least Authority', date: '2022', pdfPath: '/audits/Least_Authority_ALEX_Protocol_Smart_Contracts_Final_Audit_Report.pdf', category: 'DeFi' },

  // === Alchemix ===
  { id: 'alchemix-v2', title: 'Alchemix v2 Audit', protocol: 'Alchemix', auditor: 'External', date: '2022', pdfPath: '/audits/Alchemix_v2.pdf', category: 'DeFi' },

  // === Zest Protocol ===
  { id: 'zest-v2', title: 'Zest Protocol v2 Audit', protocol: 'Zest', auditor: 'Clarity Alliance', date: '2024', pdfPath: '/audits/Clarity%20Alliance%20-%20Zest%20Protocol%20v2.pdf', category: 'DeFi' },
  { id: 'zest-v2-upgrade', title: 'Zest Protocol v2 Upgrade Audit', protocol: 'Zest', auditor: 'Clarity Alliance', date: '2024', pdfPath: '/audits/Clarity%20Alliance%20-%20Zest%20Protocol%20v2%20Upgrade.pdf', category: 'DeFi' },
  { id: 'zest-v2-upgrade2', title: 'Zest Protocol v2 Upgrade V2 Audit', protocol: 'Zest', auditor: 'Clarity Alliance', date: '2024', pdfPath: '/audits/Clarity%20Alliance%20-%20Zest%20Protocol%20v2%20Upgrade%20V2.pdf', category: 'DeFi' },
  { id: 'zest-ca-2024', title: 'Zest ClarityAlliance Audit', protocol: 'Zest', auditor: 'Clarity Alliance', date: '2024-11', pdfPath: '/audits/ClarityAlliance-2024-11.pdf', category: 'DeFi' },
  { id: 'zest-cf-2023', title: 'Zest CoinFabrik Audit', protocol: 'Zest', auditor: 'CoinFabrik', date: '2023-11', pdfPath: '/audits/CoinFabrik-2023-11.pdf', category: 'DeFi' },

  // === Multi-auditor ===
  { id: 'ambisafe-jul', title: 'Ambisafe Security Audit (Jul)', protocol: 'Various', auditor: 'Ambisafe', date: '2023-07', pdfPath: '/audits/ambisafe-2023-07-18.pdf', category: 'DeFi' },
  { id: 'ambisafe-nov', title: 'Ambisafe Security Audit (Nov)', protocol: 'Various', auditor: 'Ambisafe', date: '2023-11', pdfPath: '/audits/ambisafe-2023-11-10.pdf', category: 'DeFi' },
  { id: 'certik', title: 'CertiK Security Audit', protocol: 'Various', auditor: 'CertiK', date: '2023-05', pdfPath: '/audits/certik-2023-05-04.pdf', category: 'DeFi' },
  { id: 'cyfrin', title: 'Cyfrin Security Audit', protocol: 'Various', auditor: 'Cyfrin', date: '2023-11', pdfPath: '/audits/cyfrin-2023-11-10.pdf', category: 'DeFi' },
  { id: 'hacken', title: 'Hacken Security Audit', protocol: 'Various', auditor: 'Hacken', date: '2023-05', pdfPath: '/audits/hacken-2023-05-22.pdf', category: 'DeFi' },

  // === Xion ===
  { id: 'xion-passkeys', title: 'Xion Passkeys Zellic Audit', protocol: 'Xion', auditor: 'Zellic', date: '2024', pdfPath: '/audits/Xion%20Passkeys%20-%20Zellic%20Audit%20Report.pdf', category: 'Infrastructure' },

  // === Other ===
  { id: 'firm-nomoi', title: 'Firm / Nomoi Audit', protocol: 'Firm', auditor: 'External', date: '2023', pdfPath: '/audits/firm-nomoi.pdf', category: 'DeFi' },
  { id: 'pinto', title: 'Pinto Protocol Audit', protocol: 'Pinto', auditor: 'External', date: '2024', pdfPath: '/audits/pinto.pdf', category: 'DeFi' },
  { id: 'sdola-yaudit', title: 'sDOLA yAudit', protocol: 'Inverse Finance', auditor: 'yAudit', date: '2024', pdfPath: '/audits/sDOLA-yAudit.pdf', category: 'DeFi' },
  { id: 'ref-finance', title: 'Ref Finance Security Audit', protocol: 'Ref Finance', auditor: 'External', date: '2023', pdfPath: '/audits/spaces%2F-MhIB0bSr6nOBfTiANqT-2910905616%2Fuploads%2Fh8mipVuJTakoLC6XmzfU%2FRef%20Finance%20Security%20Audit-1.pdf', category: 'DEX' },
  { id: 'sherlock-jr', title: 'Sherlock Junior Contest Report', protocol: 'Various', auditor: 'Sherlock', date: '2024', pdfPath: '/audits/junior-sherlock.pdf', category: 'Competition' },

  // === OpenZeppelin Version Audits ===
  { id: 'oz-2018', title: 'OpenZeppelin Contracts Audit (2018)', protocol: 'OpenZeppelin', auditor: 'External', date: '2018-10', pdfPath: '/audits/openzeppelin/2018-10.pdf', category: 'Library' },
  { id: 'oz-checkpoints', title: 'OpenZeppelin Checkpoints Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2022-10', pdfPath: '/audits/openzeppelin/2022-10-Checkpoints.pdf', category: 'Library' },
  { id: 'oz-erc4626', title: 'OpenZeppelin ERC-4626 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2022-10', pdfPath: '/audits/openzeppelin/2022-10-ERC4626.pdf', category: 'Library' },
  { id: 'oz-v49', title: 'OpenZeppelin v4.9 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2023-05', pdfPath: '/audits/openzeppelin/2023-05-v4.9.pdf', category: 'Library' },
  { id: 'oz-v50', title: 'OpenZeppelin v5.0 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2023-10', pdfPath: '/audits/openzeppelin/2023-10-v5.0.pdf', category: 'Library' },
  { id: 'oz-v51', title: 'OpenZeppelin v5.1 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2024-10', pdfPath: '/audits/openzeppelin/2024-10-v5.1.pdf', category: 'Library' },
  { id: 'oz-v52', title: 'OpenZeppelin v5.2 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2024-12', pdfPath: '/audits/openzeppelin/2024-12-v5.2.pdf', category: 'Library' },
  { id: 'oz-v53', title: 'OpenZeppelin v5.3 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2025-04', pdfPath: '/audits/openzeppelin/2025-04-v5.3.pdf', category: 'Library' },
  { id: 'oz-v54', title: 'OpenZeppelin v5.4 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2025-07', pdfPath: '/audits/openzeppelin/2025-07-v5.4.pdf', category: 'Library' },
  { id: 'oz-v55', title: 'OpenZeppelin v5.5 Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2025-10', pdfPath: '/audits/openzeppelin/2025-10-v5.5.pdf', category: 'Library' },
  { id: 'oz-rlp', title: 'OpenZeppelin RLP Audit', protocol: 'OpenZeppelin', auditor: 'External', date: '2025-11', pdfPath: '/audits/openzeppelin/2025-11-RLP.pdf', category: 'Library' },
  { id: 'oz-oif', title: 'OIF Broadcaster Audit', protocol: 'OpenZeppelin', auditor: 'OpenZeppelin', date: '2025', pdfPath: '/audits/openzeppelin/dex_OIF_Broadcaster_Audit_.pdf', category: 'Infrastructure' },
]

// Stats computed from catalog
export const auditStats = {
  total: auditCatalog.length,
  protocols: [...new Set(auditCatalog.map(a => a.protocol))].length,
  auditors: [...new Set(auditCatalog.map(a => a.auditor))].length,
  categories: [...new Set(auditCatalog.map(a => a.category))],
}
