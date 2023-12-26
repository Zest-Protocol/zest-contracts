
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

(try! (contract-call? .sBTC mint u1000000000000000 'ST5C7XW3E9ERSDQTGSC9R1AQRHZWVV80PVDA5FGT))
(try! (contract-call? .stSTX mint u1000000000000000 'ST5C7XW3E9ERSDQTGSC9R1AQRHZWVV80PVDA5FGT))
(try! (contract-call? .diko mint u1000000000000000 'ST5C7XW3E9ERSDQTGSC9R1AQRHZWVV80PVDA5FGT))
(try! (contract-call? .USDA mint u1000000000000000 'ST5C7XW3E9ERSDQTGSC9R1AQRHZWVV80PVDA5FGT))
(try! (contract-call? .xUSD mint u1000000000000000 'ST5C7XW3E9ERSDQTGSC9R1AQRHZWVV80PVDA5FGT))

(try! (contract-call? .sBTC mint u1000000000000000 'ST2B3CHPEMP1KFGJJGF003KTZJN4BX90F4MMCRQQD))
(try! (contract-call? .stSTX mint u1000000000000000 'ST2B3CHPEMP1KFGJJGF003KTZJN4BX90F4MMCRQQD))
(try! (contract-call? .diko mint u1000000000000000 'ST2B3CHPEMP1KFGJJGF003KTZJN4BX90F4MMCRQQD))
(try! (contract-call? .USDA mint u1000000000000000 'ST2B3CHPEMP1KFGJJGF003KTZJN4BX90F4MMCRQQD))
(try! (contract-call? .xUSD mint u1000000000000000 'ST2B3CHPEMP1KFGJJGF003KTZJN4BX90F4MMCRQQD))

(try! (contract-call? .sBTC mint u1000000000000000 'ST3ZJ8630RB3GS48G4FJPFBFWX7H4RC7V6YR4EADM))
(try! (contract-call? .stSTX mint u1000000000000000 'ST3ZJ8630RB3GS48G4FJPFBFWX7H4RC7V6YR4EADM))
(try! (contract-call? .diko mint u1000000000000000 'ST3ZJ8630RB3GS48G4FJPFBFWX7H4RC7V6YR4EADM))
(try! (contract-call? .USDA mint u1000000000000000 'ST3ZJ8630RB3GS48G4FJPFBFWX7H4RC7V6YR4EADM))
(try! (contract-call? .xUSD mint u1000000000000000 'ST3ZJ8630RB3GS48G4FJPFBFWX7H4RC7V6YR4EADM))


(define-constant max-value u340282366920938463463374607431768211455)

(try!
  (contract-call? .pool-0-reserve
    init
    .lp-stSTX
    .stSTX
    u6
    u80000000
    max-value
    .interest-rate-strategy-default
  )
)



(try!
  (contract-call? .pool-0-reserve
    init
    .lp-sBTC
    .sBTC
    u6
    u90000000
    max-value
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-0-reserve
    init
    .lp-diko
    .diko
    u6
    u60000000
    max-value
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-0-reserve
    init
    .lp-USDA
    .USDA
    u6
    u90000000
    max-value
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-0-reserve
    init
    .lp-xUSD
    .xUSD
    u6
    u100000000
    max-value
    .interest-rate-strategy-default
  )
)


(contract-call? .pool-0-reserve set-usage-as-collateral-enabled .stSTX true)
(contract-call? .pool-0-reserve set-usage-as-collateral-enabled .sBTC true)
(contract-call? .pool-0-reserve set-usage-as-collateral-enabled .diko true)
(contract-call? .pool-0-reserve set-usage-as-collateral-enabled .USDA true)
(contract-call? .pool-0-reserve set-usage-as-collateral-enabled .xUSD true)

(contract-call? .pool-0-reserve set-borrowing-enabled .xUSD true)
(contract-call? .pool-0-reserve set-borrowing-enabled .sBTC true)
(contract-call? .pool-0-reserve set-borrowing-enabled .diko true)
(contract-call? .pool-0-reserve set-borrowing-enabled .USDA true)
(contract-call? .pool-0-reserve set-borrowing-enabled .xUSD true)
