(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    (try! (contract-call? .globals add-admin .executor-dao))
    (ok true)
  )
)
