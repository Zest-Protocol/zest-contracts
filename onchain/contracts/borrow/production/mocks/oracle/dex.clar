
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
  (ok (unwrap! (map-get? pairs-data-map { token-x: contract-x,  token-y: contract-y }) (err u10)))
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

(define-read-only (get-y-for-x (contract-x principal) (contract-y principal) (dx uint))
  (let (
    (pair (unwrap-panic (map-get? pairs-data-map { token-x: contract-x, token-y: contract-y })))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 dx) u1000))
    (dy (/ (* balance-x dx-with-fees) (+ balance-y dx-with-fees)))
    )
    dy
  )
)

(define-read-only (get-x-for-y (contract-x principal) (contract-y principal) (dy uint))
  (let (
    (pair (unwrap-panic (map-get? pairs-data-map { token-x: contract-x, token-y: contract-y })))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 dy) u1000))
    (dx (/ (* balance-y dx-with-fees) (+ balance-x dx-with-fees)))
    )
    dx
  )
)

(define-public (swap-x-for-y
  (contract-x principal)
  (contract-y principal)
  (dx uint)
)
  (let (
    (pair (unwrap-panic (map-get? pairs-data-map { token-x: contract-x, token-y: contract-y })))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 dx) u1000)) ;; 0.3% fee for LPs
    (dy (/ (* balance-y dx-with-fees) (+ balance-x dx-with-fees)))
  )
    (map-set 
      pairs-data-map
      { token-x: contract-x, token-y: contract-y } {
      balance-x: (+ balance-x dx),
      balance-y: (- balance-y dy),
    })
    (ok (list dx dy))
  )
)

(define-public (swap-y-for-x
  (contract-x principal)
  (contract-y principal)
  (dy uint)
)
  (let (
    (pair (unwrap-panic (map-get? pairs-data-map { token-x: contract-x, token-y: contract-y })))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dy-with-fees (/ (* u997 dy) u1000)) ;; 0.3% fee for LPs
    (dx (/ (* balance-x dy-with-fees) (+ balance-y dy-with-fees)))
  )
    (map-set 
      pairs-data-map
      { token-x: contract-x, token-y: contract-y } {
      balance-x: (+ balance-x dx),
      balance-y: (- balance-y dy),
    })
    (ok (list dx dy))
  )
)
