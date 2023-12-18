;; (impl-trait .ownable-trait.ownable-trait)
(impl-trait .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)

(define-constant a-token .lp-token-0)
;; (define-constant default-interest-rate-strategy-address .interest-rate-strategy-default)

(define-constant one-8 u100000000)

(define-map assets uint uint)
(define-data-var contract-owner principal tx-sender)

(define-data-var reserve-state
  (tuple
    (last-liquidity-cumulative-index uint)
    (current-liquidity-rate uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-stable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
    (last-variable-borrow-cumulative-index uint)
    (base-ltvas-collateral uint)
    (liquidation-threshold uint)
    (liquidation-bonus uint)
    (decimals uint)
    (a-token-address principal)
    (interest-rate-strategy-address principal)
    (last-update-timestamp uint)
    (borrowing-enabled bool)
    (usage-as-collateral-enabled bool)
    (is-stable-borrow-rate-enabled bool)
    (is-active bool)
    (is-freezed bool)
  )
  {
    last-liquidity-cumulative-index: u0,
    current-liquidity-rate: u0,
    total-borrows-stable: u0,
    total-borrows-variable: u0,
    current-variable-borrow-rate: u0,
    current-stable-borrow-rate: u0,
    current-average-stable-borrow-rate: u0,
    last-variable-borrow-cumulative-index: u0,
    base-ltvas-collateral: u0,
    liquidation-threshold: u0,
    liquidation-bonus: u0,
    decimals: u0,
    a-token-address: tx-sender,
    interest-rate-strategy-address: tx-sender,
    last-update-timestamp: u0,
    borrowing-enabled: false,
    usage-as-collateral-enabled: false,
    is-stable-borrow-rate-enabled: false,
    is-active: false,
    is-freezed: false
  }
)

(define-public (init
  (a-token-address principal)
  (decimals uint)
  (interest-rate-strategy-address principal)
)
  (ok
    (var-set reserve-state
      (merge
        (var-get reserve-state)
        {
          last-liquidity-cumulative-index: one-8,
          last-variable-borrow-cumulative-index: one-8,
          a-token-address: a-token-address,
          decimals: decimals,
          interest-rate-strategy-address: interest-rate-strategy-address,
          is-active: true,
          is-freezed: false
        }
      )
    )
  )
)

;; -- ownable-trait --
;; (define-public (get-contract-owner)
;;   (ok (var-get contract-owner)))

;; (define-read-only (is-contract-owner (caller principal))
;;   (is-eq caller (var-get contract-owner)))

;; (define-public (set-contract-owner (owner principal))
;;   (begin
;;     (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
;;     (print { type: "set-contract-owner-liquidity-vault-v1-0", payload: owner })
;;     (ok (var-set contract-owner owner))))

(define-public (add-asset (asset <ft>) (amount uint) (token-id uint) (sender principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id) )))
    ;; (try! (is-approved-contract contract-caller))
    (try! (contract-call? asset transfer amount sender (as-contract tx-sender) none))
    (print {sender: sender, amount: amount})
    (map-set assets token-id (+ asset-amount amount))

    (print { type: "add-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
    (ok (+ asset-amount amount))
  )
)

(define-public (remove-asset (asset <ft>) (amount uint) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id)))
    )
    ;; (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer amount tx-sender recipient none)))
    (if (>= amount asset-amount)
      (begin
        (map-set assets token-id u0)
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
        (ok u0)
      )
      (begin
        (map-set assets token-id (- asset-amount amount))
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount:  amount } } })
        (ok (- asset-amount amount))
      )
    )
  )
)

(define-public (draw (asset <ft>) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id)))
    )
    ;; (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer asset-amount tx-sender recipient none)))
    (map-delete assets token-id)

    (print { type: "draw-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: asset-amount }} })
    (ok asset-amount)
  )
)

(define-public (transfer (amount uint) (recipient principal) (f-t <ft>))
  (begin
    ;; (try! (is-approved-contract contract-caller))
    (print { type: "transfer-liquidity-vault-v1-0", payload: { amount: amount, recipient: recipient, asset: f-t } })
    (as-contract (contract-call? f-t transfer amount tx-sender recipient none))
  )
)

(define-public (get-asset (token-id uint))
  (ok (map-get? assets token-id)))

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_INVALID_TOKEN_ID (err u7001))
