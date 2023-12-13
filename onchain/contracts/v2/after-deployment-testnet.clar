
;; (try! (contract-call? .loan-v1-0 add-borrower 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))

(try! (contract-call? .executor-dao construct .zgp000-bootstrap))
(try! (contract-call? .globals add-admin tx-sender))
(try! (contract-call? .globals add-governor tx-sender))
(try! (contract-call? .Wrapped-Bitcoin initialize "xBTC" "xBTC" u8 (as-contract tx-sender)))
(try! (contract-call? .Wrapped-USD initialize "xUSD" "xUSD" u8 (as-contract tx-sender)))
(try! (contract-call? .Wrapped-Bitcoin add-principal-to-role u1 (as-contract tx-sender)))
(try! (contract-call? .Wrapped-USD add-principal-to-role u1 (as-contract tx-sender)))
(try! (contract-call? .Wrapped-Bitcoin set-token-uri u"https://wrapped.com/xbtc.json"))
(try! (contract-call? .Wrapped-USD set-token-uri u"https://wrapped.com/xusd.json"))
;; testnet
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'STC6G8DC2A0V58A6399M22C06BF4EK5JZSQW7BWP))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'STC6G8DC2A0V58A6399M22C06BF4EK5JZSQW7BWP))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST1G4X22QKFSE2XTZGWKB8X897PA8RP3M2WTTYHW6))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST1G4X22QKFSE2XTZGWKB8X897PA8RP3M2WTTYHW6))

(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST2X8B1M2ZY2HWG4FDW9CS1X95Y5NVTJ7AAGVACD))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST2X8B1M2ZY2HWG4FDW9CS1X95Y5NVTJ7AAGVACD))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST3F8XCXDXACTPGXE3B4QHXC55E4HPM6Y613KXVTF))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST3F8XCXDXACTPGXE3B4QHXC55E4HPM6Y613KXVTF))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST3M03Z0DRW0Y6442PT4PY11G5F8ZHRF82W4TJJX8))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST3M03Z0DRW0Y6442PT4PY11G5F8ZHRF82W4TJJX8))


;; (try! (contract-call? .Wrapped-Bitcoin mint-tokens u100000000000000 .supplier-interface))

(try! (contract-call? .Wrapped-USD mint-tokens u200000000000000 .swap-router))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u100000000000000 .swap-router))
