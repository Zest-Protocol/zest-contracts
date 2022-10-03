(define-data-var owner principal tx-sender)

(define-constant ERR_UNAUTHORIZED (err u201))
(define-constant ERR_PANIC (err u202))
(define-constant ERR_TX_ESCROWED (err u203))
(define-constant ERR_TX_DOES_NOT_EXIST (err u203))

;; tx-hash -> tx-height
(define-map escrowed-tx (buff 32) uint)

(define-public (escrow-swap
    (block { header: (buff 80), height: uint })
    (prev-blocks (list 10 (buff 80)))
    (tx (buff 1024))
    (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
    (output-index uint)
    (sender (buff 33))
    (recipient (buff 33))
    (expiration-buff (buff 4))
    (hash (buff 32))
    (swapper-buff (buff 4))
    (supplier-id uint)
  )
  (begin
    (asserts! (map-insert escrowed-tx hash (get height block)) ERR_TX_ESCROWED)
    (try! (contract-call? .bridge escrow-swap block prev-blocks tx proof output-index sender recipient expiration-buff hash swapper-buff supplier-id))
    (ok true)
  )
)

(define-public (confirm-deposit (txid (buff 32)) (preimage (buff 128)) (amount uint))
    (let (
        (swap (try! (finalize-swap txid preimage)))
        (fee (get fee swap))
        (xbtc (get xbtc swap))
        (hash (get hash swap))
        (tx-height (unwrap! (map-get? escrowed-tx hash) ERR_TX_DOES_NOT_EXIST))
        (swapper (get swapper-principal swap))
        (full-amount (try! (transfer-full xbtc fee swapper .liquidity-vault)))
        )
        (try! (contract-call? .pool deposit full-amount))
        ;; (try! (contract-call? .pool deposit full-amount tx-height))
        (ok full-amount)
    )
)


(define-private (finalize-swap (txid (buff 32)) (preimage (buff 128)))
  (let
    (
      (swap-resp (try! (contract-call? .bridge finalize-swap txid preimage)))
      (swap (try! (contract-call? .bridge get-full-inbound txid)))
      (sats (get sats swap))
      (xbtc (get xbtc swap))
      (fee (- sats xbtc))
      (updated-funds (try! (withdraw-funds fee)))
    )

    ;; refunding fees:
    ;; (try! (as-contract (contract-call? .xbtc transfer fee tx-sender swapper none)))
    (ok (merge swap { fee: fee }))
  )
)

(define-private (transfer-full (swapped-amount uint) (fee uint) (sender principal) (recipient principal))
    (begin
        (try! (as-contract (contract-call? .xbtc transfer swapped-amount sender recipient none)))
        (try! (as-contract (contract-call? .xbtc transfer fee (as-contract tx-sender) recipient none)))
        (ok (+ swapped-amount fee))
    )
)

;; owner methods

(define-public (register-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18))
    (funds uint)
  )
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge register-supplier public-key inbound-fee outbound-fee outbound-base-fee inbound-base-fee name funds))
  )
)

(define-public (add-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge add-funds amount))
  )
)

(define-public (remove-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge remove-funds amount))
  )
)

(define-public (update-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18))
  )
  (begin
    (try! (validate-owner))
    (try! (as-contract (contract-call? .bridge update-supplier-fees inbound-fee outbound-fee outbound-base-fee inbound-base-fee)))
    (try! (as-contract (contract-call? .bridge update-supplier-public-key public-key)))
    (as-contract (contract-call? .bridge update-supplier-name name))
  )
)

(define-public (transfer-owner (new-owner principal))
  (begin
    (try! (validate-owner))
    (var-set owner new-owner)
    (ok new-owner)
  )
)

;; internal

(define-private (withdraw-funds (amount uint))
  (as-contract (contract-call? .bridge remove-funds amount))
)

;; helpers

(define-read-only (validate-owner)
  (if (is-eq contract-caller (get-owner))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-read-only (get-owner) (var-get owner))