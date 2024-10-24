(use-trait ft .ft-trait.ft-trait)
(impl-trait .flash-loan-trait.flash-loan-trait)

;; enough funds for amount-fee
(define-public (execute (asset <ft>) (receiver principal) (amount uint))
  (let (
    (amount-fee (/ (* amount u35) u10000))
    (protocol-fee (/ (* amount-fee u3000) u10000))
  )
    (try! (contract-call? .sbtc mint amount-fee tx-sender))
    (ok true)
  )
)
