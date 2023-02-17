(define-trait supplier-controller-trait
  ( (finalize-swap ((buff 32) (buff 128)) (response (tuple (sats uint) (swapper principal)) uint)) ))