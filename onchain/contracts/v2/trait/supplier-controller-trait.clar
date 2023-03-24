(define-trait supplier-controller-trait (
  (finalize-swap ((buff 32) (buff 128)) (response (tuple (sats uint) (swapper principal)) uint))
  (finalize-swap-completed ((buff 32)) (response (tuple (sats uint) (fee uint) (swapper principal)) uint))
))