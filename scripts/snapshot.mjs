// Re-reads every tracked wallet on Ethereum, Bitcoin, Tron, XRP Ledger and Solana and writes a timestamped
// snapshot to data/snapshots/<UTC time>.json. Wallets come from data/addresses.csv.
// Usage, from the repo root:  RPC_URL=<your Ethereum mainnet RPC> node scripts/snapshot.mjs
// Only Ethereum needs RPC_URL; the other chains use free public endpoints. Node 18 or later.
import fs from 'node:fs';

const RPC = process.env.RPC_URL;
if (!RPC) { console.error('Set RPC_URL to an Ethereum mainnet RPC endpoint.'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (s) => new Date(s * 1000).toISOString();

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const book = parseCsv(fs.readFileSync('data/addresses.csv', 'utf8'));
const on = (chain) => book.filter((a) => a.chain === chain);

async function getJson(url, init, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, init);
    if (r.status === 429) { await sleep(3000 * (i + 1)); continue; }
    if (!r.ok) throw new Error(`${url.split('?')[0]}: HTTP ${r.status}`);
    return r.json();
  }
  throw new Error(`${url.split('?')[0]}: rate limited`);
}
let id = 1;
async function rpc(url, method, params) {
  const j = await getJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: id++, method, params }) });
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
const word = (addr) => addr.slice(2).toLowerCase().padStart(64, '0');
const call = (to, data) => rpc(RPC, 'eth_call', [{ to, data }, 'latest']);

// ---- Ethereum
async function ethereum() {
  const block = parseInt(await rpc(RPC, 'eth_blockNumber', []), 16);
  const b = await rpc(RPC, 'eth_getBlockByNumber', ['0x' + block.toString(16), false]);
  const wallets = [];
  for (const a of on('ethereum').filter((a) => ['ETH stash', 'attacker operations', 'token seller', 'stablecoin hop'].includes(a.group))) {
    const eth = Number(BigInt(await rpc(RPC, 'eth_getBalance', [a.address, 'latest']))) / 1e18;
    const nonce = parseInt(await rpc(RPC, 'eth_getTransactionCount', [a.address, 'latest']), 16);
    wallets.push({ address: a.address, group: a.group, label: a.label, eth: +eth.toFixed(4), nonce });
  }
  const T = { USDT: ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 6], USDC: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6], RLUSD: ['0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD', 18], WBETH: ['0xa2E3356610840701BDf5611a53974510Ae27E2e1', 18] };
  const held = [['USDT', '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c'], ['USDT', '0xaa246bf639586a6ba46762d378ce50ca4fc654a0'], ['USDT', '0xb171ca86f82070282138352ff7111b494060c8c3'], ['USDC', '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c'], ['RLUSD', '0xe7024ab80143b1ef843efe6a58368696cb87958d'], ['WBETH', '0x7f9dc988b46336ad536828fad50fa8fa1e5415e3']];
  const tokens = [];
  for (const [sym, holder] of held) {
    const [addr, dec] = T[sym];
    tokens.push({ token: sym, holder, balance: Number(BigInt(await call(addr, '0x70a08231' + word(holder)))) / 10 ** dec });
  }
  const fillers = [];
  for (const a of on('ethereum').filter((a) => a.label === 'intent filler')) {
    fillers.push({ address: a.address, usdt_blacklisted: BigInt(await call(T.USDT[0], '0xe47d6060' + word(a.address))) === 1n });
  }
  // Aave V3 Pool getUserAccountData and the Aave oracle ETH price
  const r = await call('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', '0xbf92857c' + word('0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a'));
  const w = [...Array(6)].map((_, i) => BigInt('0x' + r.slice(2 + 64 * i, 66 + 64 * i)));
  const ethUsd = Number(BigInt(await call('0x54586bE62E3c3580375aE3723C145253060Ca0C2', '0xb3596f07' + word('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')))) / 1e8;
  const collateral = Number(w[0]) / 1e8, debt = Number(w[1]) / 1e8;
  const aave = { owner: '0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a', collateral_usd: collateral, debt_usd: debt, health_factor: Number(w[5]) / 1e18, oracle_eth_usd: ethUsd, liquidation_eth_usd: +((collateral * 0.78) / (debt / ethUsd)).toFixed(2) };
  const stashTotal = wallets.filter((x) => x.group === 'ETH stash').reduce((s, x) => s + x.eth, 0);
  return { block, block_time: iso(parseInt(b.timestamp, 16)), stash_total_eth: +stashTotal.toFixed(2), wallets, tokens, fillers, aave };
}

