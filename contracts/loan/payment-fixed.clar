(impl-trait .payment-trait.payment-trait)
(impl-trait .ownable-trait.ownable-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)

(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))

(define-constant BLOCKS_PER_YEAR (* u365 ONE_DAY))
;; (define-constant BLOCKS_PER_YEAR u52560)
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
    (print { type: "set-contract-owner-payment-fixed", payload: owner })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-public (set-late-fee (fee uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (print { type: "set-payment-fixed", payload: { fee: fee } })
    (ok (var-set late-fee fee))
  )
)

(define-public (set-early-repayment-fee (fee uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (print { type: "set-early-repayment-fee-payment-fixed", payload: { early-repayment-fee: fee } })
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
(define-public (make-next-payment
  (lp-token <lp-token>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (height uint)
  (loan-id uint)
  (paid-amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (lp-contract (contract-of lp-token))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool token-id)))
    (delegate (get pool-delegate pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    (next-payment (get next-payment loan))
    (payment (get-payment amount (get payment-period loan) apr height next-payment caller))
    ;; get amount of Zest required for x amount of xBTC
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token payment)))
    (xbtc-staker-portion (get-prc payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc payment (get delegate-fee pool)))
    (xbtc-lp-portion (- payment xbtc-staker-portion xbtc-delegate-portion))
    (z-staker-portion (get-prc zest-amount (get cover-fee pool)))
    (z-delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (z-lp-portion (- zest-amount z-staker-portion z-delegate-portion))
    (amount-paid (unwrap! (contract-call? xbtc get-balance (as-contract tx-sender)) ERR_PANIC))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (<= payment paid-amount) ERR_NOT_ENOUGH_PAID)
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (asserts! (is-eq (contract-of lv) (get liquidity-vault pool)) ERR_INVALID_LV)
    (try! (distribute-xbtc lv .protocol-treasury lp-token cp-rewards-token token-id xbtc-lp-portion .cover-pool-v1-0 xbtc-staker-portion xbtc-delegate-portion (get pool-delegate pool) xbtc))
    (try! (distribute-zest lp-token token-id cp-token zd-token z-lp-portion .cover-pool-v1-0 z-staker-portion delegate z-delegate-portion))

    ;; set to false when a payment is done always
    (map-set late-payment-switch caller false)
    (print { type: "late-payment-switch-payment-fixed", payload: { caller: caller, switch: false } })
    
    (if (is-eq u1 (get remaining-payments loan))
      (begin
        (asserts! (>= paid-amount (+ payment (get loan-amount loan))) ERR_NOT_ENOUGH_REPAID)
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
(define-public (make-full-payment
  (lp-token <lp-token>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (height uint)
  (loan-id uint)
  (paid-amount uint)
  (xbtc <ft>)
  (caller principal)
  )
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
    (payment (get-payment amount (get payment-period loan) apr height (get next-payment loan) caller))
    (early-payment (+ payment (get-prc payment (var-get early-repayment-fee))))
    (xbtc-staker-portion (get-prc early-payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc early-payment (get delegate-fee pool)))
    (xbtc-lp-portion (- early-payment xbtc-staker-portion xbtc-delegate-portion))
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token early-payment)))
    (z-staker-portion (get-prc zest-amount (get cover-fee pool)))
    (z-delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (z-lp-portion (- zest-amount z-staker-portion z-delegate-portion))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (asserts! (is-eq (contract-of lv) (get liquidity-vault pool)) ERR_INVALID_LV)
    (try! (distribute-xbtc lv .protocol-treasury lp-token cp-rewards-token token-id xbtc-lp-portion .cover-pool-v1-0 xbtc-staker-portion xbtc-delegate-portion (get pool-delegate pool) xbtc))
    (try! (distribute-zest lp-token token-id cp-token zd-token z-lp-portion .cover-pool-v1-0 z-staker-portion delegate z-delegate-portion))

    ;; set to false when a payment is done always
    (map-set late-payment-switch caller false)
    (print { type: "late-payment-switch-payment-fixed", payload: { caller: caller, switch: false } })
    
    (try! (as-contract (contract-call? xbtc transfer amount tx-sender (get liquidity-vault pool) none)))
  
    (ok { reward: early-payment, z-reward: u0, full-payment: amount })
  )
)

(define-read-only (get-prc (amount uint) (bp uint))
  (/ (* bp amount) DEN)
)

(define-map late-payment-switch principal bool)

(define-public (trigger-late-payment (loan-id uint) (token-id uint))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (loan-pool-id (try! (contract-call? .pool-v1-0 get-loan-pool-id loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    ;; Test that loan belongs to pool
    (asserts! (is-eq loan-pool-id token-id) ERR_UNAUTHORIZED)

    (print { type: "trigger-late-payment-payment-fixed", payload: { borrower: (get borrower loan), switch: true } })
    (ok (map-set late-payment-switch (get borrower loan) true))
  )
)

(define-read-only (is-paying-late-fees (caller principal))
  (default-to false (map-get? late-payment-switch caller))
)

(define-read-only (get-payment (amount uint) (payment-period uint) (apr uint) (height uint) (next-payment uint) (caller principal))
  (let (
    (payment (/ (/ (* amount payment-period apr PRECISION) BLOCKS_PER_YEAR) PRECISION DEN))
  )
    (if (and (is-paying-late-fees caller) (> height next-payment))
      (+ payment (/ (* payment (var-get late-fee)) DEN))
      payment
    )
  )
)

(define-read-only (get-payment-at-height (loan-id uint) (height uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v1-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
    (payment (get-payment (get loan-amount loan) (get payment-period loan) (get apr loan) height (get next-payment loan) caller))
  )
    payment
  )
)

(define-read-only (get-current-loan-payment (loan-id uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v1-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
    (payment (get-payment (get loan-amount loan) (get payment-period loan) (get apr loan) burn-block-height (get next-payment loan) caller))
  )
    payment
  )
)

(define-read-only (get-early-repayment-amount (loan-id uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v1-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v1-0 get-pool-read token-id))
    (payment (get-payment (get loan-amount loan) (get payment-period loan) (get apr loan) burn-block-height (get next-payment loan) caller))
    (early-repayment (get-prc payment (var-get early-repayment-fee)))
  )
    (+ payment early-repayment (get loan-amount loan))
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
  (lv <lv>)
  (treasury principal)
  (lp-token <lp-token>)
  (cp-rewards-token <dt>)
  (token-id uint)
  (lp-portion uint)
  (staking-pool principal)
  (cover-portion uint)
  (delegate-portion uint)
  (delegate principal)
  (xbtc <ft>)
  )
  (let (
    (globals (contract-call? .globals get-globals))
    ;; (to-treasury (+ delegate-portion cover-portion))
  )
    (asserts! (is-eq treasury (get treasury globals)) ERR_INVALID_TREASURY)
    ;; (try! (as-contract (contract-call? xbtc transfer to-treasury tx-sender treasury none)))

    ;; to delegate
    (try! (as-contract (contract-call? xbtc transfer delegate-portion tx-sender delegate none)))

    ;; to LPs

    (try! (as-contract (contract-call? lv add-asset xbtc lp-portion token-id tx-sender)))
    (try! (contract-call? lp-token add-rewards token-id lp-portion))

    ;; to Cover
    (try! (as-contract (contract-call? lv add-asset xbtc cover-portion token-id tx-sender)))
    (try! (contract-call? cp-rewards-token add-rewards token-id cover-portion))

    ;; record read-data
    (try! (contract-call? .read-data add-pool-btc-rewards-earned token-id lp-portion))
    (try! (contract-call? .read-data add-cover-pool-btc-rewards-earned token-id cover-portion))
    (try! (contract-call? .read-data add-pool-cash token-id (+ cover-portion lp-portion)))

    (print { delegate-portion: delegate-portion, lp-portion: lp-portion, cover-portion: cover-portion })

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
  (cp-token <cp-token>)
  (zd-token <dt>)
  (lp-portion uint)
  (staking-pool principal)
  (cover-portion uint)
  (delegate principal)
  (delegate-portion uint)
  )
  (let (
    (cover-pool (contract-call? .cover-pool-v1-0 get-pool-read token-id))
  )
    (try!
      (contract-call? .zge000-governance-token edg-mint-many
      (list 
        ;; { amount: lp-portion, recipient: .zest-reward-dist }
        ;; { amount: staker-portion, recipient: (contract-of cp-token) }
        { amount: delegate-portion, recipient: delegate }
      ))
    )
    (try! (contract-call? zd-token add-rewards token-id lp-portion))

    (if (get available cover-pool) (try! (contract-call? cp-token add-rewards token-id cover-portion)) u0)

    ;; (try! (contract-call? .read-data add-pool-zest-rewards-earned token-id (+ delegate-portion lp-portion)))z
    (try! (contract-call? .read-data add-cover-pool-zest-rewards-earned token-id (+ cover-portion)))
    (ok true)
  )
)

;; --- approved

(define-read-only (is-approved-contract (contract principal))
  (if (contract-call? .globals is-loan-contract contract-caller) (ok true) ERR_UNAUTHORIZED)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)

;; ERROR START 5000
(define-constant ERR_UNAUTHORIZED (err u5000))
(define-constant ERR_INVALID_TREASURY (err u5001))
(define-constant ERR_NOT_ENOUGH_PAID (err u5002))
(define-constant ERR_INVALID_PAYMENT (err u5003))
(define-constant ERR_INVALID_SWAP (err u5004))
(define-constant ERR_NOT_ENOUGH_REPAID (err u5005))
(define-constant ERR_INVALID_LV (err u5006))

(define-constant ERR_PANIC (err u5006))
