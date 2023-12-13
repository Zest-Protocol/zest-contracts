;; Holds funds and is controlled by DAO

(impl-trait .ownable-trait.ownable-trait)
(impl-trait .vault-trait.vault-trait)

(use-trait ft .ft-trait.ft-trait)

(define-data-var contract-owner principal tx-sender)

;; ;; -- ownable-trait --
(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))))

(define-public (transfer (amount uint) (recipient principal) (f-t <ft>))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (as-contract (contract-call? f-t transfer amount tx-sender recipient none))))

(define-read-only (is-approved-contract (contract principal))
  (if (or
    (contract-call? .globals is-pool-contract contract)
    (contract-call? .globals is-loan-contract contract)
    (contract-call? .globals is-cover-pool-contract contract))
    (ok true)
    ERR_UNAUTHORIZED))

;; ERROR START 17000

(define-constant ERR_UNAUTHORIZED (err u17000))
