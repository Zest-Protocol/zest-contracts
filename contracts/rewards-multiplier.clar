
;; cycle -> multiplier BP
(define-map cycle-multipliers uint uint)

(define-public (mint-rewards (staker principal) (base-amount uint) (cycles uint))
  (let (
    (multiplier (unwrap! (map-get? cycle-multipliers cycles) ERR_INVALID_VALUES))
  )
    (try! (is-approved-contract contract-caller))
    (try! (contract-call? .zge000-governance-token edg-mint (/ (* base-amount multiplier) u10000) tx-sender))
    (ok true)
  )
)

(define-public (get-multiplier (cycle uint))
  (ok (unwrap! (map-get? cycle-multipliers cycle) ERR_INVALID_VALUES))
)


(define-public (set-multiplier (cycle uint) (multiplier uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (map-set cycle-multipliers cycle multiplier))
  )
)

;; -- ownable-trait --

(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
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

;; --- approved

(define-map approved-contracts principal bool)

(define-public (add-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public (remove-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract false))
	)
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_INVALID_VALUES (err u301))