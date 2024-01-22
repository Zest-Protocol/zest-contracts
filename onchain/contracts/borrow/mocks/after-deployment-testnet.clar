
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

(try! (contract-call? .sbtc mint u1000000000000000 'STNJ4JH5VT4Y8QB1P1DFCA7Z96S2219T30EBV71S))
(try! (contract-call? .ststx mint u1000000000000000 'STNJ4JH5VT4Y8QB1P1DFCA7Z96S2219T30EBV71S))
(try! (contract-call? .diko mint u1000000000000000 'STNJ4JH5VT4Y8QB1P1DFCA7Z96S2219T30EBV71S))
(try! (contract-call? .usda mint u1000000000000000 'STNJ4JH5VT4Y8QB1P1DFCA7Z96S2219T30EBV71S))
(try! (contract-call? .xusd mint u1000000000000000 'STNJ4JH5VT4Y8QB1P1DFCA7Z96S2219T30EBV71S))

(try! (contract-call? .sbtc mint u1000000000000000 'ST2BZJJEMBBP9VMKF2QKY4J3TYVAACC5HVQJQM6HK))
(try! (contract-call? .ststx mint u1000000000000000 'ST2BZJJEMBBP9VMKF2QKY4J3TYVAACC5HVQJQM6HK))
(try! (contract-call? .diko mint u1000000000000000 'ST2BZJJEMBBP9VMKF2QKY4J3TYVAACC5HVQJQM6HK))
(try! (contract-call? .usda mint u1000000000000000 'ST2BZJJEMBBP9VMKF2QKY4J3TYVAACC5HVQJQM6HK))
(try! (contract-call? .xusd mint u1000000000000000 'ST2BZJJEMBBP9VMKF2QKY4J3TYVAACC5HVQJQM6HK))

(try! (contract-call? .sbtc mint u1000000000000000 'ST27RFVAR8M3MA3WCNWY2F2Z8THXED8HBJ34EMGQK))
(try! (contract-call? .ststx mint u1000000000000000 'ST27RFVAR8M3MA3WCNWY2F2Z8THXED8HBJ34EMGQK))
(try! (contract-call? .diko mint u1000000000000000 'ST27RFVAR8M3MA3WCNWY2F2Z8THXED8HBJ34EMGQK))
(try! (contract-call? .usda mint u1000000000000000 'ST27RFVAR8M3MA3WCNWY2F2Z8THXED8HBJ34EMGQK))
(try! (contract-call? .xusd mint u1000000000000000 'ST27RFVAR8M3MA3WCNWY2F2Z8THXED8HBJ34EMGQK))

(try! (contract-call? .sbtc mint u1000000000000000 'ST2X4G2M4X7E81BR89B8YK7EXW27G1NP648Y3D2WP))
(try! (contract-call? .ststx mint u1000000000000000 'ST2X4G2M4X7E81BR89B8YK7EXW27G1NP648Y3D2WP))
(try! (contract-call? .diko mint u1000000000000000 'ST2X4G2M4X7E81BR89B8YK7EXW27G1NP648Y3D2WP))
(try! (contract-call? .usda mint u1000000000000000 'ST2X4G2M4X7E81BR89B8YK7EXW27G1NP648Y3D2WP))
(try! (contract-call? .xusd mint u1000000000000000 'ST2X4G2M4X7E81BR89B8YK7EXW27G1NP648Y3D2WP))

(try! (contract-call? .sbtc mint u1000000000000000 'STAKGVEC80EVZ0QJSYB5GW7VERG4WCE1EJWNTMF8))
(try! (contract-call? .ststx mint u1000000000000000 'STAKGVEC80EVZ0QJSYB5GW7VERG4WCE1EJWNTMF8))
(try! (contract-call? .diko mint u1000000000000000 'STAKGVEC80EVZ0QJSYB5GW7VERG4WCE1EJWNTMF8))
(try! (contract-call? .usda mint u1000000000000000 'STAKGVEC80EVZ0QJSYB5GW7VERG4WCE1EJWNTMF8))
(try! (contract-call? .xusd mint u1000000000000000 'STAKGVEC80EVZ0QJSYB5GW7VERG4WCE1EJWNTMF8))

(try! (contract-call? .sbtc mint u1000000000000000 'ST3GP1GEQ7X2R7FFAMAV234X56DPZPVP2QNKQ5ZXN))
(try! (contract-call? .ststx mint u1000000000000000 'ST3GP1GEQ7X2R7FFAMAV234X56DPZPVP2QNKQ5ZXN))
(try! (contract-call? .diko mint u1000000000000000 'ST3GP1GEQ7X2R7FFAMAV234X56DPZPVP2QNKQ5ZXN))
(try! (contract-call? .usda mint u1000000000000000 'ST3GP1GEQ7X2R7FFAMAV234X56DPZPVP2QNKQ5ZXN))
(try! (contract-call? .xusd mint u1000000000000000 'ST3GP1GEQ7X2R7FFAMAV234X56DPZPVP2QNKQ5ZXN))


(define-constant max-value u340282366920938463463374607431768211455)

(try!
  (contract-call? .pool-borrow
    init
    .lp-ststx
    .ststx
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-borrow
    init
    .lp-wstx
    .wstx
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-borrow
    init
    .lp-sbtc
    .sbtc
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-borrow
    init
    .lp-diko
    .diko
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-borrow
    init
    .lp-usda
    .usda
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

(try!
  (contract-call? .pool-borrow
    init
    .lp-xusd
    .xusd
    u6
    max-value
    max-value
    .oracle
    .interest-rate-strategy-default
  )
)

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
(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .diko
    true
    u60000000
    u90000000
    u5000000
  )
)
(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .usda
    true
    u70000000
    u90000000
    u5000000
  )
)
(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .xusd
    true
    u80000000
    u90000000
    u5000000
  )
)

(contract-call? .pool-borrow set-borrowing-enabled .ststx true)
(contract-call? .pool-borrow set-borrowing-enabled .wstx true)
(contract-call? .pool-borrow set-borrowing-enabled .sbtc true)
(contract-call? .pool-borrow set-borrowing-enabled .diko true)
(contract-call? .pool-borrow set-borrowing-enabled .usda true)
(contract-call? .pool-borrow set-borrowing-enabled .xusd true)

(contract-call? .pool-borrow add-isolated-asset .ststx)

(contract-call? .pool-borrow set-borroweable-isolated .xusd u1000000000000)
(contract-call? .pool-borrow set-borroweable-isolated .usda u1000000000000)

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
