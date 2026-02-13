import fs from 'node:fs';
import path from 'node:path';

type ContractRecord = {
  address: string;
  chain: string | null;
  label: string | null;
  source: { kind: string; url: string };
  explorer?: { url: string };
  needs_review: boolean;
};

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');
const CONTRACTS_JSON = path.join(ROOT, 'data', 'protocol_contracts.json');
const CONTRACTS_SOURCES = path.join(ROOT, 'data', 'protocol_contracts_sources.json');
const CONTRACTS_CSV = path.join(ROOT, 'data', 'protocol_contracts.csv');

function toChecksumless(address: string): string | null {
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

function explorerFor(chain: string | null, address: string): string | null {
  if (!chain) return null;
  const c = chain.toLowerCase();
  if (c === 'ethereum') return `https://etherscan.io/address/${address}`;
  if (c === 'arbitrum') return `https://arbiscan.io/address/${address}`;
  if (c === 'optimism') return `https://optimistic.etherscan.io/address/${address}`;
  if (c === 'polygon') return `https://polygonscan.com/address/${address}`;
  if (c === 'base') return `https://basescan.org/address/${address}`;
  if (c === 'bsc') return `https://bscscan.com/address/${address}`;
  return null;
}

function run() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { protocols: Array<{ slug: string | null; name: string | null; filepath: string }> };
  const result: Record<string, { slug: string; name: string; contracts: ContractRecord[]; needs_review: boolean }> = {};
  const sources: Record<string, Record<string, string[]>> = {};
  const csv = [['slug','name','address','chain','label','source_kind','source_url','explorer_url','needs_review']];

  for (const p of index.protocols) {
    if (!p.slug || !p.name) continue;
    const abs = path.join(ROOT, p.filepath);
    let json: Record<string, unknown>;
    try { json = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { continue; }

    const rawContracts = Array.isArray(json.contracts) ? json.contracts : [];
    const contracts: ContractRecord[] = [];
    const perContractSources: Record<string, string[]> = {};

    for (const rc of rawContracts) {
      if (!rc || typeof rc !== 'object') continue;
      const obj = rc as Record<string, unknown>;
      const addr = typeof obj.address === 'string' ? toChecksumless(obj.address) : null;
      if (!addr) continue;
      const chain = typeof obj.network === 'string' ? obj.network : typeof obj.chain === 'string' ? obj.chain : null;
      const label = typeof obj.name === 'string' ? obj.name : null;
      const sourceUrl = p.filepath;
      const explorer = explorerFor(chain, addr);
      const entry: ContractRecord = {
        address: addr,
        chain,
        label,
        source: { kind: 'whiteclaws_protocol_json', url: sourceUrl },
        needs_review: chain === null,
      };
      if (explorer) entry.explorer = { url: explorer };
      contracts.push(entry);
      perContractSources[addr] = [sourceUrl];
      csv.push([p.slug, p.name, addr, chain ?? '', label ?? '', entry.source.kind, entry.source.url, explorer ?? '', String(entry.needs_review)]);
    }

    const unique = Object.values(Object.fromEntries(contracts.map((c) => [`${c.address}:${c.chain ?? ''}`, c])));
    result[p.slug] = { slug: p.slug, name: p.name, contracts: unique, needs_review: unique.length === 0 };
    sources[p.slug] = perContractSources;
  }

  fs.writeFileSync(CONTRACTS_JSON, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(CONTRACTS_SOURCES, `${JSON.stringify(sources, null, 2)}\n`);
  fs.writeFileSync(CONTRACTS_CSV, `${csv.map((r) => r.join(',')).join('\n')}\n`);
  console.log(`wrote ${CONTRACTS_JSON}`);
}

run();
