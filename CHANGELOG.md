# Changelog

All times UTC. Each entry says what was read and what changed.

## 2026-10-31 15:31: all-chain snapshot

- First all-chain snapshot: `data/snapshots/2026-10-31T153110Z.json` (Ethereum block 26,313,654).
- **New:**
  - The Tron TRX is being dispersed. Four of the five 120M TRX split wallets sent their TRX back to `TRBd…`, which has made 875 transfers totalling 429.71M TRX to 176 fresh wallets since 30 Oct 02:19. The full list is in `data/raw/tron_TRBd_outflows.csv`.
  - An eighth ETH stash, `0x8d4b8ee6…`, holds 4,229.18 ETH with nonce 0. It was first funded on 30 Oct. The stash total is now 516,849.7 ETH.
  - `0xa97b…` started a second token-selling round on Ethereum at 12:48, using 14 fresh seller wallets.
- **Corrected:** the first report said no exits had been found. On Tron they had started on 30 Oct. The report's section 1 and section 15 now say so.
- **Ledger:**
  - Added 13 Bitcoin peel transactions, so all 19 lots are now covered, plus 4 Tron consolidations and 26 Ethereum rows.
  - Five XRPL rows now carry their ledger close times, and every Tron row now carries its block number.
  - Added `row_id` and `explorer_url` columns. The ledger now has 231 rows.

## 2026-10-31 12:45:59: Ethereum re-read

- Ethereum block 26,312,831. The seven stashes are unmoved, at 512,620.5 ETH. The Aave position's health factor is 1.0521.
- Restated how far behind Tether was: 36 s to 8 min 48 s after each wallet's USDT had left.

## 2026-10-31 10:26: first cut-off

- 188 transactions across ten chains, every one read from chain data. Report sections 1 to 12. Six diagrams.
