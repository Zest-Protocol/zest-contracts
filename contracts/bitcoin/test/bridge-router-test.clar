(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait payment .payment-trait.payment-trait)

(impl-trait .ownable-trait.ownable-trait)

(define-data-var last-deposit uint u0)
(define-data-var last-withdrawal uint u0)

(define-public (deposit-to-pool (lp-token <lp-token>) (zp-token <dt>) (lv <lv>))
  (let (
    (last-id (var-get last-deposit))
    (last-payment (unwrap! (get-deposit last-id) ERR_INVALID_KEY_VAL))
    (amount (get amount last-payment))
    (height (get height last-payment))
  )
    (try! (transfer amount .pool-v1-0))
    (try! (contract-call? .pool-v1-0 deposit lp-token zp-token amount height lv))
    (ok (var-set last-deposit (+ u1 last-id)))
  )
)

(define-public (withdraw-from-pool (lp-token <lp-token>) (lv <lv>) (amount uint))
  (begin
    (try! (transfer amount .pool-v1-0))
    (contract-call? .pool-v1-0 withdraw lp-token lv amount .xbtc)
  )
)

(define-private (transfer (amount uint) (recipient principal))
  (as-contract (contract-call? .xbtc transfer amount tx-sender recipient none))
)

(define-public (drawdown (loan-id uint) (height uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>))
  (begin
    (contract-call? .loan-v1-0 drawdown loan-id height coll-token coll-vault fv)
  )
)

(define-public (verify-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (sp-token <lp-token>) (amount uint))
  (begin
    (try! (transfer amount .loan-v1-0))
    (contract-call? .loan-v1-0 make-payment loan-id height payment lp-token sp-token amount)
  )
)

(define-public (verify-full-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (sp-token <lp-token>) (amount uint))
  (begin
    (try! (transfer amount .loan-v1-0))
    (contract-call? .loan-v1-0 make-full-payment loan-id height payment lp-token sp-token amount)
  )
)

;; used as dummy values
(define-map deposits uint { amount: uint, height: uint })
(define-map withdrawals uint { amount: uint, height: uint })

(define-read-only (get-deposit (id uint))
  (map-get? deposits id)
)

(define-public (add-deposit (deposit-id uint) (amount uint) (burnchain-height uint))
  (ok (map-insert deposits deposit-id { amount: amount, height: burnchain-height }))
)

(define-public (add-withdrawal (withdrawal-id uint) (amount uint) (burnchain-height uint))
  (ok (map-insert withdrawals withdrawal-id { amount: amount, height: burnchain-height }))
)


(define-data-var loan-contract principal tx-sender)

(define-public (set-loan-contract (loan principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set loan-contract loan))
  )
)

(define-public (transfer-funds (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller (var-get loan-contract)) ERR_UNAUTHORIZED)
    (as-contract (contract-call? .xbtc transfer amount tx-sender recipient none))
  )
)

;; --- ownable trait

(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-constant ERR_INVALID_KEY_VAL (err u3000))
(define-constant ERR_UNAUTHORIZED (err u300))
