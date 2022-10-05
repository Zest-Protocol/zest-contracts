;; holds Zest rewards to LPers
(impl-trait .distribution-token-cycles-trait.distribution-token-cycles-trait)
(impl-trait .ownable-trait.ownable-trait)

(use-trait ft .ft-trait.ft-trait)


(define-fungible-token zest-dist)
(define-map token-balances {token-id: uint, owner: principal} uint)
(define-map token-supplies uint uint)
(define-map token-uris uint (string-ascii 256))


;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)
(define-constant ERR_UNAUTHORIZED (err u1000))

(define-constant FOUR_EXP (pow u10 u4))

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
    ;; DISABLED
    (asserts! false ERR_UNAUTHORIZED)
    (map-set points-correction { token-id: token-id, owner: sender } points-correction-from)
    (map-set points-correction { token-id: token-id, owner: recipient } points-correction-to)
		(asserts!  (is-eq sender contract-caller) ERR_UNAUTHORIZED)
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

(define-constant POINTS_MULTIPLIER (pow u2 u32))

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
    (map-set withdrawn-funds { token-id: token-id, owner: caller } (+ withdrawable-funds (get-withdrawn-funds token-id caller)))

    (ok withdrawable-funds)
  )
)

;; always get all cycle rewards
(define-public (withdraw-cycle-rewards (token-id uint) (caller principal))
  (let (
    (funds-sent (try! (contract-call? .pool-v1-0 get-funds-sent caller token-id)))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (start-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent))))
    (last-commitment-cycle (+ (get factor funds-sent) start-cycle))
    (end-cycle (+ (get factor funds-sent) start-cycle))
    (sum (unwrap! (remove-share-cycle (+ u1 start-cycle) end-cycle token-id caller) ERR_NOT_ENOUGH_TIME_PASSED))
    (withdrawable-funds (unwrap-panic (withdraw-rewards token-id caller)))
    (last-claim-at (get last-claim-at funds-sent))
    (start-passive (if (is-eq last-claim-at u0) last-commitment-cycle last-claim-at))
    (delta (if (> current-cycle last-commitment-cycle)
      (- current-cycle start-passive)
      u0
    ))
    (commitment-total (get-balance-uint token-id caller))
    (passive-rewards (* delta commitment-total))
  )
    (try! (is-approved-contract contract-caller))

    (ok { cycle-rewards: sum, passive-rewards: (/ passive-rewards FOUR_EXP) })
  )
)

(define-read-only (get-withdrawable-rewards (token-id uint) (recipient principal))
  (let (
    (funds-sent (contract-call? .pool-v1-0 get-funds-sent-read recipient token-id))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (start-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent))))
    (last-commitment-cycle (+ (get factor funds-sent) start-cycle))
    (end-cycle (+ (get factor funds-sent) start-cycle))
    ;; (end-cycle (if (> last-commitment-cycle current-cycle) current-cycle last-commitment-cycle))
    (sum (unwrap-panic (get-sum-cycles (+ u1 start-cycle) end-cycle token-id recipient)))
    (withdrawable-funds (withdrawable-funds-of-read token-id recipient))
    ;; (passive-rewards (if (> current-cycle end-cycle) (- withdrawable-funds sum) u0))
    (last-claim-at (get last-claim-at funds-sent))
    (start-passive (if (is-eq last-claim-at u0) last-commitment-cycle last-claim-at))
    (delta (if (> current-cycle last-commitment-cycle)
      (- current-cycle start-passive)
      u0
    ))
    (commitment-total (get-balance-uint token-id recipient))
    ;; (passive-rewards (if (> current-cycle end-cycle) (- withdrawable-funds sum) u0))
    (passive-rewards (* delta commitment-total))
    ;; (passive-rewards u0)
  )
    { cycle-rewards: sum, passive-rewards: (/ passive-rewards FOUR_EXP) }
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

(define-map funds-sent-cycle { token-id: uint, cycle: uint} uint )
(define-map funds-sent-cycle-by-principal { token-id: uint, cycle: uint, user: principal } uint )

(define-constant MAX_REWARD_CYCLES u32)
(define-constant REWARD_CYCLE_INDEXES (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31))

(define-read-only (get-cycle-start (token-id uint))
  (unwrap-panic (map-get? cycle-start token-id))
)

(define-read-only (get-cycle-rewards (token-id uint) (cycle uint))
  (default-to u0 (map-get? rewards { token-id: token-id, cycle: cycle }))
)

(define-read-only (get-cycle-share (token-id uint) (cycle uint))
  (default-to u0 (map-get? funds-sent-cycle { token-id: token-id, cycle: cycle }))
)

(define-read-only (get-cycle-share-principal (token-id uint) (cycle uint) (user principal))
  (default-to u0 (map-get? funds-sent-cycle-by-principal { token-id: token-id, cycle: cycle, user: user }))
)

