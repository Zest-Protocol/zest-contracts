
;; (try! (contract-call? .loan-v1-0 add-borrower 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))

;; (try! (contract-call? .Wrapped-Bitcoin initialize "xBTC" "xBTC" u8 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-Bitcoin add-principal-to-role u1 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-Bitcoin set-token-uri u"https://wrapped.com/xbtc.json"))

;; (try! (contract-call? .executor-dao construct .zgp000-bootstrap))
;; (try! (contract-call? .globals add-admin tx-sender))
;; (try! (contract-call? .globals add-governor tx-sender))
;; (try! (contract-call? .Wrapped-USD initialize "xUSD" "xUSD" u8 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-USD add-principal-to-role u1 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-USD set-token-uri u"https://wrapped.com/xusd.json"))

;; testnet
;; (try! (contract-call? .executor-dao construct .zgp000-bootstrap))

(try! (contract-call? .sBTC mint u1000000000000000 'ST317KEDCKCQ36JY3Z0DGY8TMJH3QSZ1VMJX2R2ZS))
(try! (contract-call? .stSTX mint u1000000000000000 'ST317KEDCKCQ36JY3Z0DGY8TMJH3QSZ1VMJX2R2ZS))

(try! (contract-call? .sBTC mint u1000000000000000 'ST7AEGG17NW8W44R4T5REP3VK2HP50GGYHM1BFH7))
(try! (contract-call? .stSTX mint u1000000000000000 'ST7AEGG17NW8W44R4T5REP3VK2HP50GGYHM1BFH7))

(try! (contract-call? .sBTC mint u1000000000000000 'ST2TPWFTCHR74JZJ715T6NR1DVDB25T1DNP77VBDX))
(try! (contract-call? .stSTX mint u1000000000000000 'ST2TPWFTCHR74JZJ715T6NR1DVDB25T1DNP77VBDX))

(try!
  (contract-call? .pool-0-reserve
    init
    .lp-token-0
    .stSTX
    u6
    .interest-rate-strategy-default
  )
)


(try!
  (contract-call? .pool-0-reserve
    init
    .lp-token-0
    .sBTC
    u6
    .interest-rate-strategy-default
  )
)
