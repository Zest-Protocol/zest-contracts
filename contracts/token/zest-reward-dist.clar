;; holds Zest rewards to LPers

(impl-trait .distribution-token-cycles-trait.distribution-token-cycles-trait)
(impl-trait .ownable-trait.ownable-trait)

(use-trait ft .sip-010-trait.sip-010-trait)


(define-fungible-token zest-dist)
(define-map token-balances {token-id: uint, owner: principal} uint)
(define-map token-supplies uint uint)
(define-map token-uris uint (string-ascii 256))


;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)
(define-constant ERR_UNAUTHORIZED (err u1000))

;; -- sip-010 functions

(define-private (set-balance (token-id uint) (balance uint) (owner principal))
	(map-set token-balances {token-id: token-id, owner: owner} balance)
)

(define-read-only (get-balance-uint (token-id uint) (who principal))
	(default-to u0 (map-get? token-balances {token-id: token-id, owner: who}))
)

(define-read-only (get-balance (token-id uint) (who principal))
	(ok (get-balance-uint token-id who))
)

(define-read-only (get-overall-balance (who principal))
	(ok (ft-get-balance zest-dist who))
)

(define-read-only (get-total-supply-uint (token-id uint))
	(default-to u0 (map-get? token-supplies token-id))
)

(define-read-only (get-total-supply (token-id uint))
	(ok (get-total-supply-uint token-id))
)

(define-read-only (get-overall-supply)
	(ok (ft-get-supply zest-dist))
)

(define-read-only (get-decimals (token-id uint))
	(ok u0)
)

(define-public (set-token-uri (token-id uint) (value (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set token-uris token-id value))
  )
)

(define-read-only (get-token-uri (token-id uint))
	(ok (map-get? token-uris token-id))
)

(define-public (transfer (token-id uint) (amount uint) (sender principal) (recipient principal))
  (let
		(
			(sender-balance (get-balance-uint token-id sender))
      (points-mag (to-int (* amount (get-points-per-share token-id))))
      (points-correction-from (+ (get-points-correction token-id sender) points-mag))
      (points-correction-to (+ (get-points-correction token-id recipient) points-mag))
		)
    (map-set points-correction { token-id: token-id, owner: sender } points-correction-from)
    (map-set points-correction { token-id: token-id, owner: recipient } points-correction-to)
		(asserts! (is-eq sender contract-caller) ERR_UNAUTHORIZED)
		(asserts! (<= amount sender-balance) ERR_INSUFFICIENT_BALANCE)
		(set-balance token-id (- sender-balance amount) sender)
		(set-balance token-id (+ (get-balance-uint token-id recipient) amount) recipient)
		(try! (ft-transfer? zest-dist amount sender recipient))
		(print {type: "sft_transfer", token-id: token-id, amount: amount, sender: sender, recipient: recipient})
		(ok true)
	)
)

(define-public (transfer-memo (token-id uint) (amount uint) (sender principal) (recipient principal) (memo (buff 34)))
	(begin
		(try! (transfer token-id amount sender recipient))
		(print memo)
		(ok true)
	)
)

(define-private (transfer-many-iter (item {token-id: uint, amount: uint, sender: principal, recipient: principal}) (previous-response (response bool uint)))
	(match previous-response prev-ok (transfer (get token-id item) (get amount item) (get sender item) (get recipient item)) prev-err previous-response)
)

(define-public (transfer-many (transfers (list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal})))
	(fold transfer-many-iter transfers (ok true))
)

(define-private (transfer-many-memo-iter (item {token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34)}) (previous-response (response bool uint)))
	(match previous-response prev-ok (transfer-memo (get token-id item) (get amount item) (get sender item) (get recipient item) (get memo item)) prev-err previous-response)
)

(define-public (transfer-many-memo (transfers (list 200 {token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34)})))
	(fold transfer-many-memo-iter transfers (ok true))
)

;; distribution-token-trait BEGIN
;; Uses Funds Distribution Token model from : https://github.com/ethereum/EIPs/issues/2222
;; token circulation can be of 2^112 because:
;; Max satoshi :
;; 2.1 * 10^7 * 10^8  = 2.1 * 10^15
;; require 2^51 precision
;; and max uint precision is 2^128

(define-constant POINTS_MULTIPLIER (pow u2 u64))

