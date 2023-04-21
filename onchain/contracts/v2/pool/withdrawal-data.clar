(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

;; -- pool governor
(define-map governors { governor: principal, token-id: uint } bool)

;; @desc adding pool governor
;; @restricted pool
;; @param governor: principal of the governor
;; @param token-id: pool id of the associated governor
;; @returns (response true uint)
(define-public (add-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "add-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-set governors { governor: governor, token-id: token-id } true))))

;; @desc removing pool governor
;; @restricted pool
;; @param governor: principal of the governor
;; @param token-id: pool id of the associated governor
;; @returns (response true uint)
(define-public (remove-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "remove-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-delete governors { governor: governor, token-id: token-id }))))

;; -- pool-delegates
;; principal -> token-id
(define-map delegates principal uint)
;; token-id -> principal
(define-map pool-delegate uint principal)

;; @desc adding pool delegate
;; @restricted pool
;; @param delegate: principal of the delegate
;; @param token-id: pool id of the associated delegate
;; @returns (response true uint)
(define-public (set-pool-delegate (delegate principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (map-set pool-delegate token-id delegate)
    (print { type: "set-pool-delegate", payload: { token-id: token-id, delegate: delegate } })
    (ok (map-set delegates delegate token-id))))

;; -- pool
(define-map pool-data
  uint {
    withdrawal-manager: principal,
    withdrawal-window: uint,})

(define-public (set-withdrawal-data
  (token-id uint)
  (data {
    withdrawal-manager: principal,
    withdrawal-window: uint,
  })
  )
  (begin
    (try! (is-withdrawal-contract))
    (map-set pool-data token-id data)

    (print { type: "set-withdrawal-data", payload: { key: token-id, data: data } })
    (ok true)))

;; -- pool getters

(define-public (get-withdrawal-data (token-id uint))
  (ok (unwrap! (map-get? withdrawal-data token-id) ERR_INVALID_TOKEN_ID)))

(define-read-only (get-withdrawal-data (token-id uint))
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