// ---- Bitcoin (mempool.space)
async function bitcoin() {
  const out = [];
  for (const a of on('bitcoin')) {
    const j = await getJson(`https://mempool.space/api/address/${a.address}`);
    const s = j.chain_stats;
    out.push({ address: a.address, label: a.label, balance_btc: (s.funded_txo_sum - s.spent_txo_sum) / 1e8, tx_count: s.tx_count, spent_outputs: s.spent_txo_count });
    await sleep(300);
  }
  const lots = out.filter((x) => x.label === 'BTC lot');
  return { lots_total_btc: +lots.reduce((s, x) => s + x.balance_btc, 0).toFixed(8), lots_with_any_spend: lots.filter((x) => x.spent_outputs > 0).length, wallets: out };
}

// ---- Tron (TronGrid)
async function tron() {
  const out = [];
  for (const a of on('tron').filter((a) => a.group !== 'unidentified')) {
    const acct = (await getJson(`https://api.trongrid.io/v1/accounts/${a.address}`)).data?.[0] ?? {};
    await sleep(1200);
    const last = (await getJson(`https://api.trongrid.io/v1/accounts/${a.address}/transactions?limit=1&only_from=true`)).data?.[0];
    await sleep(1200);
    const usdt = (acct.trc20 ?? []).map((t) => t.TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t).find((v) => v !== undefined);
    out.push({ address: a.address, label: a.label, trx: (acct.balance ?? 0) / 1e6, usdt: usdt ? Number(usdt) / 1e6 : 0, last_outgoing_tx: last ? { txid: last.txID, time: iso(last.block_timestamp / 1000) } : null });
  }
  return { wallets: out };
}

// ---- XRP Ledger
async function xrpl() {
  const acct = 'rK21t6nGLy4MNDqhvy3pGwcLFy25qgfzMx';
  const info = (await getJson('https://xrplcluster.com', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ method: 'account_info', params: [{ account: acct, ledger_index: 'validated' }] }) })).result;
  return { address: acct, ledger_index: info.ledger_index, balance_xrp: Number(info.account_data.Balance) / 1e6, sequence: info.account_data.Sequence };
}

// ---- Solana
async function solana() {
  const acct = 'AffzFDKZbyMiU11zmVBoAqD25ugpr7xoWWyRyGigBEaU', url = 'https://api.mainnet-beta.solana.com';
  const bal = await rpc(url, 'getBalance', [acct]);
  const sigs = await rpc(url, 'getSignaturesForAddress', [acct, { limit: 1 }]);
  return { address: acct, slot: bal.context.slot, balance_sol: bal.value / 1e9, latest_signature_any_direction: sigs[0] ? { signature: sigs[0].signature, time: sigs[0].blockTime ? iso(sigs[0].blockTime) : null } : null };
}

const snap = { taken_at: new Date().toISOString() };
for (const [name, fn] of Object.entries({ ethereum, bitcoin, tron, xrpl, solana })) {
  try { snap[name] = await fn(); } catch (e) { snap[name] = { error: String(e.message) }; }
}
fs.mkdirSync('data/snapshots', { recursive: true });
const file = `data/snapshots/${snap.taken_at.slice(0, 19).replace(/:/g, '')}Z.json`;
fs.writeFileSync(file, JSON.stringify(snap, null, 1) + '\n');
const e = snap.ethereum;
console.log('wrote', file);
if (!e.error) console.log(`ethereum block ${e.block} (${e.block_time}): stashes ${e.stash_total_eth} ETH, nonce>0 stashes ${e.wallets.filter((w) => w.group === 'ETH stash' && w.nonce > 0).length}; Aave HF ${e.aave.health_factor.toFixed(4)} at ETH $${e.aave.oracle_eth_usd}, liquidation near $${e.aave.liquidation_eth_usd}`);
for (const k of ['bitcoin', 'tron', 'xrpl', 'solana']) if (snap[k].error) console.log(k, 'ERROR', snap[k].error);
if (!snap.bitcoin.error) console.log(`bitcoin: lots ${snap.bitcoin.lots_total_btc} BTC, lots with a spend ${snap.bitcoin.lots_with_any_spend}`);
if (!snap.xrpl.error) console.log(`xrpl: ${snap.xrpl.balance_xrp} XRP, sequence ${snap.xrpl.sequence}`);
if (!snap.solana.error) console.log(`solana: ${snap.solana.balance_sol} SOL, latest signature in either direction ${snap.solana.latest_signature_any_direction?.time} (incoming dust counts)`);
