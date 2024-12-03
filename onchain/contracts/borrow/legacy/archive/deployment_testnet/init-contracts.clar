;; (try! (contract-call? .sbtc mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))
;; (try! (contract-call? .ststx mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))

;; (try! (contract-call? .sbtc mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))
;; (try! (contract-call? .ststx mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))

(define-data-var executed bool false)
(define-constant deployer tx-sender)

(define-public (run-update)
  (begin
    (asserts! (not (var-get executed)) (err u10))
    (asserts! (is-eq deployer tx-sender) (err u11))


    ;; START pool-reserve-data
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v1-2 true))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-borrow-v1-2 true))

    ;; START pool-0-reserve-v1-2
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve-v1-2 set-liquidator .liquidation-manager-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-lending-pool .pool-borrow-v1-2))

    ;; drop old pool-0-reserve permissions
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-0-reserve-v1-2))
    (try! (contract-call? .pool-0-reserve set-liquidator .pool-0-reserve-v1-2))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow false))

    ;; update pool-0-reserve-v1-2 permissions
    (try! (contract-call? .pool-0-reserve-v1-2 set-liquidator .liquidation-manager-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-lending-pool .pool-borrow-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-approved-contract .pool-borrow-v1-2 true))

    ;; START liquidation-manager-v1-2
    ;; set lending-pool in liquidation-manager
    (try! (contract-call? .liquidation-manager-v1-2 set-lending-pool .pool-borrow-v1-2))

    ;; START pool-borrow-v1-2
    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v1-2 set-approved-contract .borrow-helper-v1-3 true))

    (var-set executed true)
    (ok true)
  )
)

(define-public (disable)
  (begin
    (asserts! (is-eq deployer tx-sender) (err u11))
    (ok (var-set executed true))
  )
)

(define-read-only (can-execute)
  (begin
    (asserts! (not (var-get executed)) (err u10))
    (ok (not (var-get executed)))
  )
)
