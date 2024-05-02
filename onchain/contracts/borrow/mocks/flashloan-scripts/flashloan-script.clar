(use-trait ft .ft-trait.ft-trait)
(impl-trait .flash-loan-trait.flash-loan-trait)

(define-public (execute (asset <ft>) (receiver principal) (amount uint))
  (begin
    ;; (try! (contract-call? .sbtc mint amount tx-sender))
    (try! (contract-call? .sbtc transfer amount tx-sender .pool-vault none))
    (ok true)
  )
)
