
(define-constant aeusdc-supply-cap u200000000000)
(define-constant aeusdc-borrow-cap u200000000000)

(define-data-var executed bool false)

(define-public (run-update)
  (let (
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .diko)))
  )
    (asserts! (not (var-get executed)) (err u10))
    (print reserve-data)
    (try!
      (contract-call? .pool-borrow
        set-reserve
        .diko
        (merge reserve-data { supply-cap: aeusdc-supply-cap, borrow-cap: aeusdc-borrow-cap })
      )
    )
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

(define-read-only (get-update-values)
  (let (
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .diko)))
  )
    (merge reserve-data { supply-cap: aeusdc-supply-cap, borrow-cap: aeusdc-borrow-cap })
  )
)