(define-map points-per-share uint uint)
(define-map points-correction { token-id: uint, owner: principal } int)
(define-map withdrawn-funds { token-id: uint, owner: principal } uint)

;; GETTERS
(define-read-only (get-points-per-share (token-id uint))
  (default-to u0 (map-get? points-per-share token-id))
)

(define-read-only (get-points-correction (token-id uint) (owner principal))
  (default-to 0 (map-get? points-correction { token-id: token-id, owner: owner }))
)

(define-read-only (get-withdrawn-funds (token-id uint) (owner principal))
  (default-to u0 (map-get? withdrawn-funds { token-id: token-id, owner: owner }))
)

(define-read-only (get-sent-funds (token-id uint) (owner principal))
  (/ (get-balance-uint token-id owner) DFT_PRECISION)
)

(define-constant DFT_PRECISION (pow u10 u5))

;; claim withdrawable funds by the token owner
(define-public (withdraw-rewards (token-id uint) (caller principal))
  (let (
    (withdrawable-funds (withdrawable-funds-of-read token-id caller))
  )
    (try! (is-approved-contract contract-caller))
    (map-set withdrawn-funds { token-id: token-id , owner: caller} (+ withdrawable-funds (get-withdrawn-funds token-id caller)))

    (ok withdrawable-funds)
  )
)

(define-public (withdraw-cycle-rewards (token-id uint) (caller principal))
  (let (
    ;; (withdrawable-funds (withdrawable-funds-of-read token-id recipient))
    (pool (unwrap-panic (contract-call? .pool-v1-0 get-pool token-id)))
    (funds-sent (unwrap-panic (contract-call? .pool-v1-0 get-funds-sent caller token-id)))
    (cycle-length (get cycle-length pool))
    (cycle-sent (get cycle-sent funds-sent))
    (cycle-claimed (if (is-eq cycle-sent u0) (+ u1 cycle-sent) (get cycle-claimed funds-sent)))
    (factor (get factor funds-sent))
    ;; temp value as cycle-delta before claim calculations
    (cycle-delta factor)
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height cycle-length)))
    (cycles (if (< cycle-delta current-cycle) cycle-delta current-cycle))
    (sum (unwrap-panic (get-sum-cycles cycle-claimed cycles token-id)))
  )
    (asserts! (> current-cycle cycle-claimed) ERR_NOT_ENOUGH_TIME_PASSED)
    (try! (is-approved-contract contract-caller))
    (print { start-cycle: cycle-claimed, cycle-end: cycles })

    (ok sum)
  )
)

;; called by pool to add rewards acquired
(define-public (add-rewards (token-id uint) (delta uint))
  (let (
    (total-supply (get-total-supply-uint token-id))
    (valid-token-id (asserts! (> total-supply u0) (ok u0)))
    (added-points (/ (* delta POINTS_MULTIPLIER) total-supply))
    (total-points-shared (+ (get-points-per-share token-id) added-points))
  )
    (try! (is-approved-contract contract-caller))
    (set-rewards token-id delta block-height)
    (map-set points-per-share token-id total-points-shared)
    (print { type: "added_funds", added-points: added-points })
    (ok total-points-shared)
  )
)

(define-public (mint (token-id uint) (amount uint) (recipient principal))
  (begin
    (try! (is-approved-contract contract-caller))
		(try! (ft-mint? zest-dist amount recipient))
		;; (try! (tag-nft-token-id {token-id: token-id, owner: recipient}))
		(set-balance token-id (+ (get-balance-uint token-id recipient) amount) recipient)
		(map-set token-supplies token-id (+ (unwrap-panic (get-total-supply token-id)) amount))
    (mint-priv token-id amount recipient)
		(print {type: "sft_mint", token-id: token-id, amount: amount, recipient: recipient})
		(ok true)
	)
)

