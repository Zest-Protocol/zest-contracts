
(define-map pairs-data-map
  {
    token-x: principal,
    token-y: principal,
  }
  {
    balance-x: uint,
    balance-y: uint
  }
)

(define-read-only (get-pair-details (contract-x principal) (contract-y principal))
  (ok (unwrap-panic (map-get? pairs-data-map { token-x: contract-x,  token-y: contract-y })))
)

(define-public (set-pair-details
  (contract-x principal)
  (contract-y principal)
  (balance-x uint)
  (balance-y uint)
  )
  (ok (map-set pairs-data-map
    {
      token-x: contract-x,
      token-y: contract-y
    }
    {
      balance-x: balance-x,
      balance-y: balance-y
    }))
)
