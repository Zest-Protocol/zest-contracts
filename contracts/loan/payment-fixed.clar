(impl-trait .payment-trait.payment-trait)
(impl-trait .ownable-trait.ownable-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant BLOCKS_PER_YEAR u52560)
(define-constant PRECISION (pow u10 u9))
(define-constant DEN u10000)

;; --- ownable trait

;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)
(define-data-var late-fee uint u10) ;; late fee in Basis Points
(define-data-var early-repayment-fee uint u10) ;; late fee in Basis Points

(define-read-only (get-contract-owner)
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

(define-public (set-late-fee (fee uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set late-fee fee))
  )
)

(define-public (set-early-repayment-fee (fee uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set early-repayment-fee fee))
  )
)

;; funds are received from loan contract and distributed as rewards to LPers, stakers and Pool Delegate
;; the bitcoin has been made through the bridge and if it's enough for the next payment, then it is distributed
;; this is only for periodic payments
;;
;; @restricted approved-contract (loan-v1-0)
;; @returns (respone { reward: uint, z-reward: uint, repayment: bool })
;;
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param height: height of the Bitcoin tx
;; @param loan-id: id of loan being paid for
(define-public (make-next-payment (lp-token <lp-token>) (token-id uint) (cp-token <lp-token>) (zd-token <dt>) (swap-router <swap>) (height uint) (loan-id uint) (xbtc <ft>))
  (let (
    (lp-contract (contract-of lp-token))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool token-id)))
    (delegate (get pool-delegate pool))
    (lv (get liquidity-vault pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    (next-payment (get next-payment loan))
    (payment (get-payment amount (get payment-period loan) apr height next-payment))
    ;; get amount of Zest required for x amount of xBTC
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token payment)))
    (xbtc-staker-portion (get-prc payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc payment (get delegate-fee pool)))
    (xbtc-lp-portion (- payment xbtc-staker-portion xbtc-delegate-portion))
    (staker-portion (get-prc zest-amount (get cover-fee pool)))
    (delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (lp-portion (- zest-amount staker-portion delegate-portion))
    (amount-paid (unwrap! (contract-call? xbtc get-balance (as-contract tx-sender)) ERR_PANIC))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (<= payment amount-paid) ERR_NOT_ENOUGH_PAID)
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (try! (distribute-xbtc lv .protocol-treasury lp-token token-id xbtc-lp-portion .cover-pool-v1-0 xbtc-staker-portion xbtc-delegate-portion xbtc))
    (try! (distribute-zest lp-token token-id cp-token zd-token lp-portion .cover-pool-v1-0 staker-portion delegate delegate-portion))

    (print {del-p: delegate-portion, lp-portion: lp-portion, staker-portion: staker-portion })
    
    (if (is-eq u1 (get remaining-payments loan))
      (begin
        (try! (as-contract (contract-call? xbtc transfer amount tx-sender (get liquidity-vault pool) none)))
        (ok { reward: payment, z-reward: zest-amount, repayment: true })
      )
      (ok { reward: payment, z-reward: zest-amount, repayment: false })
    )
  )
)

;; funds are received from loan contract and distributed as rewards to LPers, stakers and Pool Delegate
;; the bitcoin has been made through the bridge and if it's enough for the next payment, then it is distributed
;; this is only for full repayment + a premium
;;
;; @restricted approved-contract (loan-v1-0)
;; @returns (respone { reward: uint, z-reward: uint, repayment: bool })
;;
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param height: height of the Bitcoin tx
;; @param loan-id: id of loan being paid for
(define-public (make-full-payment (lp-token <lp-token>) (token-id uint) (cp-token <lp-token>) (zd-token <dt>) (swap-router <swap>) (height uint) (loan-id uint) (xbtc <ft>))
  (let (
    (lp-contract (contract-of lp-token))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool token-id)))
    (delegate (get pool-delegate pool))
    (lv (get liquidity-vault pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; amount * delta * (APR / blocks_per_year)
    (payment (get-payment amount (get payment-period loan) apr height (get next-payment loan)))
    (early-payment (+ payment (get-prc payment (var-get early-repayment-fee))))
    (xbtc-staker-portion (get-prc early-payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc early-payment (get delegate-fee pool)))
    (xbtc-lp-portion (- early-payment xbtc-staker-portion xbtc-delegate-portion))
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token early-payment)))
    (staker-portion (get-prc zest-amount (get cover-fee pool)))
    (delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (lp-portion (- zest-amount staker-portion delegate-portion))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (try! (distribute-xbtc lv .protocol-treasury lp-token token-id xbtc-lp-portion .cover-pool-v1-0 xbtc-staker-portion xbtc-delegate-portion xbtc))
    (try! (distribute-zest lp-token token-id cp-token zd-token lp-portion .cover-pool-v1-0 staker-portion delegate delegate-portion))
    
    (try! (as-contract (contract-call? xbtc transfer amount tx-sender (get liquidity-vault pool) none)))
  
    (ok { reward: early-payment, z-reward: u0, full-payment: amount })
  )
)