(define-public (empty-commitments (token-id uint) (caller principal))
  (let (
    (funds-sent (unwrap-panic (contract-call? .pool-v1-0 get-funds-sent caller token-id)))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (start-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent))))
    (end-cycle (+ (get factor funds-sent) start-cycle))
    (n-cycles (- end-cycle start-cycle))
    (total-rewards (fold empty-commitments-clojure REWARD_CYCLE_INDEXES { token-id: token-id, first-cycle: start-cycle, period: n-cycles, caller: caller }))
  )
    (try! (is-approved-contract contract-caller))
    (ok true)
  )
)

(define-private (empty-commitments-clojure (cycle-idx uint) (result { token-id: uint, first-cycle: uint, period: uint, caller: principal }))
  (let (
    (current-cycle (+ cycle-idx (get first-cycle result)))
    (caller (get caller result))
    (token-id (get token-id result))
    (rewards-in-cycle (get-cycle-rewards token-id current-cycle))
    (share-in-cycle (get-cycle-share token-id current-cycle))
    (funds-sent-in-cycle (get-cycle-share-principal token-id current-cycle caller))
  )
    (if  (> funds-sent-in-cycle u0)
      (let (
        (portion (/ (* rewards-in-cycle funds-sent-in-cycle) share-in-cycle))
      )
        ;; add to cycle amounts sent
        ;; (map-set funds-sent-cycle { token-id: token-id, cycle: current-cycle } (- share-in-cycle funds-sent-in-cycle))
        (map-delete funds-sent-cycle-by-principal { token-id: token-id, cycle: current-cycle, user: caller })
        ;; add to funds sent by the user
        { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), caller: caller }
      )
      ;; do if above cycle commitment
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), caller: caller }
    )
  )
)

(define-private (remove-share-cycle (start-cycle uint) (end-cycle uint) (token-id uint) (caller principal))
  (let (
    (n-cycles (- end-cycle start-cycle))
    (total-rewards (fold remove-share-cycles-clojure REWARD_CYCLE_INDEXES { token-id: token-id, first-cycle: start-cycle, period: n-cycles, total: u0, caller: caller }))
  )
    (ok (get total total-rewards))
  )
)

(define-private (remove-share-cycles-clojure (cycle-idx uint) (result { token-id: uint, first-cycle: uint, period: uint, total: uint, caller: principal }))
  (let (
    (current-cycle (+ cycle-idx (get first-cycle result)))
    (caller (get caller result))
    (token-id (get token-id result))
    ;; (rewards-in-cycle (get-cycle-rewards token-id current-cycle))
    ;; (share-in-cycle (get-cycle-share token-id current-cycle))
    (funds-sent-in-cycle (get-cycle-share-principal token-id current-cycle caller))
  )
    (if (and (> (unwrap-panic (get-current-cycle (get token-id result))) current-cycle) (> funds-sent-in-cycle u0))
      (let (
        (rewards-in-cycle (get-cycle-rewards token-id current-cycle))
        (total-in-cycle (get-cycle-share (get token-id result) current-cycle))
        (portion (/ (/ (* rewards-in-cycle funds-sent-in-cycle) total-in-cycle) POINTS_MULTIPLIER ))
      )
        ;; add to cycle amounts sent
        ;; (map-set funds-sent-cycle { token-id: token-id, cycle: current-cycle } (- share-in-cycle funds-sent-in-cycle))
        (map-delete funds-sent-cycle-by-principal { token-id: token-id, cycle: current-cycle, user: caller })
        ;; add to funds sent by the user
        { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), total: (+ (get total result) portion), caller: caller}
      )
      ;; do if above cycle commitment
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), total: (get total result), caller: caller }
    )
  )
)

(define-public (set-share-cycles (start-cycle uint) (end-cycle uint) (token-id uint) (amount uint) (caller principal))
  (let (
    (n-cycles (- end-cycle start-cycle))
    (total-rewards (fold set-share-cycles-clojure REWARD_CYCLE_INDEXES { token-id: token-id, first-cycle: (+ u1 start-cycle), period: n-cycles, amount: amount, caller: caller }))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (<= n-cycles MAX_REWARD_CYCLES) ERR_INVALID_LENGTH)

    (print { token-id: token-id, first-cycle: (+ u1 start-cycle), period: n-cycles, amount: amount })
    (ok true)
  )
)

