(impl-trait .supplier-controller-trait.supplier-controller-trait)

(define-data-var owner principal tx-sender)

;; expect to return amount successfully swapped
(define-public (finalize-swap (txid (buff 32)) (preimage (buff 128)))
  (let
    (
      (swap-resp (as-contract (try! (contract-call? .magic-protocol finalize-swap txid preimage))))
      (swap (try! (contract-call? .magic-protocol get-full-inbound txid)))
      (sats (get sats swap))
      (xbtc (get xbtc swap))
      (fee (- sats xbtc))
      (updated-funds (try! (withdraw-funds fee)))
      (swapper (get swapper-principal swap))
    )
    (try! (as-contract (contract-call? .Wrapped-Bitcoin transfer fee tx-sender swapper none)))
    (ok { sats: sats, swapper: swapper })
  )
)

;; expect to return amount successfully swapped
(define-public (finalize-swap-completed (txid (buff 32)))
  (let
    (
      (swap (try! (contract-call? .magic-protocol get-full-inbound txid)))
      (sats (get sats swap))
      (xbtc (get xbtc swap))
      (fee (- sats xbtc))
      (updated-funds (try! (withdraw-funds fee)))
      (swapper (get swapper-principal swap))
    )
    (try! (as-contract (contract-call? .Wrapped-Bitcoin transfer fee tx-sender swapper none)))
    (ok { sats: sats, fee: fee, swapper: swapper })
  )
)

;; owner methods

(define-public (register-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (funds uint)
  )
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol register-supplier public-key inbound-fee outbound-fee outbound-base-fee inbound-base-fee funds))))

(define-public (add-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol add-funds amount))))

(define-public (remove-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol remove-funds amount))))

(define-public (update-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
  )
  (begin
    (try! (validate-owner))
    (try! (as-contract (contract-call? .magic-protocol update-supplier-fees inbound-fee outbound-fee outbound-base-fee inbound-base-fee)))
    (as-contract (contract-call? .magic-protocol update-supplier-public-key public-key))))

(define-public (transfer-owner (new-owner principal))
  (begin
    (try! (validate-owner))
    (var-set owner new-owner)
    (ok new-owner)))

;; internal
(define-private (withdraw-funds (amount uint))
  (as-contract (contract-call? .magic-protocol remove-funds amount)))

;; helpers

(define-read-only (validate-owner)
  (if (is-eq tx-sender (get-owner))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-read-only (get-owner) (var-get owner))

(define-constant ERR_UNAUTHORIZED (err u2001))
(define-constant ERR_PANIC (err u2002))