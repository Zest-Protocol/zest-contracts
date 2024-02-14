
;; (try! (contract-call? .loan-v1-0 add-borrower 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))

;; (try! (contract-call? .Wrapped-Bitcoin initialize "xBTC" "xBTC" u8 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-Bitcoin add-principal-to-role u1 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-Bitcoin set-token-uri u"https://wrapped.com/xbtc.json"))

;; (try! (contract-call? .executor-dao construct .zgp000-bootstrap))
;; (try! (contract-call? .globals add-admin tx-sender))
;; (try! (contract-call? .globals add-governor tx-sender))
;; (try! (contract-call? .Wrapped-USD initialize "xusd" "xusd" u8 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-USD add-principal-to-role u1 (as-contract tx-sender)))
;; (try! (contract-call? .Wrapped-USD set-token-uri u"https://wrapped.com/xusd.json"))

;; testnet
;; (try! (contract-call? .executor-dao construct .zgp000-bootstrap))

(try! (contract-call? .sbtc mint u1000000000000000 'ST20QDTNW597G92232Z14XPRPNGEHHQ71CAZDJP52))
(try! (contract-call? .ststx mint u1000000000000000 'ST20QDTNW597G92232Z14XPRPNGEHHQ71CAZDJP52))
(try! (contract-call? .diko mint u1000000000000000 'ST20QDTNW597G92232Z14XPRPNGEHHQ71CAZDJP52))
(try! (contract-call? .usda mint u1000000000000000 'ST20QDTNW597G92232Z14XPRPNGEHHQ71CAZDJP52))
(try! (contract-call? .xusd mint u1000000000000000 'ST20QDTNW597G92232Z14XPRPNGEHHQ71CAZDJP52))

(try! (contract-call? .sbtc mint u1000000000000000 'ST20FYG50PTXQMF0TJ9WA4P7WV4Y1WQVRQTR988KN))
(try! (contract-call? .ststx mint u1000000000000000 'ST20FYG50PTXQMF0TJ9WA4P7WV4Y1WQVRQTR988KN))
(try! (contract-call? .diko mint u1000000000000000 'ST20FYG50PTXQMF0TJ9WA4P7WV4Y1WQVRQTR988KN))
(try! (contract-call? .usda mint u1000000000000000 'ST20FYG50PTXQMF0TJ9WA4P7WV4Y1WQVRQTR988KN))
(try! (contract-call? .xusd mint u1000000000000000 'ST20FYG50PTXQMF0TJ9WA4P7WV4Y1WQVRQTR988KN))

(try! (contract-call? .sbtc mint u1000000000000000 'ST2VB13Q8D8FB1P0CWE1MC8TTC56WEFQQ2MY5799Q))
(try! (contract-call? .ststx mint u1000000000000000 'ST2VB13Q8D8FB1P0CWE1MC8TTC56WEFQQ2MY5799Q))
(try! (contract-call? .diko mint u1000000000000000 'ST2VB13Q8D8FB1P0CWE1MC8TTC56WEFQQ2MY5799Q))
(try! (contract-call? .usda mint u1000000000000000 'ST2VB13Q8D8FB1P0CWE1MC8TTC56WEFQQ2MY5799Q))
(try! (contract-call? .xusd mint u1000000000000000 'ST2VB13Q8D8FB1P0CWE1MC8TTC56WEFQQ2MY5799Q))

(try! (contract-call? .sbtc mint u1000000000000000 'STSEYAVNAX0B7WWF16ZZ01PF0S0BZYC6D9MBN0RV))
(try! (contract-call? .ststx mint u1000000000000000 'STSEYAVNAX0B7WWF16ZZ01PF0S0BZYC6D9MBN0RV))
(try! (contract-call? .diko mint u1000000000000000 'STSEYAVNAX0B7WWF16ZZ01PF0S0BZYC6D9MBN0RV))
(try! (contract-call? .usda mint u1000000000000000 'STSEYAVNAX0B7WWF16ZZ01PF0S0BZYC6D9MBN0RV))
(try! (contract-call? .xusd mint u1000000000000000 'STSEYAVNAX0B7WWF16ZZ01PF0S0BZYC6D9MBN0RV))

(try! (contract-call? .sbtc mint u1000000000000000 'ST22YKNGHD4Q4BFMM4RY4EQENR16R0MY6EH7P8ZNF))
(try! (contract-call? .ststx mint u1000000000000000 'ST22YKNGHD4Q4BFMM4RY4EQENR16R0MY6EH7P8ZNF))
(try! (contract-call? .diko mint u1000000000000000 'ST22YKNGHD4Q4BFMM4RY4EQENR16R0MY6EH7P8ZNF))
(try! (contract-call? .usda mint u1000000000000000 'ST22YKNGHD4Q4BFMM4RY4EQENR16R0MY6EH7P8ZNF))
(try! (contract-call? .xusd mint u1000000000000000 'ST22YKNGHD4Q4BFMM4RY4EQENR16R0MY6EH7P8ZNF))

(try! (contract-call? .sbtc mint u1000000000000000 'ST5X8GCCDPVJ0DNPSS5QD1MEWB93DXSNZCYX8ZNG))
(try! (contract-call? .ststx mint u1000000000000000 'ST5X8GCCDPVJ0DNPSS5QD1MEWB93DXSNZCYX8ZNG))
(try! (contract-call? .diko mint u1000000000000000 'ST5X8GCCDPVJ0DNPSS5QD1MEWB93DXSNZCYX8ZNG))
(try! (contract-call? .usda mint u1000000000000000 'ST5X8GCCDPVJ0DNPSS5QD1MEWB93DXSNZCYX8ZNG))
(try! (contract-call? .xusd mint u1000000000000000 'ST5X8GCCDPVJ0DNPSS5QD1MEWB93DXSNZCYX8ZNG))


(define-constant max-value u340282366920938463463374607431768211455)
(define-constant ststx-supply-cap u10000000000000)
(define-constant ststx-borrow-cap u10000000000000)

(define-constant sbtc-supply-cap u1000000000000)
(define-constant sbtc-borrow-cap u900000000000)

(define-constant diko-supply-cap u200000000000000)
(define-constant diko-borrow-cap u150000000000000)

(define-constant usda-supply-cap u10000000000000)
(define-constant usda-borrow-cap u10000000000000)

(define-constant xusd-supply-cap u10000000000000)
(define-constant xusd-borrow-cap u10000000000000)

(try!
  (contract-call? .pool-borrow
    init
    .lp-ststx
    .ststx
    u6
    ststx-supply-cap
    ststx-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .ststx)

(try!
  (contract-call? .pool-borrow
    init
    .lp-wstx
    .wstx
    u6
    ststx-supply-cap
    ststx-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .wstx)

(try!
  (contract-call? .pool-borrow
    init
    .lp-sbtc
    .sbtc
    u8
    sbtc-supply-cap
    sbtc-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .sbtc)

(try!
  (contract-call? .pool-borrow
    init
    .lp-diko
    .diko
    u6
    diko-supply-cap
    diko-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .diko)

(try!
  (contract-call? .pool-borrow
    init
    .lp-usda
    .usda
    u6
    usda-supply-cap
    usda-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .usda)

(try!
  (contract-call? .pool-borrow
    init
    .lp-xusd
    .xusd
    u6
    xusd-supply-cap
    xusd-supply-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .xusd)

(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .ststx
    true
    u80000000
    u90000000
    u5000000
  )
)
(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .wstx
    true
    u80000000
    u90000000
    u5000000
  )
)
(try!
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .sbtc
    true
    u80000000
    u90000000
    u5000000
  )
)
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .diko
;;     true
;;     u60000000
;;     u90000000
;;     u5000000
;;   )
;; )
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .usda
;;     true
;;     u70000000
;;     u90000000
;;     u5000000
;;   )
;; )
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .xusd
;;     true
;;     u80000000
;;     u90000000
;;     u5000000
;;   )
;; )

;; (contract-call? .pool-borrow set-borrowing-enabled .ststx true)
(contract-call? .pool-borrow set-borrowing-enabled .wstx true)
(contract-call? .pool-borrow set-borrowing-enabled .sbtc true)
(contract-call? .pool-borrow set-borrowing-enabled .diko true)
(contract-call? .pool-borrow set-borrowing-enabled .usda true)
(contract-call? .pool-borrow set-borrowing-enabled .xusd true)

(contract-call? .pool-borrow add-isolated-asset .ststx u1000000000000000)

(contract-call? .pool-borrow set-borroweable-isolated .xusd)
(contract-call? .pool-borrow set-borroweable-isolated .usda)

(contract-call? .oracle set-price .ststx u163000000)
(contract-call? .oracle set-price .wstx u160000000)
(contract-call? .oracle set-price .sbtc u4000000000000)
(contract-call? .oracle set-price .diko u40000000)
(contract-call? .oracle set-price .usda u90000000)
(contract-call? .oracle set-price .xusd u100000000)

(contract-call? .pool-borrow supply
  .lp-diko
  .pool-0-reserve
  .diko
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-sbtc
  .pool-0-reserve
  .sbtc
  u100000000000
  tx-sender
)


(contract-call? .pool-borrow supply
  .lp-ststx
  .pool-0-reserve
  .ststx
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-xusd
  .pool-0-reserve
  .xusd
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-usda
  .pool-0-reserve
  .usda
  u100000000000
  tx-sender
)