(define-private (set-share-cycles-clojure (cycle-idx uint) (result { token-id: uint, first-cycle: uint, period: uint, amount: uint, caller: principal }))
  (let (
    (caller (get caller result))
    (share-in-cycle (get-cycle-share (get token-id result) (+ cycle-idx (get first-cycle result))))
    (funds-sent-in-cycle (get-cycle-share-principal (get token-id result) (+ cycle-idx (get first-cycle result)) caller))
  )
    (if (> (get period result) cycle-idx)
      (begin
        ;; add to cycle amounts sent
        (map-set funds-sent-cycle { token-id: (get token-id result), cycle: (+ cycle-idx (get first-cycle result)) } (+ (get amount result) share-in-cycle))
        ;; add to funds sent by the user
        (map-set funds-sent-cycle-by-principal { token-id: (get token-id result), cycle: (+ cycle-idx (get first-cycle result)), user: caller } (+ funds-sent-in-cycle (get amount result)))
        { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), amount: (get amount result), caller: caller }
      )
      ;; do if above cycle commitment
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), amount: (get amount result), caller: caller }
    )
  )
)

(define-public (get-committed-funds (token-id uint) (owner principal))
  (begin
    (asserts! true (err u1))
    (ok u1)
  )
)

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint))
  (let (
    (first-block (get-cycle-start token-id))
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
    (cycle-length (get cycle-length pool))
  )
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none
    )
  )
)

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
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
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
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
    (current-cycle (unwrap-panic (get-cycle-at token-id time)))
    (cycle-rewards (get-cycle-rewards token-id current-cycle))

    (total-in-cycle (if (> u0 (get-cycle-share token-id current-cycle)) (get-cycle-share token-id current-cycle) u1))
    (total-supply (get-total-supply-uint token-id))
    (added-points (/ (* amount POINTS_MULTIPLIER) total-in-cycle))
    (total-points-shared (+ (get-points-per-share token-id) added-points))
  )
    (map-set rewards { token-id: token-id, cycle: current-cycle } (+ total-points-shared cycle-rewards))
    current-cycle
  )
)

(define-read-only (get-all-cycle-rewards-of (token-id uint) (recipient principal))
  (let (
    (funds-sent (contract-call? .pool-v1-0 get-funds-sent-read recipient token-id))
    (start-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent))))
    (end-cycle (+ (get factor funds-sent) start-cycle))
    (sum (unwrap-panic (get-sum-cycles (+ u1 start-cycle) (+ u1 end-cycle) token-id recipient)))
  )
    sum
  )
)

(define-read-only (get-claimable-rewards-by (token-id uint) (owner principal))
  (let (
    (funds-sent (contract-call? .pool-v1-0 get-funds-sent-read owner token-id))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (start-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent))))
    (last-commitment-cycle (+ (get factor funds-sent) start-cycle))
    (end-cycle (if (> last-commitment-cycle current-cycle) current-cycle last-commitment-cycle))
  )
    (get-sum-cycles (+ u1 start-cycle) (+ u1 end-cycle) token-id owner)
  )
)

(define-read-only (get-sum-cycles (start-cycle uint) (end-cycle uint) (token-id uint) (recipient principal))
  (let (
    (ok-result (asserts! (> end-cycle start-cycle) ERR_NOT_ENOUGH_TIME_PASSED))
    (n-cycles (- end-cycle start-cycle))
    (total-rewards (fold get-sum-cycles-clojure REWARD_CYCLE_INDEXES { token-id: token-id, first-cycle: start-cycle, period: n-cycles, sum: u0, recipient: recipient }))
  )
    (asserts! (<= n-cycles MAX_REWARD_CYCLES) ERR_INVALID_LENGTH)
    (ok (get sum total-rewards))
  )
)

(define-private (get-sum-cycles-clojure (cycle-idx uint) (result { token-id: uint, first-cycle: uint, period: uint, sum: uint, recipient: principal }))
  (let (
    (current-cycle (+ cycle-idx (get first-cycle result)))
    (token-id (get token-id result))
    (balance (get-balance-uint token-id (get recipient result)))
    )
    (if (> (get period result) cycle-idx)
      (let (
        (rewards-in-cycle (get-cycle-rewards token-id current-cycle))
        (total-in-cycle (get-cycle-share (get token-id result) current-cycle))
        (funds-sent-in-cycle (get-cycle-share-principal (get token-id result) current-cycle (get recipient result)))
        (portion (/ (/ (* rewards-in-cycle funds-sent-in-cycle) total-in-cycle) POINTS_MULTIPLIER ))
      )
        { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), sum: (+ portion (get sum result)), recipient: (get recipient result) }
      )
      ;; do if all cycles
      { token-id: (get token-id result), first-cycle: (get first-cycle result), period: (get period result), sum: (get sum result), recipient: (get recipient result) }
    )
  )
)

(map-set approved-contracts .loan-v1-0 true)
(map-set approved-contracts .pool-v1-0 true)
(map-set approved-contracts .payment-fixed true)

;; ERROR START 15000
(define-constant ERR_INVALID_PRINCIPAL (err u15000))
(define-constant ERR_INSUFFICIENT_BALANCE (err u15001))
(define-constant ERR_PANIC (err u15002))
(define-constant ERR_INVALID_LENGTH (err u15003))
(define-constant ERR_NOT_ENOUGH_TIME_PASSED (err u15004))