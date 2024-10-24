(define-constant ERR_UNAUTHORIZED (err u7000))

;; user's e-mode
(define-map user-e-mode principal (buff 1))
(define-public (set-user-e-mode (asset principal) (flag (buff 1)))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "set-user-e-mode", payload: { key: asset, data: { flag: flag } } })
    (ok (map-set user-e-mode asset flag))))
(define-public (get-user-e-mode (asset principal))
  (ok (map-get? user-e-mode asset)))
(define-read-only (get-user-e-mode-read (asset principal))
  (map-get? user-e-mode asset))

;; is e-mode type enabled
(define-map e-mode-types (buff 1) bool)
(define-public (set-asset-e-mode-types (flag (buff 1)) (enabled bool))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "set-e-mode-types", payload: { key: flag, data: { enabled: enabled } } })
    (ok (map-set e-mode-types flag enabled))))
(define-public (get-e-mode-types (flag (buff 1)))
  (ok (map-get? e-mode-types flag)))
(define-read-only (get-e-mode-types-read (flag (buff 1)))
  (map-get? e-mode-types flag))

;; asset -> e-mode type
(define-map asset-e-mode-type principal (buff 1))
(define-public (set-asset-e-mode-type (asset principal) (flag (buff 1)))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "set-asset-e-mode-type", payload: { key: asset, data: { flag: flag } } })
    (ok (map-set asset-e-mode-type asset flag))))
(define-public (get-asset-e-mode-type (asset principal))
  (ok (map-get? asset-e-mode-type asset)))
(define-read-only (get-asset-e-mode-type-read (asset principal))
  (map-get? asset-e-mode-type asset))

;; e-mode type -> configuration
(define-map type-e-mode-config (buff 1) { ltv: uint, liquidation-threshold: uint })
(define-public (set-type-e-mode-config
	(type (buff 1))
	(config { ltv: uint, liquidation-threshold: uint }))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "set-type-e-mode-config", payload: { key: type, data: { config: config } } })
    (ok (map-set type-e-mode-config type config))))
(define-public (get-type-e-mode-config (type (buff 1)))
  (ok (map-get? type-e-mode-config type)))
(define-read-only (get-type-e-mode-config-read (type (buff 1)))
  (map-get? type-e-mode-config type))

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

(map-set approved-contracts .pool-borrow-v1-2 true)
