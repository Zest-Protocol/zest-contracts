(use-trait ft .ft-trait.ft-trait)


(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 <ft>))
)
  (let (
    (reserves (contract-call? .pool-0-reserve get-reserves))
  )
    (try! (fold aggregate-user-data assets (ok u0)))
    (ok u0)
  )
)

(define-private (aggregate-user-data (asset <ft>) (total (response uint uint)))
  (begin
    (asserts! true (err u1))

    (ok u0)
  )
)

(define-public (get-user-basic-reserve-data
  (asset <ft>)
  (user principal)
  )
  (begin
    (ok u0)
  )
)