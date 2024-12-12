(define-data-var executed bool false)
(define-data-var approved bool false)
(define-constant deployer tx-sender)

(define-constant new-contract-owner 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)

(define-public (run-update)
  (begin
    (asserts! (not (var-get executed)) (err u10))
    (asserts! (var-get approved) (err u11))

    (contract-call? 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.pool-reserve-data-2 set-contract-owner new-contract-owner)

    (var-set executed true)
    (ok true)
  )
)

(define-public (approve-ownership)
  (begin
    (asserts! (not (var-get approved)) (err u12))
    (asserts! (is-eq tx-sender new-contract-owner) (err u13))
    (asserts! (is-standard new-contract-owner) (err u14))

    (var-set approved true)
    (ok true)
  )
)

(define-public (disable)
  (begin
    (asserts! (is-eq deployer tx-sender) (err u15))
    (ok (var-set executed true))
  )
)

(define-read-only (can-execute)
  (begin
    (asserts! (not (var-get executed)) (err u16))
    (ok (not (var-get executed)))
  )
)