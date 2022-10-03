(impl-trait .loan-strategy-trait.loan-strategy-trait)
(use-trait asset .asset-trait.asset-trait)
(use-trait oracle .oracle-trait.oracle-trait)

(define-data-var parameters
    { 
        rate-num: uint,
        rate-den: uint,
        debt-coll-ratio: uint
    }
    { 
        rate-num: u57078, ;; 0.000057078 per block
        rate-den: (pow u10 u10),
        debt-coll-ratio: u150
    }
)

(define-public (get-rate)
    (ok (get rate-num (var-get parameters)))
)

(define-public (set-parameters)
    (ok true)
)

(define-public (get-ratio)
    (ok (get debt-coll-ratio (var-get parameters)))
)

(define-public (get-borrowing-potential (oracle <oracle>) (collateral <asset>)  (asset <asset>) (amount uint))
    (let (
        (collateral-data (try! (contract-call? oracle get-asset (contract-of collateral))))
        (asset-data (try! (contract-call? oracle get-asset (contract-of asset))))
    )
        (ok
            (/ (* (/ (* amount 
                        (get price collateral-data))
                        (get price asset-data))
                        (get debt-coll-ratio (var-get parameters)))
                        u100)
        )
    )
)

;; yield at a fixed rate (no compounding)
;; u100 could change if we use rates with more precision.
(define-public (get-yield (amount uint) (block-delta uint))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; perform division last
    (ok (/
            (* amount (get rate-num (var-get parameters)) block-delta)
            (get rate-den (var-get parameters)))
    )
)
