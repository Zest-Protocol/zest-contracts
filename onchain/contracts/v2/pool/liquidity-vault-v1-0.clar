(impl-trait .ownable-trait.ownable-trait)
(impl-trait .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)

(define-map assets uint uint)
(define-data-var contract-owner principal tx-sender)

;; -- ownable-trait --
(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-liquidity-vault-v1-0", payload: owner })
    (ok (var-set contract-owner owner))))

;; @desc adds asset into the vault for a pool id
;; @restricted loan, pool, cover-pool, payment-contract
;; @param asset: SIP-010 xBTC
;; @param amount: amount of xbtc added
;; @param token-id: pool associated with the funds added
;; @param sender: principal sending the funds
;; @returns (response true uint)
(define-public (add-asset (asset <ft>) (amount uint) (token-id uint) (sender principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id) )))
    (try! (is-approved-contract contract-caller))
    (try! (contract-call? asset transfer amount sender (as-contract tx-sender) none))
    (print {sender: sender, amount: amount})
    (map-set assets token-id (+ asset-amount amount))

    (print { type: "add-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
    (ok (+ asset-amount amount))))

;; @desc removes asset from the vault for a pool id
;; @restricted loan, pool, cover-pool, payment-contract
;; @param asset: SIP-010 xBTC
;; @param amount: amount of xbtc added
;; @param token-id: pool associated with the funds added
;; @param recipient: principal receiving funds
;; @returns (response true uint)
(define-public (remove-asset (asset <ft>) (amount uint) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id))))
    (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer amount tx-sender recipient none)))
    (if (>= amount asset-amount)
      (begin
        (map-set assets token-id u0)
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
        (ok u0))
      (begin
        (map-set assets token-id (- asset-amount amount))
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount:  amount } } })
        (ok (- asset-amount amount))))))

;; @desc withdraws total asset from the vault for a pool id
;; @restricted loan, pool, cover-pool, payment-contract
;; @param asset: SIP-010 xBTC
;; @param token-id: pool associated with the funds added
;; @param recipient: principal receiving funds
;; @returns (response true uint)
(define-public (draw (asset <ft>) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id))))
    (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer asset-amount tx-sender recipient none)))
    (map-delete assets token-id)

    (print { type: "draw-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: asset-amount }} })
    (ok asset-amount)))

;; @desc transfers funds from the vault to recipient
;; @restricted loan, pool, cover-pool, payment-contract
;; @param amount: amount of funds
;; @param recipient: recipient of the funds
;; @param ft: SIP-010 token contract
;; @returns (response true uint)
(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "transfer-liquidity-vault-v1-0", payload: { amount: amount, recipient: recipient, asset: ft } })
    (as-contract (contract-call? ft transfer amount tx-sender recipient none))))

(define-public (get-asset (token-id uint))
  (ok (map-get? assets token-id)))

;; --- approved contracts

(define-map approved-contracts principal bool)

(define-read-only (is-approved-contract (contract principal))
  (if (or
    (contract-call? .globals is-pool-contract contract)
    (contract-call? .globals is-loan-contract contract)
    (contract-call? .globals is-cover-pool-contract contract)
    (contract-call? .globals is-payment contract))
    (ok true)
    ERR_UNAUTHORIZED))

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_INVALID_TOKEN_ID (err u7001))
