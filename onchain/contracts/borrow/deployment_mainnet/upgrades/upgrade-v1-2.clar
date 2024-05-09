(define-data-var executed bool false)

(define-constant updated-reserve-asset-1 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token)
(define-constant updated-reserve-asset-2 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc)
(define-constant updated-reserve-asset-3 .wstx)

(define-constant asset-1_v0 .zststx)
(define-constant asset-1_v1-0 .zststx-v1-0)
(define-constant asset-1_v1-2 .zststx-v1-2)

(define-constant asset-2_v0 .zaeusdc)
(define-constant asset-2_v1-0 .zaeusdc-v1-0)
(define-constant asset-2_v1-2 .zaeusdc-v1-2)

(define-constant asset-3_v0 .zwstx)
(define-constant asset-3_v1-0 .zwstx-v1-0)
(define-constant asset-3_v1-2 .zwstx-v1-2)

(define-public (run-update)
  (let (
    (reserve-data-1 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-1)))
    (reserve-data-2 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-2)))
    (reserve-data-3 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-3)))
  )
    (asserts! (not (var-get executed)) (err u10))
    (print reserve-data-1)
    (print reserve-data-2)
    (print reserve-data-3)
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-1
        (merge reserve-data-1 { a-token-address: asset-1_v1-2 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-2
        (merge reserve-data-2 { a-token-address: asset-2_v1-2 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-2
        (merge reserve-data-3 { a-token-address: asset-3_v1-2 })
      )
    )

    ;; ststx upgrade
    (try! (contract-call? .zststx-v1-2 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .zststx-v1-2 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .zststx-v1-2 set-approved-contract .pool-0-reserve true))

    ;; aeusdc upgrade
    (try! (contract-call? .zaeusdc-v1-2 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .zaeusdc-v1-2 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .zaeusdc-v1-2 set-approved-contract .pool-0-reserve true))

    ;; zwstx upgrade
    (try! (contract-call? .zwstx-v1-2 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .zwstx-v1-2 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .zwstx-v1-2 set-approved-contract .pool-0-reserve true))

    (try! (contract-call? .liquidation-manager-v1-1 set-lending-pool .pool-borrow-v1-1))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve set-liquidator .liquidation-manager-v1-1))
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-borrow-v1-1))

    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v1-1 set-approved-contract .borrow-helper-v2-1 true))

    ;; give permission for burn/mint of previous version to new version
    (try! (contract-call? .zststx set-approved-contract new-version-1 true))
    (try! (contract-call? .zststx set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .zststx set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .zststx set-approved-contract .pool-0-reserve false))

    (try! (contract-call? .zaeusdc set-approved-contract new-version-2 true))
    (try! (contract-call? .zaeusdc set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .zaeusdc set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .zaeusdc set-approved-contract .pool-0-reserve false))
    
    (var-set executed true)
    (ok true)
  )
)

(define-read-only (can-execute)
  (begin
    (asserts! (not (var-get executed)) (err u10))
    (ok (not (var-get executed)))
  )
)

(run-update)