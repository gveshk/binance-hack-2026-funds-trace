# Binance hot-wallet hack (2026-10-29): what the attacker did with the funds

AtlasYield Research. A transaction-level trace of where the stolen funds went. No conclusions beyond what the chain shows; every inference is labelled.
Evidence cut-off: Ethereum block 26,312,138 (2026-10-31 10:26 UTC); other chains read between 10:20 and 10:40 UTC on 31 Oct.
Full transaction list: `data/ledger.csv` (188 rows at the first cut-off, 231 after the 31 Oct reads, all verified against chain data).
Later reads are in sections 13 (12:45:59 UTC) and 15 (15:31 UTC on 31 Oct). Section 15 corrects two things: the Tron TRX was already being dispersed, and there is an eighth ETH stash.

Conventions:
- **Fact** = read by us from chain data (Alchemy RPC, Etherscan API, TronGrid, mempool.space, XRPL node, Solana RPC).
- **Reported** = from a named source, not independently checked.
- **Inference** = our interpretation, with the evidence named.
- USD values in the ledger use ETH $2,300 for 29 Oct and $2,250 for 30-31 Oct (TRM says ETH traded at $2,300-2,350 during the laundering; the Aave oracle implies about $2,242 on 31 Oct), BTC $81,000, stablecoins $1. Other tokens are left blank rather than guessed.

---

## 1. Summary

