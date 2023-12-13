(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
;; (use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
;; (use-trait dt .distribution-token-trait.distribution-token-trait)
;; (use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

;; (define-constant INIT 0x00)

;; -- withdrawal
(define-map withdrawal-data uint { withdrawal-manager: principal, withdrawal-window: uint, updated-at: uint })
(define-map withdrawal-data-future uint { withdrawal-manager: principal, withdrawal-window: uint })

(define-public (set-withdrawal-data
  (token-id uint)
  (data { withdrawal-manager: principal, withdrawal-window: uint, updated-at: uint }))
  (begin
    (try! (is-withdrawal-contract))
    (map-set withdrawal-data token-id data)

    (print { type: "set-withdrawal-data", payload: { key: token-id, data: data } })
    (ok true)))

;; -- withdrawal getters
(define-public (get-withdrawal-data (token-id uint))
  (ok (unwrap! (map-get? withdrawal-data token-id) ERR_INVALID_TOKEN_ID)))

(define-read-only (get-withdrawal-data-read (token-id uint))
  (unwrap-panic (map-get? withdrawal-data token-id)))

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-withdrawal-data-owner", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (is-withdrawal-contract)
  (if (contract-call? .globals is-withdrawal-contract contract-caller) (ok true) ERR_UNAUTHORIZED))

;; ERROR START 130000
(define-constant ERR_UNAUTHORIZED (err u130000))
(define-constant ERR_POOL_ALREADY_EXISTS (err u130001))
(define-constant ERR_INVALID_TOKEN_ID (err u130002))
(define-constant ERR_INVALID_SENDER (err u130003))
(define-constant ERR_LOAN_DOES_NOT_EXIST (err u130004))