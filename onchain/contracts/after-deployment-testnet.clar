
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


(try! (contract-call? .Wrapped-Bitcoin add-principal-to-role u1 'ST1E0GWNR2PSN2JDVQ4S1KJ9R15NJBSSMFN098M4R))
(try! (contract-call? .Wrapped-USD add-principal-to-role u1 'ST1E0GWNR2PSN2JDVQ4S1KJ9R15NJBSSMFN098M4R))

;; testnet
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'STCBF5D65XRH16Q8PH44FZ888MKDFEFBYPAMAHEX))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'STCBF5D65XRH16Q8PH44FZ888MKDFEFBYPAMAHEX))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST19DKRQTAW30FG1V45M6FW4D54DJKGHK4FTPY0ZH))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST19DKRQTAW30FG1V45M6FW4D54DJKGHK4FTPY0ZH))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST231180KGF88J9H0NTYJ48KGZT5BVKVTDS63C2ER))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST231180KGF88J9H0NTYJ48KGZT5BVKVTDS63C2ER))

(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST3DPVRQMAB5K0STSPER8AX7FKSFXVNHCN6M4YCES))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST3DPVRQMAB5K0STSPER8AX7FKSFXVNHCN6M4YCES))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u10000000000000000 'ST1E0GWNR2PSN2JDVQ4S1KJ9R15NJBSSMFN098M4R))
(try! (contract-call? .Wrapped-USD mint-tokens u10000000000000000 'ST1E0GWNR2PSN2JDVQ4S1KJ9R15NJBSSMFN098M4R))

(try! (contract-call? .Wrapped-Bitcoin mint-tokens u100000000000000 .supplier-controller-0))

(try! (contract-call? .Wrapped-USD mint-tokens u200000000000000 .swap-router))
(try! (contract-call? .Wrapped-Bitcoin mint-tokens u100000000000000 .swap-router))
