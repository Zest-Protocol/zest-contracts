(define-constant ERR_UNAUTHORIZED (err u7003))

;; asset -> isolation-mode-total-debt
(define-map isolation-mode-total-debt principal uint)
(define-public (set-isolation-mode-total-debt (asset principal) (new-isolation-mode-total-debt uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "set-isolation-mode-total-debt", payload: { key: asset, data: new-isolation-mode-total-debt } })
    (ok (map-set isolation-mode-total-debt asset new-isolation-mode-total-debt))))
(define-public (get-isolation-mode-total-debt (asset principal))
  (ok (map-get? isolation-mode-total-debt asset)))
(define-read-only (get-isolation-mode-total-debt-read (asset principal))
  (map-get? isolation-mode-total-debt asset))

;; -- ownable-trait --
(define-data-var contract-owner principal tx-sender)
(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-reserve-data", payload: owner })
    (ok (var-set contract-owner owner))))

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))
(define-read-only (get-contract-owner-read)
  (var-get contract-owner))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; -- permissions
(define-map approved-contracts principal bool)

(define-public (set-approved-contract (contract principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set approved-contracts contract enabled))))

(define-public (delete-approved-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-delete approved-contracts contract))))

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))
