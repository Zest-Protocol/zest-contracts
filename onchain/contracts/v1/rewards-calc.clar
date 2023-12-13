;; used by distribution funds contracts to calculate the amount of zest that has to be minted as rewards per LPer or cover-provider
(impl-trait .rewards-calc-trait.rewards-calc-trait)

(impl-trait .ownable-trait.ownable-trait)
(impl-trait .extension-trait.extension-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

;; cycle -> multiplier BP
(define-map cycle-multipliers uint uint)

(define-data-var base-rewards uint u100)

(define-constant BP u10000)
(define-constant ONE_PRC u100)

;; @desc mint rewards based on the amount of cycles and the base-amount
;; @restricted pool
;; @param recipient: recipient of zest rewards
;; @param cycles: number of cycles commited to by the recipient
;; @param base-amount: base amount used to calculate rewards
;; @returns (respose uint uint)
(define-public (mint-rewards (recipient principal) (cycles uint) (base-amount uint))
  (let (
    (multiplier (get-multiplier cycles))
    (to-mint (/ (* base-amount multiplier) BP)))
    (try! (is-approved-contract contract-caller))
    (asserts! (> to-mint u0) ERR_NOT_ENOUGH_REWARDS)
    (try! (contract-call? .zge000-governance-token edg-mint to-mint recipient))
    (ok to-mint)))

;; @desc mints rewards using only the base-rewards factor
;; @restricted pool
;; @param recipient: recipient of zest rewards
;; @param base-amount: base amount used to calculate rewards
;; @returns (respose uint uint)
(define-public (mint-rewards-base (recipient principal) (base-amount uint))
  (let (
    (to-mint (/ (* base-amount (var-get base-rewards)) BP)))
    (try! (is-approved-contract contract-caller))
    (asserts! (> to-mint u0) ERR_NOT_ENOUGH_REWARDS)
    (try! (contract-call? .zge000-governance-token edg-mint to-mint recipient))
    (ok to-mint)))

(define-read-only (get-multiplier (cycles uint))
  (/ (to-uint (polynomial (to-int cycles))) BP))

(define-read-only (get-mint-rewards (recipient principal) (cycles uint) (base-amount uint))
  (let (
    (multiplier (get-multiplier cycles))
    (to-mint (/ (* base-amount multiplier) BP)))
    to-mint))

(define-read-only (get-mint-rewards-base (recipient principal) (base-amount uint))
  (/ (* base-amount (var-get base-rewards)) ONE_PRC))

;; 0.01x^3 - 0.01x^2 + 2x + 100
(define-constant A 100)
(define-constant B 100)
(define-constant C 20000)
(define-read-only (polynomial (x int))
  (+ (- (* A (pow x 3)) (* B (pow x 2))) (* C x) 1000000))

(define-read-only (get-base-reward)
  (var-get base-rewards))

;; -- ownable-trait --
(define-data-var contract-owner principal .executor-dao)

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; --- approved
(define-read-only (is-approved-contract (contract principal))
  (if (or
    (contract-call? .globals is-pool-contract contract)
    (contract-call? .globals is-cover-pool-contract contract))
    (ok true)
    ERR_UNAUTHORIZED))

;; --- Extension callback
(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
;; ERROR START 19000
(define-constant ERR_UNAUTHORIZED (err u19000))
(define-constant ERR_INVALID_CYCLE (err u19001))
(define-constant ERR_NOT_ENOUGH_REWARDS (err u19002))