(define-public (burn (token-id uint) (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (try! (ft-burn? zest-dist amount owner))
    (set-balance token-id (- (get-balance-uint token-id owner) amount) owner)
		(map-set token-supplies token-id (- (unwrap-panic (get-total-supply token-id)) amount))
    (burn-priv token-id amount owner)
		(print {type: "sft_burn", token-id: token-id, amount: amount, owner: owner})
    (ok true)
	)
)

(define-private (burn-priv (token-id uint) (amount uint) (owner principal))
  (let (
    (point-correction (to-int (* amount (get-points-per-share token-id))))
  )
    (map-set points-correction { owner: owner, token-id: token-id }
      (+ (get-points-correction token-id owner) point-correction)
    )
  )
)

(define-private (mint-priv (token-id uint) (amount uint) (recipient principal))
  (let (
    (point-correction (to-int (* amount (get-points-per-share token-id))))
  )
    (map-set points-correction { owner: recipient, token-id: token-id }
      (- (get-points-correction token-id recipient) point-correction)
    )
  )
)

(define-read-only (withdrawable-funds-of-read (token-id uint) (owner principal))
  (- (accumulative-funds-of token-id owner) (get-withdrawn-funds token-id owner))
)

(define-read-only (accumulative-funds-of (token-id uint) (owner principal))
  (begin
    (/
      (to-uint (+
        (to-int (* (get-points-per-share token-id) (get-balance-uint token-id owner)))
        (get-points-correction token-id owner)
      ))
    POINTS_MULTIPLIER)
  )
)

;; ;; -- ownable-trait --
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


;; -- pool rewards storage

;; token-id -> cycle-start
(define-map cycle-start uint uint)
;; total rewards in cycle
(define-map rewards { token-id: uint, cycle: uint} uint)

(define-constant MAX_REWARD_CYCLES u32)
(define-constant REWARD_CYCLE_INDEXES (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31))

(define-read-only (get-cycle-start (token-id uint))
  (unwrap-panic (map-get? cycle-start token-id))
)

(define-read-only (get-cycle-rewards (token-id uint) (cycle uint))
  (default-to u0 (map-get? rewards { token-id: token-id, cycle: cycle }))
)

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint) (cycle-length uint))
  (let (
    (first-block (get-cycle-start token-id))
  )
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none
    )
  )
)

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (contract-call? .pool-v1-0 get-pool-data token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height)
  )
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none
    )
  )
)

(define-read-only (get-next-cycle-height (token-id uint))
  (let (
    (pool (contract-call? .pool-v1-0 get-pool-data token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height)
  )
    (if (>= stacks-height first-block)
      (some (+ first-block (* cycle-length (+ u1 (/ (- stacks-height first-block) cycle-length)))))
      none
    )
  )
)

(define-public (set-cycle-start (token-id uint) (start uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set cycle-start token-id start))
  )
)

(define-private (set-rewards (token-id uint) (amount uint) (time uint))
  (let (
    (pool (unwrap-panic (contract-call? .pool-v1-0 get-pool token-id)))
    (cycle (unwrap-panic (get-cycle-at token-id time (get cycle-length pool))))
    (cycle-rewards (get-cycle-rewards token-id cycle))
  )
    (map-set rewards { token-id: token-id, cycle: cycle } (+ amount cycle-rewards))
    cycle
  )
)

(define-read-only (get-sum-cycles (start-cycle uint) (end-cycle uint) (token-id uint))
  (let (
    (n-cycles (- end-cycle start-cycle))
    (total-rewards (fold get-sum-cycles-clojure REWARD_CYCLE_INDEXES { token-id: token-id, first-cycle: start-cycle, period: n-cycles, sum: u0 }))
  )
    (print { n-cycles: n-cycles })
    (asserts! (<= (- end-cycle start-cycle) MAX_REWARD_CYCLES) ERR_INVALID_LENGTH)
    (ok (get sum total-rewards))
  )
)

(define-private (get-sum-cycles-clojure (cycle-idx uint) (result { token-id: uint, first-cycle: uint, period: uint, sum: uint }))
  (let (
    (rewards-in-cycle (get-cycle-rewards (get token-id result) (+ cycle-idx (get first-cycle result))))
  )
    (if (> (get period result) cycle-idx)
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), sum: (+ rewards-in-cycle (get sum result)) }
      ;; do if all cycles
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), sum: (get sum result) }
    )
  )
)

(define-constant ERR_INVALID_PRINCIPAL (err u5000))
(define-constant ERR_INSUFFICIENT_BALANCE (err u7000))
(define-constant ERR_PANIC (err u7001))
(define-constant ERR_INVALID_LENGTH (err u7002))
(define-constant ERR_NOT_ENOUGH_TIME_PASSED (err u7003))


(map-set approved-contracts .loan-v1-0 true)
(map-set approved-contracts .pool-v1-0 true)
(map-set approved-contracts .payment-fixed true)