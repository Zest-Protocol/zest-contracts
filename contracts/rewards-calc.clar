;; used by distribution funds contracts to calculate the amount of zest that has to be minted as rewards per LPer or staker

(impl-trait .rewards-calc-trait.rewards-calc-trait)

(impl-trait .ownable-trait.ownable-trait)
(impl-trait .extension-trait.extension-trait)


(define-constant CYCLE_LENGTH (* u14 u144))
(define-constant PC_1 u100)
(define-constant BP u10000)
;; cycle -> multiplier BP
(define-map cycle-multipliers uint uint)

;; mints rewards based on number of cycles and base amount
(define-public (mint-rewards (recipient principal) (cycles uint) (base-amount uint))
  (let (
    (multiplier (get-multiplier cycles))
    (to-mint (/ (* base-amount multiplier) BP))
  )
    (print { multiplier: multiplier })
    (try! (is-approved-contract contract-caller))
    (asserts! (> to-mint u0) ERR_NOT_ENOUGH_REWARDS)
    (try! (contract-call? .zge000-governance-token edg-mint to-mint recipient))
    (ok to-mint)
  )
)

;; TODO: add global base rewards
;; mints rewards based on number of cycles and base amount
(define-public (mint-rewards-base (recipient principal) (base-amount uint))
  (let (
    (to-mint (/ (* base-amount PC_1) BP))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (> to-mint u0) ERR_NOT_ENOUGH_REWARDS)
    (try! (contract-call? .zge000-governance-token edg-mint to-mint recipient))
    (ok to-mint)
  )
)

(define-read-only (get-multiplier (cycles uint))
  (/ (to-uint (polynomial (to-int cycles))) BP)
)

;; 0.01x^3 - 0.01x^2 + 2x + 100
(define-constant A 100)
(define-constant B 100)
(define-constant C 20000)
(define-constant Y 1000000)
(define-read-only (polynomial (x int))
  (+ (- (* A (pow x 3)) (* B (pow x 2))) (* C x) Y)
)


(define-public (set-multiplier (cycle uint) (multiplier uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (map-set cycle-multipliers cycle multiplier))
  )
)

;; -- ownable-trait --

;; (define-data-var contract-owner principal .executor-dao)
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

;; (define-public (add-contract (contract principal))
  ;; (begin
		;; (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
		;; (ok (map-set approved-contracts contract true))
	;; )
;; )

;; (define-public (remove-contract (contract principal))
  ;; (begin
		;; (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
		;; (ok (map-set approved-contracts contract false))
	;; )
;; )

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

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_CYCLE (err u6000))
(define-constant ERR_NOT_ENOUGH_REWARDS (err u6001))

(map-set approved-contracts .pool-v1-0 true)
(map-set approved-contracts .cover-pool-v1-0 true)