- **Size.** TRM puts the theft at about $6.36B at the time of each transfer, across ten chains ([TRM](https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)). Elliptic says $6.43B ([Elliptic](https://www.elliptic.co/insights/binance-largest-hack-in-history/)), Binance about $6.3B, Chainalysis $5.91B ([Bitcoin.com](https://news.bitcoin.com/security/binance-hack-north-korea-lazarus-tradertraitor/)).
- **What we verified as stolen, by asset (fact).**
  - Ethereum: about 200,500 ETH and 668 WETH in five sweeps; 1,875.47M USDT; 823M USDC; 88.54M RLUSD; 48.53M WLFI; 27.82M USD1; 29,934 WBETH; plus about 60 other tokens.
  - Bitcoin: 18,270.2 BTC.
  - Tron: 612.73M USDT and 46.38M TRX.
  - XRP Ledger: 233.46M XRP.
  - Solana: about 970,554 SOL (current balance of the receiver).
  - Arbitrum: 74.56M ARB and 8,426.2 ETH.
  - Optimism: 44.23M OP.
  - Base: 4.74M VIRTUAL.
  - Avalanche: 2,258,636 AVAX and 8.41M USDt.
  - Polygon: 46.63M POL and 6.19M USDT0.
- **The playbook in one paragraph (fact, with the interpretation flagged).** In the 37 minutes between the main Ethereum sweep (20:24:23) and Tether's first freeze (21:01:35), the attacker moved 700M USDT out of the main wallet into hop wallets. From there it converted 435M USDT into 160,451 ETH through UniswapX and SimpleSettlement intent fills and Uniswap pools, paying an average of about $2,711 per ETH against a market near $2,300. It also put 60M USDT into Aave V3 as collateral and borrowed 19,762 ETH. Tether then chased the hop chain wallet by wallet, roughly 3 to 7 minutes behind each deposit made after its first freeze at 21:01:35 (the three wallets funded before it, `0x9749…`, `0x0ddf…` and the Aave wallet `0x8d53…`, were frozen 10 to 31 minutes after funding, by then empty), and caught 205M USDT in two hop wallets on top of 1.175B in the main wallet. On Tron, the attacker swapped about 234M USDT into 638.2M TRX before the freezes landed. The remaining value sits in assets nobody can freeze: 512,621 ETH in seven untouched stash wallets, 18,270 BTC in 19 untouched lots, 233.46M XRP and about 970.5K SOL. *Inference:* the order of moves shows a deliberate race to turn freezable stablecoins into ETH and TRX before issuers acted.
- **End-state share of the ~$6.36B (approximate, see section 9):** frozen or seized about 42%; BTC held about 23%; ETH stashes about 19%; XRP about 5%; TRX about 4%; SOL about 1.5%; Aave collateral left behind about 1%; conversion losses about 2%; other or unresolved about 3%.
- **No exchange deposits, mixer deposits after funding, or large bridge exits** were found in the traced wallets as of the cut-off. (Correction, section 15: on Tron, `TRBd…` had in fact been dispersing TRX to fresh wallets since 02:19 on 30 Oct.) The only bridge moves we verified were small: about 1,187 ETH from Base to Ethereum over Stargate on 31 Oct, and about 1.56M USDC from Avalanche to Ethereum over CCTP, which Circle froze 4 minutes 24 seconds after it landed.

---

## 2. Address book

### Ethereum: attacker operations

| Address | Role | Attribution source | How confirmed |
|---|---|---|---|
| `0x7c8601d4645b93cea45f71e118a729332e6b5ca0` | Operator or caller wallet. Signed the EIP-7702 delegation and all sweeps. | Bitquery, Cointegrity, Etherscan link | Fact: sender of `0xad99264d…` (type 4 delegation into Binance 14) and of every `sweep` call. Funded by three Tornado Cash 0.1 ETH withdrawals and by `0xe4f9…` |
| `0xe4f9070e1316de2988fc6f869fead8fb99cc74cd` | Gas funder | Bitquery | Fact: received Tornado Cash 0.1 and 1 ETH withdrawals, plus 1 ETH from the rehearsal wallet; sent 1.082 ETH to `0x7c86…` at 18:20:47 on 29 Oct |
| `0x63e842b054bd624a465454d533c33f573e9c6fae` | Sweeper contract ("Target") that Binance 14 was delegated to | Bitquery, Elliptic | Fact: `contractAddress` of deploy tx `0x97408e75…` (15:59:11 on 29 Oct, sent by `0x7c86…`) |
| `0x837810e3be7a3e89c570e7a01a13d3b566aafbc3`, `0x9c29ba2de4b2d6c3630685650663cfe7b70dbb6b`, `0x43aedb9bad6219677a2c8d6858321c16988404bd` | Rehearsal wallets | TRM and WazzCrypto describe rehearsals | Fact: `0x7c86…` called `sweep` on each between 13:51 and 16:47 on 29 Oct; `0x43ae…` then returned 1 ETH to `0xe4f9…` |
| `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | Main receiver on every EVM chain ("Binance Hot Wallet Exploiter 2" on Etherscan) | Etherscan label, Aave forum, all firms | Fact: recipient of the 20:24:23 sweep; the same address received stolen funds on Arbitrum, Optimism, Base, Avalanche and Polygon |
| `0xa97bf7836f8a08f9ed91d41453d371493fae8d10` | Second receiver; altcoin dumping wallet | Bitquery | Fact: received the 23:56 sweep (2,961.9 ETH); about 2,400 outbound token transfers to DEXs on 30 Oct |

### Ethereum: stablecoin hop wallets (in order of use)

| Address | Role | Status now (fact) |
|---|---|---|
| `0x9749292d74fd460982d0912ea9515ea24736c762` | Got 500M USDT; sold 325M through intent fills; passed 175M on | Blacklisted at 21:01:35, empty when frozen |
| `0x0ddf0480016e6bcb2c1f5d190d221fba1320697e` | Got 200M USDT; sold 10M on Uniswap; passed 190M to the Aave wallet | Blacklisted at 21:01:47, empty |
| `0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a` | **Aave wallet.** Supplied 60M USDT, borrowed 19,762 ETH | Blacklisted at 21:02:47, empty; the Aave position is still open |
| `0x77edef23fbd05921c26fe29fcc3a65e14d2ac3eb` | Got 130M USDT and 23,314.5 ETH from the Aave wallet; sold 50M; passed 80M on | Not blacklisted; empty |
| `0x7aa4d3029e4c6a8e916300014ad95b6d6c03bfd1` | Sold 50M; passed 30M and 57,891.85 ETH on | Blacklisted at 21:12:35, empty |
| `0xccbef95633adb5cd2b5038db5a38d77e726ca263` | Relay | Blacklisted at 21:16:47, empty |
| `0xb171ca86f82070282138352ff7111b494060c8c3` | Relay; passed 57,891.77 ETH to a stash | **30M USDT frozen** at 21:18:59 |
| `0x811f15855476156ebf86ba3b84fafb8ceaa4e84c` | Relay for 175M | Not blacklisted; empty |
| `0xaa246bf639586a6ba46762d378ce50ca4fc654a0` | Relay for 175M | **175M USDT frozen** at 21:14:59 |

### Ethereum: token-seller wallets
Each one was funded with 0.5 ETH of gas from `0x5227…`, got one or two tokens, sold them through Uniswap SwapRouter02 or the v4 PoolManager, and sent the ETH to a stash. All facts from on-chain transfers.

| Seller | Tokens | ETH sent to stash |
|---|---|---|
| `0x600d6f00eadabdb514561ceeb43730a7103e8298` | 7.77T PEPE | 14,050 to `0x79e7…` |
| `0xcf4ca2bdf21bc3a467a00b6afe72b833982723e0` | 2.57M LINK | 11,560.8 to `0x79e7…` |
| `0xb3ddec0ccc5c3ba733fcdf5a15f98c95ec5a5fdb` | 167.14 WBTC, 9.71M USDe | 8,556.9 to `0x79e7…` |
| `0x42cdf00c85005630cc8605731b9364f712077810` | 7.02M UNI, 21.85M ONDO | 20,523.5 to `0x897c…` |
| `0x7f9dc988b46336ad536828fad50fa8fa1e5415e3` | 217.5M ENA (sold); 29,934 WBETH (still held, unsold) | 15,292 to `0xc887…` |
| `0xe7024ab80143b1ef843efe6a58368696cb87958d` | 88.54M RLUSD (48M sold, **40.54M stuck**), 127,953 AAVE | 26,825 to `0x5440…` |
| `0x8c7111e9a3270457b76f0bd137209089047a6aa4` | 17.32M WLD | 2,726.3 to `0x5440…` |
| `0xb58bf76d209fa71f60013ce1933ca331177a4f08` | 3.38B RSR | 1,855.4 to `0x5440…` |
| `0x1291be4c90239d14527ba880ad2b6e5cb82116b1` | 1.76M MORPHO | 1,546.8 to `0x5440…` |
| `0x11861b31b97c5c6550d49b03b1eed1a105774084` | 4.74M VIRTUAL on Base (31 Oct) | 1,186.8 to `0xc209…` via Stargate |

### Ethereum: ETH stashes
All seven are plain EOAs with nonce 0; none has ever sent a transaction (fact, read at block 26,312,138).

| Stash | ETH now | Funded by (fact) |
|---|---|---|
| `0x8532fa14acaf483729c449b8458aeddb900543d4` | 197,460.0 | Raw stolen ETH from `0x5227…` (195,460 at 20:38:47; 2,000 at 01:14) |
| `0xc887af690e0301cd4edbbce8f8d31b4ec65b286a` | 137,602.0 | 122,310 from USDT intent fills; 15,292 from the ENA sale |
| `0x897c80d1a9729e94460e2bd93178bd5215158df3` | 78,415.3 | 57,891.8 from the Aave borrow plus 100M USDT of DEX swaps; 20,523 from UNI and ONDO |
| `0x54401f80da97893a15d43566184635b6674bc942` | 40,600.7 | RLUSD and AAVE 26,825; `0xa97b…` 7,647; WLD, RSR, MORPHO |
| `0x79e70d139fc05aa75f75611fdf2680e9952b544a` | 34,279.7 | PEPE, LINK, WBTC and USDe sales |
| `0x03b0ee5d82990cff1bda48651ac3e436d1a020ea` | 17,260.1 | `0x5227…`'s own altcoin swaps (17,260 at 05:15:47 on 30 Oct) |
| `0xc2096a12ebe0944f4d39e59979f485afd92d850a` | 7,002.8 | `0xa97b…` 3,000; Base proceeds 1,187; small seller wallets |
| **Total** | **512,620.6 ETH** | |

### Binance wallets that paid the attacker (Ethereum)
- `0x28c6c06298d514db089934071355e5743bf21d60`: Binance 14, delegated with EIP-7702 (Etherscan label; fact from the type 4 tx).
- `0xdfd5293d8e347dfe59e90efd55b2956a1343963d`: Binance 16, sent 28,005.6 ETH and 55.74M USDT without delegation (TRM; fact from the transfers).
- `0xee7ae85f2fe2239e27d9c1e23fffe168d63b4055`: Binance smart account that released 823M USDC (Bitquery, TRM; fact from the transfers).

### Other chains

| Chain | Address | Role | Confirmed by |
|---|---|---|---|
| Arbitrum | `0x5227…` (same as Ethereum) | Receiver | Fact: 74.56M ARB and 3 ETH transfers in |
| Arbitrum | `0x3e2bf1ac6bf0934bbba6456c341c2ecbced632d5` | Consolidation wallet; emptied by the Security Council | Fact; the same address was reused on Avalanche and Optimism |
| Optimism | `0x5227…` | Received 44.23M OP; moved out at 00:12 on 31 Oct by a forced deposit tx | Fact |
| Base | `0x5227…`, `0x11861b31…` | VIRTUAL receiver and seller | Fact |
| Avalanche | `0x5227…`, `0x80358c5b8f9b2cc27147a1e0f2a6c9a30eb2c397`, `0xc39e690bea48448cc47e7acddfe30e6453e09824`, `0x2ef0f69cb884a0bd8a64a6cf88c61e716f87f033`, `0x554d2a66aa6f5d4b6fd23b649270f011072b4771` | Receiver and hops | Fact; `0x8035…` also named by Cointegrity |
| Polygon | `0x5227…` | Received 46.63M POL and 6.19M USDT0; never sent (nonce 0) | Fact |
| BNB Chain | `0x5227…`, `0x7c86…`, `0x8532…` | Spam dust only; nonce 0 on all three | Fact: the attacker did not operate on BNB Chain |
| Tron | `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` | First receiver; **312.73M USDT frozen** | Fact (TronGrid) |
| Tron | `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` | Swapper (USDT to TRX) | Fact |
| Tron | `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` | **65.99M USDT frozen** | Fact |
| Tron | `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | TRX stash (638.19M TRX), split into five on 30 Oct | Fact |
| Tron | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | Received the 46.38M stolen TRX; holds 88.9M TRX now | Fact |
| Tron | `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5`, `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj`, `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk`, `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT`, `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K` | The five TRX split wallets | Fact |
| Bitcoin | `bc1q0mtc2f5agpkvlq6hhahmfr3hlr55kyfjhl2mnm` | First receiver (18,270.2 BTC in 11 txs) | Fact (mempool.space) |
| Bitcoin | 19 lots, listed in Bitquery and Cointegrity (17 × 1,000 BTC, plus 832.5 and 437.7) | Peel-chain outputs | Fact: every lot shows `spent_txo_sum = 0` |
| XRP Ledger | `rK21t6nGLy4MNDqhvy3pGwcLFy25qgfzMx` | Receiver; balance 233,461,943 XRP | Fact (XRPL node) |
| Solana | `AffzFDKZbyMiU11zmVBoAqD25ugpr7xoWWyRyGigBEaU` | Receiver; balance 970,554.1 SOL | Fact (Solana RPC) |

---

## 3. Timeline by chain

All times UTC. Every hash below is in `data/ledger.csv` with `verified=yes`.

### Ethereum: preparation and theft

| UTC | Tx | What happened |
|---|---|---|
| 28 Oct 07:39, 08:53; 29 Oct 08:23 | `0xd9e59064…`, `0xa79503c2…`, `0x18ae9a75…` | Tornado Cash 0.1 ETH withdrawals to the operator wallet `0x7c86…` |
| 29 Oct 07:08, 14:54 | `0x976630d1…`, `0xf18e0815…` | Tornado Cash 0.1 and 1 ETH withdrawals to the gas funder `0xe4f9…` |
| 13:51-16:47 | (see ledger) | `sweep` rehearsals on three wallets |
| 15:59:11 | `0x97408e75…` | Sweeper contract `0x63e8…` deployed |
| 18:20:47 | `0x96cae1ec…` | `0xe4f9…` sends 1.082 ETH of gas to `0x7c86…` |
| 20:20:59 | `0xad99264d…` | Type 4 tx: Binance 14 delegated to the sweeper (50 authorizations) |
| 20:24:23 | `0x53bd38b8…` | Sweep: 167,464.25 ETH, 1,615.41M USDT, 668 WETH and 62 tokens to `0x5227…` |
| 20:24:47 | `0xd4e08d3e…`, `0x51f263fa…` | Binance 16: 55.74M USDT and 28,005.6 ETH to `0x5227…` |
| 20:41:23, 20:59:47 | `0xdc102dd8…`, `0x3b9625b3…` | 780M and 43M USDC from the Binance smart account |
| 21:04:23, 21:44:11 | `0x31c4c9fe…`, `0x55ba4dab…` | Later sweeps: 3.92M and 200.4M USDT plus ETH. Both landed in a wallet already frozen by Tether |
| 23:56:47 | `0x4395d51d…` | Last sweep: 2,961.9 ETH to `0xa97b…` |
| 30 Oct 00:10:35 | `0xafbf94c9…` | Binance revokes the delegation |

### Ethereum: the 37-minute stablecoin race (20:24 to 21:01) and the chase

| UTC | Tx | Move |
|---|---|---|
| 20:30:11 | `0x68d7d69d…` | 500M USDT from `0x5227…` to `0x9749…` |
| 20:33:23 | `0x1fc0ef33…` | 200M USDT from `0x5227…` to `0x0ddf…` |
| 20:34-20:45 | `0x290e94a9…`, `0x4fa18262…`, `0xfa949551…`, `0xa861a556…` | 275M USDT sold through UniswapX (V2DutchOrderReactor) for 105,592.9 ETH |
| 20:38:47 | `0x551d7961…` | 195,460 ETH from `0x5227…` to stash `0x8532…` |
| 20:47:47 | `0x152e005f…` | `0x0ddf…` sells 10M USDT on Uniswap v2, v3 and v4 pools for 3,552.2 ETH |
| 20:49:23-35 | `0xe5ccc3a8…`, `0x7b0ad8b5…`, `0x1b623b43…`, `0xc59188f1…`, `0x3fd5ec34…` | 50M USDT sold through SimpleSettlement fills for 16,723.4 ETH |
| 20:52:59 | `0xc0fab33d…` | 190M USDT from `0x0ddf…` to the Aave wallet `0x8d53…` (plus 3,552 ETH at 20:53:59) |
| **20:57:59** | `0x420e7401…` | **Aave V3 supply: 10M USDT** |
| **20:59:11** | `0x01b3406c…` | **Aave borrow: 3,271.4 ETH** (through WrappedTokenGatewayV3) |
| 20:59:11 | `0x1fb992f9…` | 175M USDT from `0x9749…` to `0x811f…` |
| **21:00:11** | `0x65bd82f1…` | **Aave V3 supply: 50M USDT** |
| **21:00:59** | `0xa85ad480…` | **Aave borrow: 16,491.0 ETH**, making 19,762.4 ETH in total |
| **21:01:35** | `0x7baba482…` | **Tether freezes `0x5227…` holding 971.15M USDT**; also `0x9749…` (empty) |
| 21:01:47 | `0xdb6b11fe…` | Tether freezes `0x0ddf…` (empty) |
| 21:01:59 | `0xd2e7e5e6…` | Aave wallet sends its other 130M USDT to `0x77ed…` |
| 21:02:35 | `0x9e776556…` | Aave wallet sends out 23,314.5 ETH |
| 21:02:47 | `0xe48d47c6…` | Tether freezes the Aave wallet, 48 seconds after its last USDT left |
| 21:04:47-21:05:59 | `0xb7d29487…`, `0xcb8075f1…` | `0x77ed…` sells 50M USDT on Uniswap for 18,085.2 ETH |
| 21:04:59 | `0xc954c86f…` | **Circle freezes 823M USDC in `0x5227…`** |
| 21:06:47-21:07:35 | `0x279d12e9…`, `0x1171d7ba…` | 80M USDT and 41,397.8 ETH to `0x7aa4…` |
| 21:08:23 | `0xb6d7d3ff…` | 175M USDT from `0x811f…` to `0xaa24…` |
| 21:08:23-21:09:11 | `0x808f54a9…`, `0x2a1979ae…` | `0x7aa4…` sells 50M USDT for 16,497.6 ETH |
| 21:11:11-21:11:59 | `0x9a764588…`, `0x6d7e5cde…` | 30M USDT and 57,891.85 ETH to `0xccbe…` |
| 21:12:35 | `0x28836ef9…` | Tether freezes `0x7aa4…` (empty) |
| 21:14:59 | `0x0c07a5e4…` | **Tether freezes `0xaa24…` holding 175M USDT** |
| 21:16:11-47 | `0x1e6f851d…`, `0x3ccb1b3b…`, `0x3c08d840…` | 30M USDT and 57,891.8 ETH to `0xb171…`; Tether freezes `0xccbe…` (empty) |
| 21:18:59 | `0x3445389c…` | **Tether freezes `0xb171…` holding 30M USDT** |
| 21:35:59 | `0x2552fea8…` | `0xb171…` sends the 57,891.77 ETH to stash `0x897c…` |
| 21:47:47 | `0xbd7822f7…` | `0x9749…` sends 122,310 ETH to stash `0xc887…` |
| 22:06:23 | `0x312e166c…` | Tether blacklists Binance 14 itself (1.35M USDT inside) |

USDT accounting on Ethereum (fact): 1,875.47M stolen = 1,175.46M frozen in `0x5227…` + 175.0M frozen in `0xaa24…` + 30.0M frozen in `0xb171…` + 60.0M pledged on Aave + 435.0M sold for 160,451.4 ETH. Elliptic's 434M USDT for 160,451 ETH matches.

### Ethereum: liquidating the rest of the basket (21:22 on 29 Oct to 31 Oct)
- 21:22:59, `0x1d3f0f9b…`: 88.54M RLUSD in two hops to the seller `0xe702…` (21:33:59, `0xbe9cbf50…`). About 48M was sold; 40,541,065 RLUSD is still in `0xe702…` (balance read).
- 21:46-00:43: one-use seller wallets get UNI, PEPE, WBETH, ENA, LINK, AAVE, WBTC, ONDO, USDe, WLD, RSR and MORPHO (rows in the ledger), then send ETH to stashes between 22:08 on 29 Oct and 05:33 on 30 Oct.
- 01:18-02:22 on 30 Oct: about 960 small swaps by `0x5227…` itself through SwapRouter02 (`0x68b3…`), feeding the 17,260 ETH move to `0x03b0…` at 05:15:47 (`0x9edf8653…`).
- 03:33-06:36 on 30 Oct: `0xa97b…` dumps long-tail tokens and sends 3,000 ETH (`0x04989db7…`) and 7,647 ETH (`0x16a76cdb…`) to stashes. Circle froze 123,175.53 USDC in `0xa97b…` at 04:11:35 (`0xe1a61aac…`).
- 31 Oct 08:17-10:04: new wallet `0x11861b31…` gets 4.29 ETH of gas, sells 4.74M VIRTUAL on Base, bridges 1,182.7 ETH over Stargate and sends 1,186.8 ETH to stash `0xc209…` (`0x5280dd14…`).

### Arbitrum
| UTC | Tx | Move |
|---|---|---|
| 20:30:34 | `0xa18e5702…` | 74,559,805.2 ARB in |
| 20:32-20:33 | `0xc45dd9f9…`, `0x31a4acf9…`, `0xd3be30c8…` | 3,478.4 + 2,959.2 + 1,988.6 ETH in |
| 21:36:30, 21:38:00 | `0x07a5a47b…`, `0xf80689c4…` | All of it moved to `0x3e2b…` |
| 30 Oct 00:18:20 | `0x75e81a23…`, `0x410af166…` | Security Council moves 74.56M ARB and 8,426.0 ETH from `0x3e2b…` to `0x…0da0` |

### Optimism
- 20:18:23, `0x10b57fd3…`: 44,231,858.2 OP into `0x5227…`.
- 31 Oct 00:12:15, `0x120aa6c2…`: all of it moved to `0x6b1bae59d09fccbddb6c6cceb07b7279367c4e3b`. The tx is an L1-to-L2 deposit transaction (type `0x7e`), and we found no matching L1 transaction from `0x5227…`. *Inference:* this is the governance action Elliptic reports, not an attacker move.

### Base
- 20:16:19, `0xc814cd05…`: 4,735,627.3 VIRTUAL into `0x5227…`.
- 31 Oct 08:25:27, `0x720d0ca3…`: moved to `0x11861b31…`, then sold from 09:05 through a GenericSwapExecutor and DODOFeeRouteProxy (5 txs).
- 09:23-09:59: 8 Stargate bridge-outs, 1,182.7 ETH in total (see section 5).

### Avalanche
| UTC | Tx | Move |
|---|---|---|
| 20:33:18 onward | `0x23a449e4…` and 5 more | 1,814,099 AVAX and 8.41M USDt into `0x5227…` |
| 21:45:34 | `0x826a013c…` | 1,813,999 AVAX to `0x8035…` |
| 22:00:48 | `0xd750693a…` | 500,010 AVAX to `0xc39e…`, which passes 200,005 AVAX to `0x554d…` (`0xac12b4de…`, 22:15:01) |
| 23:04:30 | `0x16731115…` | Second wave: 444,536.6 AVAX in (the Aave forum cites this as a sign the compromise was still live) |
| 23:27:35 (Ethereum) | `0x0cc12918…` | CCTP mints 1,563,812.78 USDC to `0xc39e…` on Ethereum |
| 23:31:59 (Ethereum) | `0x20289ad9…` | Circle freezes it, 4 min 24 s later |
| 30 Oct 12:29:03 | `0x70879f96…` | `0x2ef0…` sells 444,634.7 AVAX through ParaSwap AugustusV6 |

### Polygon
- 23:05:55, `0x8f5c8b8a…` and `0x27f8969e…`: 6,185,900.1 USDT0 and 46,626,589.6 POL into `0x5227…`. Nonce is still 0 and the POL is untouched (46,626,595 POL now).

### Tron (all TronGrid)
| UTC | Tx | Move |
|---|---|---|
| 20:21:12, 20:22:45 | `72f5fbed…`, `4203af9c…` | 46.38M TRX and 612.73M USDT from Binance `TDqSqu…` to `TG5i…` |
| 20:45:51, 20:56:09 | `fd8061aa…`, `d40f96e2…` | 100M and 200M USDT to swapper `TPBk…` |
| 20:47-21:14 | `60a924f7…` and 15 more | `TPBk…` sells about 234M USDT through router `TQqgNg13…` and pool `TSUUVjys…` (SunSwap per TRM and Bitquery) |
| 20:56:12 | `4b329d44…` | 288.33M TRX to stash `TSpe…` |
| **21:09:12** | `71b0ec0f…` | **Tether freezes `TG5i…` holding 312.73M USDT** |
| 21:14:57 | `7bfbd96e…` | `TPBk…` supplies 10,000 USDT to JustLend jUSDT (a test size) |
| 21:16:18 | `55c2524b…` | 65.99M USDT to fresh wallet `TCzBTk…` |
| 21:17:39 | `bc4e4a76…` | Tether freezes `TPBk…` (empty) |
| **21:21:12** | `176a5783…` | **Tether freezes `TCzBTk…` holding 65.99M USDT** |
| 21:42:42 | `fb5089f5…` | 349.86M TRX to `TSpe…`, making 638.19M TRX |
| 30 Oct 00:06:09 | `6adfc066…` | The 46.38M stolen TRX moves to `TRBd…` |
| 30 Oct 10:15-10:20 | `9d0904db…`, `16585e96…`, `03742851…`, `3db47d89…`, `aff887c4…` | `TSpe…` splits 638.2M TRX into 4 × 120M + 158.2M |

### Bitcoin (mempool.space)
- Block 973,732 (20:20:06): 11 transactions from Binance `bc1qm34l…` to `bc1q0mtc…` total 18,270.2 BTC. In the same block the peel chain starts producing 1,000 BTC lots (`27cdbffb…`, `07f4a693…`, `f47b5991…`, `50a9d0ab…`, `b1473693…`).
- Block 973,738 (20:48:14), `58bb6e42…`: the last 437.7 BTC lot. All 19 lots are unspent.

### XRP Ledger
- Five payments into `rK21…` in ledgers 107,986,693 to 107,986,754 (185.02M + 14.69M + 13.14M + 11.96M + 8.66M = 233.46M XRP). The account has sent nothing. TRM puts these at 20:05-20:09.

### Solana
- 20:10:18 and 20:10:19 (`5YvwLFWu…`, `333sZJXN…`): 965,455.1 and 1,266.7 SOL from Binance `5tzF…` to `Affz…`. The balance is now 970,554.1 SOL; it has not moved.

---

## 4. Positions opened

| Protocol | Market | Owner | Collateral | Debt | Health / LTV | Status at cut-off |
|---|---|---|---|---|---|---|
| Aave V3 Ethereum Core | USDT supply, WETH variable borrow | `0x8d53…` | 60,017,695 aEthUSDT (oracle value $59.92M) | 19,764.15 variableDebtWETH (oracle value $44.32M) | HF **1.0544**; liquidation threshold 0.78; LTV 0 (Aave set USDT LTV to 0) | **Open**, not repaid, not liquidated (fact: `getUserAccountData` at block 26,312,114) |
| JustLend (Tron) | jUSDT | `TPBk…` | 10,000 USDT (918,238.7 jUSDT) | none seen | n/a | Open, trivial size. No large JustLend position found |

Notes on the Aave position:
- The debt is in ETH and the collateral in USDT, so the position is liquidated when ETH **rises**. The Aave forum (SrAugust, 31 Oct) puts the trigger at about $2,365 on the Aave oracle (reported). Bad debt would need ETH above about $3,030 (59.9M / 19,764) without liquidators acting (inference, simple arithmetic).
- Tether blacklisted `0x8d53…`, but the 60M sits in the aEthUSDT reserve, not in that wallet, so the blacklist does not touch it (fact: the wallet's own USDT balance is 0.0001; the aToken balance is 60.02M). The forum has an open question on how liquidators should treat USDT seized from this position ([Aave forum](https://governance.aave.com/t/binance-hot-wallet-exploit-aaves-response/25954)).
- No exploiter wallet has called Aave since 21:01 (forum; consistent with our transfer reads).

---

## 5. Bridges and cross-chain hops

| From | To | Bridge | Source tx | Destination tx | Amount | Status |
|---|---|---|---|---|---|---|
| Avalanche (`0xc39e…`) | Ethereum (`0xc39e…`) | Circle CCTP | not located (Avalanche burn) | `0x0cc12918…` (23:27:35) | 1,563,812.78 USDC | Frozen by Circle at 23:31:59 (`0x20289ad9…`) |
| Base (`0x11861b31…`) | Ethereum (`0x11861b31…`) | Stargate (LZMultiCall to StargatePoolNative) | `0x14661a8c…` | `0xd5d3a4bd…` | 182.68 to 182.66 ETH | Landed |
| same | same | Stargate | `0x33ee681f…` | `0x99c08651…` | 333.00 to 332.97 ETH | Landed |
| same | same | Stargate | `0x24b8fdba…` | `0x56733b4f…` | 50.27 ETH | Landed |
| same | same | Stargate | `0x1f0c76f6…` | `0x6acba979…` | 239.80 to 239.78 ETH | Landed |
| same | same | Stargate | `0xc7182eff…` | `0xba1ded37…` | 148.46 to 148.45 ETH | Landed |
| same | same | Stargate | `0xb16e7764…` | `0x2efc8c1d…` | 128.46 to 128.44 ETH | Landed |
| same | same | Stargate | `0x90d52a24…` | `0x3c2c12ef…` | 50.00 to 49.99 ETH | Landed |
| same | same | Stargate | `0xde379bba…` | `0x6166ff8f…` | 49.99 ETH | Landed, then 1,186.8 ETH to stash `0xc209…` |

The pairs are matched by sender, recipient, ordering and amount less the Stargate fee (fact).

Reported but not traced by us: the AVAX-to-USDC-to-CCTP-to-7,242.8 ETH path (Elliptic, 30 Oct 11:38-12:29), and about $1.9M of TRX through a roughly 28-hop peel chain, THORChain and Hyperlane (Cointegrity). See section 9.

---

## 6. Freezes, blacklists and seizures

| Issuer or actor | When (UTC) | Tx | Address | Amount caught |
|---|---|---|---|---|
| Tether (ETH) | 21:01:35 | `0x7baba482…` | `0x5227…` | 971.15M USDT at freeze; **1,175.46M now** (later sweeps landed in the frozen wallet) |
| Tether (ETH) | 21:01:35 / 21:01:47 / 21:02:47 / 21:12:35 / 21:16:47 | `0x64a3f497…` / `0xdb6b11fe…` / `0xe48d47c6…` / `0x28836ef9…` / `0x3c08d840…` | `0x9749…`, `0x0ddf…`, `0x8d53…`, `0x7aa4…`, `0xccbe…` | 0 (already empty) |
| Tether (ETH) | 21:14:59 | `0x0c07a5e4…` | `0xaa24…` | 174,999,872 USDT |
| Tether (ETH) | 21:18:59 | `0x3445389c…` | `0xb171…` | 30,000,000 USDT |
| Tether (ETH) | 22:06:23 | `0x312e166c…` | Binance 14 | 1.35M USDT (Binance's own balance) |
| Tether (Tron) | 21:09:12 | `71b0ec0f…` | `TG5i…` | 312,729,468 USDT |
| Tether (Tron) | 21:17:39 / 21:20:57 | `bc4e4a76…` / `0900814b…` | `TPBk…` | 0 |
| Tether (Tron) | 21:21:12 | `176a5783…` | `TCzBTk…` | 65,990,000 USDT |
| Circle | 21:04:59 | `0xc954c86f…` | `0x5227…` | 823,000,000 USDC |
| Circle | 23:31:59 | `0x20289ad9…` | `0xc39e…` | 1,563,812.78 USDC (the CCTP leg) |
| Circle | 30 Oct 04:11:35 | `0xe1a61aac…` | `0xa97b…` | 123,175.53 USDC |
| Ripple | 22:01 (reported) | not located | `0xe702…` | 40,541,065 RLUSD (balance read) |
| World Liberty Financial | 20:57 / 22:10 / 22:26 (reported) | not located | `0x5227…`, Binance 14 | 48.53M WLFI and 27.82M USD1 sit in `0x5227…` (balance read) |
| Arbitrum Security Council | 30 Oct 00:18:20 | `0x75e81a23…`, `0x410af166…` | `0x3e2b…` | 74.56M ARB and 8,426.0 ETH (about $30.5M per TRM) |
| Optimism governance | 31 Oct 00:12:15 | `0x120aa6c2…` | `0x5227…` (OP Mainnet) | 44.23M OP (about $5M per Elliptic) |
| Tether (Avalanche, Polygon) | reported | not located | `0x5227…` | 8.41M USDt and 6.19M USDT0 (TRM). Consistent with chain data: neither balance moved |
| Binance (WBETH) | reported (Elliptic) | not located | `0x7f9dc988…` | 29,934 WBETH still unsold in the seller wallet |

Tether total that we can sum from chain data: 1,380.46M on Ethereum + 378.72M on Tron = **1,759.2M USDT**, which matches Bitquery's 1.76B. With Avalanche and Polygon (reported) it is about 1,773.8M. Circle total: **824.69M USDC**. Elliptic's verified frozen or seized figure is $2.85B, or 44% of the theft.

Time from stablecoin arrival to freeze (fact): main ETH wallet 37 min 12 s; Tron receiver 46 min 27 s; Circle on the main wallet 23 min 36 s after the first USDC arrived; CCTP leg 4 min 24 s.

---

## 7. Interpretation: facts and inference

1. **Speed against the freeze clock.**
   - *Fact:* both 500M and 200M USDT left `0x5227…` within 9 minutes of arrival. The first intent fill landed at 20:34:23, 10 minutes after the sweep. By 21:01:35, when Tether froze the main wallet, 335M USDT had already been sold, 60M was in Aave and 365M more was sitting in hop wallets.
   - *Inference:* the attacker expected the main receiver to be frozen within about half an hour and front-loaded conversion. The hop pattern (one fresh wallet per tranche, each passing on the remainder) reads as an attempt to stay one step ahead of Tether.
   - *Evidence for the "one step ahead" reading:* five of the eight Tether freezes on attacker wallets on Ethereum hit wallets that were already empty (`0x9749…`, `0x0ddf…`, `0x8d53…`, `0x7aa4…`, `0xccbe…`), between 36 seconds and 8 minutes 48 seconds after their USDT had left.
2. **Aave as a converter from freezable USDT to unfreezable ETH.**
   - *Fact:* 60M USDT supplied and 19,762.4 ETH borrowed between 20:57:59 and 21:00:59. The ETH left the wallet at 21:02:35, and Tether blacklisted the wallet 12 seconds later.
   - *Fact:* the effective price was about $3,036 per ETH (60M / 19,762), worse than the intent fills (about $2,657 on average; $2,604 on UniswapX, $2,990 on SimpleSettlement) and close to the worst DEX legs (about $2,884 on average, $3,031 at worst).
   - *Inference:* Aave was not chosen for price. The likely reasons are that it was instant and size-insensitive at the moment DEX depth was exhausted, and that the result could not be frozen. Once Tether froze the USDT, any ETH recovered from it was pure gain, so a 74% LTV haircut on doomed USDT was a good trade for the attacker.
   - *Inference:* the residual collateral is a stranded asset for both sides. The attacker cannot use it, and Aave holds an open, slightly healthy loan whose liquidation would hand USDT to liquidators.
3. **Paying up to market makers.**
   - *Fact:* the intent fills (UniswapX V2DutchOrderReactor and SimpleSettlement) went to five filler addresses (`0x74ed…`, `0x0000000000be…`, `0xbeef0296…`, `0xec4f…`, `0x9b13…`). These took 325M USDT for 122,316 ETH, about $2,657 per ETH against about $2,300.
   - *Inference:* the fillers priced in freeze risk, since USDT they held could be frozen too, and still took the flow. Reported implied loss: 12-26% (Elliptic, Cointegrity); about $119M of slippage with about $60M kept by counterparties (Bitquery). *Fact:* none of the five fillers is on Tether's blacklist (`isBlackListed` returns false for all five at block ~26,312,140), so the 325M USDT they took is now in circulation outside the freeze net.
4. **No laundering exits yet.**
   - *Fact:* none of the seven ETH stashes, 19 BTC lots, the XRP account or the Solana account has sent anything.
   - *Inference:* this matches past TraderTraitor patterns (Bybit 2025): consolidate into unfreezable base assets, wait, then launder slowly through bridges, THORChain and OTC desks. That last step is a projection (TRM), not an observation.
5. **Tron mirrors Ethereum.**
   - *Fact:* the attacker swapped about 234M USDT for 638.19M TRX in 27 minutes before the freezes landed, sent 65.99M to a fresh wallet (caught), and tried a 10,000 USDT JustLend supply.
   - *Inference:* the JustLend supply looks like a test of the same lending trick used on Aave. It did not scale before the freeze. TRM's "300M USDT to a wallet supplying JustLend" describes `TPBk…`, which received 300M but supplied only 10,000 to JustLend.
6. **L2 governance as a freeze rail.**
   - *Fact:* on Arbitrum and Optimism the stolen governance tokens and ETH were moved out of attacker wallets by privileged actions (Security Council; an L1-originated deposit tx).
   - *Inference:* these are the only places where non-stablecoin assets were clawed back.
7. **Address-poisoning noise.**
   - *Fact:* hundreds of fake "ETH", "USDT" and "OP" token transfers to look-alike addresses surround every attacker wallet, for example `0x9749110a…c762` and `0x3e2b6f46…32d5`. These are third-party spam. They are excluded from the ledger, but they inflate naive transfer counts.

---

## 8. Protocol impact (Aave first)

- **Freezes** (reported by the Aave forum): Guardian multisigs froze 175 V3 reserves on 16 networks and 117 V4 reserves on 4 networks between 21:42 and 23:04 UTC. The first freeze tx is `0x2d144463…` (21:42:11, verified, a Safe execution with 76 logs). The Horizon RWA market stayed open; no market was paused.
- **Utilization, Aave V3 Ethereum Core** (fact, `getReserveData` plus token supplies):

| Block (UTC) | USDT util | USDC util | WETH util | Frozen flag |
|---|---|---|---|---|
| 26,300,700 (29 Oct 20:10, before the attack) | 92.69% | 94.44% | 79.21% | no |
| 26,301,150 (21:40, after the attacker position) | 90.38% | 93.05% | 81.90% | no |
| 26,301,300 (22:10) | 91.05% | 94.57% | 82.03% | **yes** |
| 26,303,400 (30 Oct 05:12) | **99.89%** | **97.45%** | 83.23% | yes |
| 26,312,100 (31 Oct 10:18) | 95.43% | 95.83% | 85.10% | no (unfrozen) |

  Between 21:40 on 29 Oct and 05:12 on 30 Oct, USDT supply fell from 2,771M to 2,488M (about $283M withdrawn) and USDC supply from 2,412M to 2,075M (about $336M), while debt barely moved. That is the "withdrawals continued with no new supply" squeeze. Note that the baseline was already above 92% before the attack. The attacker's own 60M supply briefly lowered USDT utilization, and its 19,762 WETH borrow raised WETH utilization by about 2.7 points.
- **Risk actions** (reported): temporary Slope2 caps (10% APR at full utilization on the largest stablecoin reserves and WETH on the V4 Core Hub); borrow caps set about 2% above pre-exploit levels, removing about $3.7B of unused V3 capacity and $130M on V4; LTV 0 on V3 (collateral factor 0 on V4) for USDT, USDC, USDT0, POL, WAVAX, sAVAX, XAUt, PAXG and OP. A four-wave reopening plan was published; our reads show wave 1 (unfreeze with LTV kept at 0) live on Core USDT, USDC and WETH by 31 Oct 10:18.
- **Bad debt:** none (forum; consistent with HF 1.054 by our read).
- **GHO:** about 4.6M GHO was redeemed for USDT through the GSM between 21:49 and 22:07 (forum; tx `0x48fc6d56…` verified as a CoW settlement at 22:01:11; not attributed to the attacker). GHO moved from about $0.998 to $0.997.
- **Other protocols:** Uniswap pools and intent fillers absorbed about 435M USDT of flow at large slippage (fact); JustLend saw only a 10,000 USDT test (fact). Arbitrum and Optimism governance acted directly on attacker balances (fact).
- **Post-mortems and threads:** [Aave forum thread](https://governance.aave.com/t/binance-hot-wallet-exploit-aaves-response/25954) (includes LlamaRisk and community proposals for velocity limits and automated cap updaters); Binance posts on X cited by [TFTC](https://www.tftc.io/binance-hack-hot-wallet-signing-eip-7702-stablecoin-freeze-aave); the Arbitrum Security Council notice (00:08 UTC, reported).

---

## 9. End-state allocation (approximate)

Denominator: TRM's ~$6.36B at theft prices. Converted assets are counted where they ended up.

| Destination | Approx USD | Share |
|---|---|---|
| Frozen or seized: USDT 1.774B, USDC 0.825B, RLUSD 0.041B, USD1 0.028B, Arbitrum 0.031B, OP 0.005B | ~$2.70B | ~42% |
| BTC held, untouched (18,270.2) | ~$1.48B | ~23% |
| ETH stashes, untouched (512,621 ETH, including 160,451 ETH bought with USDT and 19,762 ETH borrowed on Aave) | ~$1.15-1.18B | ~18-19% |
| XRP held, untouched (233.46M) | ~$0.30B | ~5% |
| TRX (638.2M split into 5 wallets, plus 88.9M in `TRBd…`); price assumed about $0.33 | ~$0.24B | ~4% |
| SOL held, untouched (970.5K) | ~$0.10B | ~1.5% |
| Aave collateral left behind (60M USDT) | ~$0.06B | ~1% |
| Conversion losses (Bitquery estimate) | ~$0.12B | ~2% |
| Other or unresolved: WBETH (29,934, unsold), POL (46.6M), AVAX proceeds, WLFI (48.5M), long-tail tokens | remainder | ~3% |

---

## 10. Unverified leads

| Lead | Source | Why it is unverified |
|---|---|---|
| Binance and Bitget proceeds met at `0x1510…eb7` at 04:02 on 30 Oct, after THORChain | ZachXBT ([x.com/zachxbt/status/2116030284261179538](https://x.com/zachxbt/status/2116030284261179538)), Cointegrity | Address truncated in every source we could read |
| About $1.9M of TRX through a roughly 28-hop peel chain, THORChain and Hyperlane | [Cointegrity](https://cointegrity.substack.com/p/the-binance-hack-of-29-october-2026) | Not traced; `TRBd…` holds 88.9M TRX, more than the 46.38M it got from `TG5i…`, so it has other inflows to follow |
| $38-67M left the traced Tron addresses, mostly into ETH via swap services and bridges | [Elliptic](https://www.elliptic.co/insights/binance-largest-hack-in-history/) | Not traced |
| All AVAX sold for USDC, bridged with CCTP, swapped for 7,242.8 ETH (30 Oct 11:38-12:29) | Elliptic | Only the 12:29 ParaSwap sale (`0x70879f96…`) is verified; the ETH destination was not found |
| Solana address `9Skjw…TjdQ` and a NEAR address | Elliptic (per Cointegrity) | Truncated |
| 200M USDT sent by a Binance-listed wallet into Binance 14 at 21:42, then swept 72 seconds later | [Bitquery](https://www.bitquery.io/investigations/binance-hack) | The 21:44:11 sweep (`0x55ba4dab…`) is verified; the inbound leg to Binance 14 was not checked |
| Ripple RLUSD freeze at 22:01; WLF freezes at 20:57, 22:10 and 22:26 | TRM, Cointegrity, Bitquery | Balances verified; freeze tx hashes not located |
| Tether freezes of 8.4M USDt (Avalanche) and 6.2M USDT0 (Polygon) | TRM | Balances unmoved; freeze txs not located |
| Binance froze WBETH | Elliptic | The 29,934 WBETH is unsold in `0x7f9dc988…`; freeze not confirmed |
| Elliptic counts 519,104 ETH held; Bitquery 508,621; we read 512,621 in seven stashes (516,850 in eight after section 15) | Elliptic, Bitquery | Other stashes may exist outside the wallets we traced |
| TRM's "300M USDT to a wallet supplying JustLend" | TRM | On-chain JustLend supply is only 10,000 USDT |
| `TTJxU3P8rHycAyFY4kVtGNfmnMH4ezcuM9`, approved and called by `TPBk…` and `TCzBTk…` (method `0x87517c45`) | on-chain | Contract not identified |
| Arkham entity `21a94755-f604-45e5-9501-6542e23005e8` for the exploiter cluster | Aave forum | Not opened |

---

## 11. Sources

- TRM Labs, "North Korea steals USD 6.36 billion from Binance": https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history
- Elliptic, "The largest theft in history": https://www.elliptic.co/insights/binance-largest-hack-in-history/
- Bitquery investigation: https://www.bitquery.io/investigations/binance-hack
- Cointegrity, "The Binance Hack of 29 October 2026: Preliminary Analysis": https://cointegrity.substack.com/p/the-binance-hack-of-29-october-2026
- Aave governance forum, "Binance Hot Wallet Exploit: Aave's Response": https://governance.aave.com/t/binance-hot-wallet-exploit-aaves-response/25954
- TFTC, "Binance's $6.3 Billion Single Point of Failure" (links to Binance and Arbitrum posts on X): https://www.tftc.io/binance-hack-hot-wallet-signing-eip-7702-stablecoin-freeze-aave
- Bitcoin.com News, attribution (TRM, ZachXBT, 0xQuit, WazzCrypto): https://news.bitcoin.com/security/binance-hack-north-korea-lazarus-tradertraitor/
- CoinDesk, Lazarus attribution: https://www.coindesk.com/policy/2026/10/29/crypto-s-longtime-foe-north-korea-s-lazarus-group-likely-behind-binance-hack-blockchain-sleuths
- Coverage of the Aave freezes: https://www.tokenpost.com/news/technology/44936 , https://www.coininsider.org/news/aave-freezes-new-deposits-and-borrowing-blocking-collateral-top-ups/ , https://blockchainreporter.net/aave-freezes-v3-v4-markets-binance-exploiter/
- Binance on X (via TFTC): https://x.com/binance/status/2115993361517891592 , https://x.com/binance/status/2116089661408108712 ; Richard Teng: https://x.com/_RichardTeng/status/2116176335722913865 ; Arbitrum: https://x.com/arbitrum/status/2115961730920841644
- Chain data: Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche and BNB Chain via Alchemy RPC and the Etherscan v2 API; Tron via api.trongrid.io; Bitcoin via mempool.space; XRP Ledger via xrplcluster.com; Solana via api.mainnet-beta.solana.com.

---

## 12. Still unknown

1. Where the 512,621 ETH and 18,270 BTC go next. Both are untouched at the cut-off. This is the main thing to watch: stashes `0x8532…`, `0xc887…`, `0x897c…`, `0x5440…`, `0x79e7…`, `0x03b0…`, `0xc209…` and the 19 BTC lots.
2. Whether the five TRX split wallets and `TRBd…` have already started the THORChain or Hyperlane exits that Cointegrity reports.
3. Who the intent fillers are (`0xbeef0296…`, `0x0000000000be…`, `0x74ed…`, `0x9b13…`, `0xec4f…`; none is blacklisted) and whether any of them will return the premium or the USDT.
4. How Aave resolves the open position: who liquidates it if ETH rises about 5%, and what happens to the seized USDT.
5. The Avalanche AVAX sale destination (the 7,242.8 ETH Elliptic reports), and the fate of the 200,005 AVAX sent to `0x554d…`.
6. The exact mechanism and authority behind the Optimism OP move (a deposit tx with no L1 action from the attacker), and a primary governance post for it.
7. The Bitget link (`0x1510…eb7`) in full, and whether Bitget proceeds now share wallets with these funds.

---

## 13. Later reads (31 Oct, 12:45:59 UTC)

Re-read at Ethereum block 26,312,831, about 2 h 20 min after the cut-off, with an earlier Ethereum-only version of `scripts/snapshot.mjs`.

- **Nothing has moved (fact).** All seven ETH stashes still have nonce 0, and their balances are unchanged: 512,620.5 ETH in total. The nonces of `0x5227…` (729), `0xa97b…` (1,269), the RLUSD seller `0xe702…` (32), the Aave wallet `0x8d53…` (9), the Base seller `0x11861b31…` (1) and the WBETH holder `0x7f9dc988…` (25) are the same as at block 26,312,138.
- **Aave position (fact).** Still open: collateral $59.92M, debt $44.42M (about 19,764 WETH), health factor **1.0521** (1.0544 at the cut-off) at an Aave oracle ETH price of $2,247.67. With the 0.78 liquidation threshold, the position becomes liquidatable at about **$2,365 per ETH**, a 5.2% rise. This matches the Aave forum's figure.
- **Spot-checks of the ledger (fact).** We re-read the main sweep (`0x53bd38b8…`, block 26,300,770) and Tether's first freeze (`0x7baba482…`, block 26,300,954); both succeeded. They are 184 blocks apart, about 37 minutes, which matches 20:24:23 and 21:01:35.
- **How far behind Tether was, two ways (fact).**
  - *After the USDT left:* Tether froze wallets 36 s to 8 min 48 s after their USDT had left. This covers the five freezes that hit empty wallets.
  - *After funding:* hops funded after 21:01:35 were frozen 2 min 48 s (`0xb171…`) to 6 min 36 s (`0xaa24…`) after they received USDT. The three wallets funded before it (`0x9749…`, `0x0ddf…`, Aave wallet `0x8d53…`) were frozen 10 to 31 minutes after funding. `0x77ed…` and `0x811f…` were never blacklisted.
  - Section 1 now says this, instead of "3 to 7 minutes behind each new deposit".
- **Not re-read in this pass:** Bitcoin, XRP, Solana, Tron, the L2s and the intent fillers' blacklist status. They stand as of the cut-off.

## 14. Files

| What | Where |
|---|---|
| Transaction ledger (CSV and JSON), one row per transaction with an explorer link | `data/ledger.csv`, `data/ledger.json` |
| Address book | `data/addresses.csv` |
| Freezes, bridges, positions, Aave utilization, end state, unverified leads, sources | `data/*.csv` |
| Every TRX transfer out of `TRBd…` since 30 Oct | `data/raw/tron_TRBd_outflows.csv` |
| Timestamped all-chain snapshots | `data/snapshots/` |
| Re-run the snapshot yourself | `scripts/snapshot.mjs` |
| Six flow diagrams (as of the first cut-off) | `diagrams/` |

## 15. Later reads (31 Oct, 15:31 UTC): the Tron money is moving, and an eighth ETH stash

All chains re-read with `scripts/snapshot.mjs`, Ethereum block 26,313,654 (15:30:59 UTC). Snapshot file: `data/snapshots/2026-10-31T153110Z.json`.

- **The TRX is being laundered, and this started before the first cut-off (fact).** The first report missed it.
  - Four of the five TRX split wallets sent their 120M TRX each straight back to `TRBd…`: 30 Oct 10:20:48 (`0ae2b5a4…`, 30 seconds after it was funded), 31 Oct 01:01:15 (`bb05d43b…`), 07:58:48 (`d3684f76…`) and 14:50:51 (`7f799c3c…`). The fifth, `TKkH…` with 158.2M TRX, has not sent anything.
  - From 30 Oct 02:19 to the snapshot, `TRBd…` made **875 transfers totalling 429.71M TRX** (about $142M at $0.33) to **176 recipient wallets**. The transfers are round amounts between 100,000 and 600,000 TRX, and they are speeding up: 34.4M TRX left in the 14:00 UTC hour on 31 Oct alone. `TRBd…` still held 97.4M TRX at the snapshot. Every transfer is in `data/raw/tron_TRBd_outflows.csv`.
  - The ten largest recipients were all created on 30 or 31 Oct, and each forwards its TRX on to further wallets. We found no shared endpoint within two hops. *Inference:* this is a layered dispersal, the slow-laundering phase TRM predicted, and it began on Tron before Ethereum.
  - This changes section 9. By the snapshot, about 430M of the roughly 727M TRX under the attacker's control had left the traced wallets. It also answers question 2 in section 12.
- **An eighth ETH stash (fact).** `0x8d4b8ee62124b7ee140a51ddd07390a56f1c9e19` holds **4,229.18 ETH** and has nonce 0.
  - It was first funded on 30 Oct, with 3,236.7 ETH from three seller wallets (`0x0084847b…` 806.3, `0xf1eadb24…` 2,156.0, `0xa3b3dee8…` 274.4). So it existed at the first cut-off and was missed. It got another 992.5 ETH on 31 Oct.
  - With it, the stash total is **516,849.7 ETH across eight wallets**. The gap to Elliptic's 519,104 ETH narrows to about 2,250 ETH.
- **`0xa97b…` started a second selling round on Ethereum (fact).**
  - From 12:48 to 14:32 UTC on 31 Oct it funded 14 fresh seller wallets with 0.05 ETH of gas each (the first round used 0.5 ETH). It then gave them long-tail tokens such as ENSO, FF, REZ, OPEN, ZBT and SAHARA. Its nonce went from 1,269 to 1,318.
  - The proceeds go to the eighth stash. One seller sent 338.4 ETH, another 252.8, and `0xa97b…` itself sent 244.69 ETH at 15:25:47.
  - One move looks like a slip. `0xa97b…` sent 244.94 ETH to `0x209178dd…` at 13:48:59, and `0x209178dd…` sent the same amount straight back 96 seconds later. *Inference:* an operator mistake or a test.
  - Look-alike spam transfers (address poisoning) appeared around every new wallet within minutes. They are not in the ledger.
- **Still unmoved (fact):**
  - All 19 Bitcoin lots are unspent, 18,270.2 BTC in total. We followed the full peel chain from `bc1q0mtc…`, and all 19 peel transactions are now in the ledger.
  - The XRP account still holds 233,461,943.7 XRP. Its sequence equals its creation ledger, so it has never sent.
  - The Solana account still holds 970,554.1 SOL. Its newest signatures are incoming dust.
  - The seven original ETH stashes still have nonce 0 and unchanged balances.
  - The frozen balances are in place: 1,175.46M USDT and 823M USDC in `0x5227…`, 175.0M USDT in `0xaa24…`, 30M USDT in `0xb171…`, and 40.54M RLUSD in `0xe702…`.
  - The 29,934 WBETH is still in `0x7f9dc988…`. None of the five intent fillers is on Tether's blacklist.
- **Aave position (fact).** Health factor 1.0518 at an oracle ETH price of $2,249.59. It becomes liquidatable at about $2,366.
- **Ledger changes in this pass.**
  - Rows went from 188 to 231: 13 Bitcoin peel transactions, 4 Tron consolidations, and 26 Ethereum rows for the second selling round and the eighth stash.
  - Five XRPL rows now carry the ledger close time, and every Tron row now carries its block number.
