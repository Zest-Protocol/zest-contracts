(define-data-var executed bool false)
(define-constant asset 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token)

(define-public (run-update)
  (begin
    (asserts! (not (var-get executed)) (err u10))

    (try! (contract-call? .pool-borrow-v1-1 set-borrowing-enabled asset true))
    (try! (contract-call? .pool-borrow-v1-1 set-borroweable-isolated asset))

    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate asset u0))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 asset u7000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 asset u300000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate asset u45000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent asset u5000000))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc asset u0))
    (try! (contract-call? .pool-reserve-data set-reserve-factor asset u10000000))
    
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