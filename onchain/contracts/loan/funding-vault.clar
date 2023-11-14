(use-trait ft .ft-trait.ft-trait)
(impl-trait .ownable-trait.ownable-trait)
(impl-trait .funding-vault-trait.funding-vault-trait)

(define-map vault-funds uint uint)

(define-public (get-asset (loan-id uint))
  (ok (unwrap! (map-get? vault-funds loan-id) ERR_INVALID_LOAN_ID)))

;; @desc adds asset into the vault for a loan id
;; @restricted loan-contract, pool-contract
;; @param xbtc: SIP-010 xBTC
;; @param amount: amount of xbtc added
;; @param loan-id: loan associated with the funds added
;; @param sender: principal sending the funds
;; @returns (response uint uint)
(define-public (add-asset (xbtc <ft>) (amount uint) (loan-id uint) (sender principal))
  (let (
    (funds (default-to u0 (map-get? vault-funds loan-id))))
    (try! (is-approved-contract contract-caller))
    (try! (contract-call? xbtc transfer amount sender (as-contract tx-sender) none))
    (map-set vault-funds loan-id (+ funds amount))

    (print { type: "add-asset-funding-vault", payload: { key: loan-id,  data: { amount: amount }} })
    (ok (+ funds amount))))

;; @desc removes asset from the vault for a loan id
;; @restricted loan-contract, pool-contract
;; @param xbtc: SIP-010 xBTC
;; @param amount: amount of xbtc removed
;; @param loan-id: loan associated with the funds removed
;; @param recipient: principal receiving funds
;; @returns (response uint uint)
(define-public (remove-asset (xbtc <ft>) (amount uint) (loan-id uint) (recipient principal))
  (let (
    (asset (default-to u0 (map-get? vault-funds loan-id))))
    (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? xbtc transfer amount tx-sender recipient none)))
    (map-set vault-funds loan-id (- asset amount))

    (print { type: "remove-asset-funding-vault", payload: { key: loan-id, data: { amount: amount }} })
    (ok (- asset amount))))

;; @desc removes the total asset from the vault for a loan id
;; @restricted loan-contract, pool-contract
;; @param xbtc: SIP-010 xBTC
;; @param loan-id: loan associated with the funds removed
;; @param recipient: principal receiving funds
;; @returns (response uint uint)
(define-public (draw (xbtc <ft>) (loan-id uint) (recipient principal))
  (let (
    (asset (default-to u0 (map-get? vault-funds loan-id))))
    (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? xbtc transfer asset tx-sender recipient none)))
    (map-delete vault-funds loan-id)

    (print { type: "draw-funding-vault", payload: { key: loan-id, data: { amount: asset }} })
    (ok asset)))

;; @desc transfers funds from the vault to recipient
;; @restricted contract-owner
;; @param amount: amount of funds
;; @param recipient: recipient of the funds
;; @param ft: SIP-010 token contract
;; @returns (response true uint)
(define-public (transfer (amount uint) (recipient principal) (f-t <ft>))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "transfer-funding-vault", payload: { amount: amount, recipient: recipient, asset: f-t } })
    (as-contract (contract-call? f-t transfer amount tx-sender recipient none))))

(define-data-var contract-owner principal tx-sender)

;; -- ownable-trait --
(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-funding-vault", payload: owner })
    (ok (var-set contract-owner owner))))

;; --- approved
(define-map approved-contracts principal bool)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))

;; ERROR START 3000
(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_INVALID_LOAN_ID (err u3001))

(map-set approved-contracts .loan-v1-0 true)
(map-set approved-contracts .pool-v1-0 true)