const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'protocols');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');
const missing = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  if (!d.logo_url || d.logo_url === null) missing.push(d.name + ' (' + f.replace('.json','') + ')');
}
console.log('Missing logos (' + missing.length + '):');
console.log(missing.join('\n'));