(define-read-only (get-prc (amount uint) (bp uint))
  (/ (* bp amount) DEN)
)

(define-read-only (get-payment (amount uint) (payment-period uint) (apr uint) (height uint) (next-payment uint))
  (let (
    (payment (/ (/ (* amount payment-period apr PRECISION) BLOCKS_PER_YEAR) PRECISION DEN))
  )
    (if (> height next-payment)
      (+ payment (/ (* payment (var-get late-fee)) DEN))
      payment
    )
  )
)

;; funds are received from loan contract and sent to the LPers and the protocol treasury
;; the bitcoin has been made through the bridge and if it's enough for the next payment, then it is distributed
;; this is only for full repayment + a premium
;;
;; @returns true
;;
;; @param treasury: treasury contract address
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param lp-portion: portion of funds going to LPers
;; @param staking-pool: sp contract that holds zest rewards distributed for liquidity providers
;; @param staker-portion: portion of funds going to stakers
;; @param delegate-portion: portion of funds going to the pool delegate
(define-private (distribute-xbtc
  (lv principal)
  (treasury principal)
  (lp-token <lp-token>)
  (token-id uint)
  (lp-portion uint)
  (staking-pool principal)
  (staker-portion uint)
  (delegate-portion uint)
  (xbtc <ft>)
  )
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (asserts! (is-eq treasury (get treasury globals)) ERR_INVALID_TREASURY)
    (try! (as-contract (contract-call? xbtc transfer (+ delegate-portion staker-portion) tx-sender treasury none)))
    (try! (as-contract (contract-call? xbtc transfer lp-portion tx-sender lv none)))
    (try! (contract-call? lp-token add-rewards token-id lp-portion))
    (ok true)
  )
)

;; LPers' and Stakers' rewards are stored for when it's their time to claim rewards
;; Pool delegate receives Zest rewards
;; to each according to their portion
;;
;; @returns true
;;
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param lp-portion: portion of funds going to LPers
;; @param staking-pool: sp contract that holds zest rewards distributed for liquidity providers
;; @param staker-portion: portion of funds going to stakers
;; @param delegate-portion: portion of funds going to the pool delegate
;; @param delegate: pool delegate address
(define-private (distribute-zest
  (lp-token <lp-token>)
  (token-id uint)
  (cp-token <lp-token>)
  (zd-token <dt>)
  (lp-portion uint)
  (staking-pool principal)
  (staker-portion uint)
  (delegate principal)
  (delegate-portion uint)
  )
  (begin
    (try! 
      (contract-call? .zge000-governance-token edg-mint-many
      (list 
        ;; { amount: lp-portion, recipient: .zest-reward-dist }
        ;; { amount: staker-portion, recipient: (contract-of cp-token) }
        { amount: delegate-portion, recipient: delegate }
      ))
    )
    (try! (contract-call? zd-token add-rewards token-id lp-portion))
    (try! (contract-call? cp-token add-rewards token-id staker-portion))
    (ok true)
  )
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

(define-constant ERR_INVALID_TREASURY (err u4000))
(define-constant ERR_NOT_ENOUGH_PAID (err u4001))

(define-constant ERR_INVALID_PAYMENT (err u2005))

(define-constant ERR_INVALID_SWAP (err u3010))


(define-constant ERR_PANIC (err u7001))

(map-set approved-contracts .loan-v1-0 true)