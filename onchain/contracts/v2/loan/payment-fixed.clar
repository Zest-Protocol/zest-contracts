(impl-trait .payment-trait.payment-trait)
(impl-trait .ownable-trait.ownable-trait)
(impl-trait .extension-trait.extension-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait sip-010 .sip-010-trait.sip-010-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))

(define-constant BLOCKS_PER_YEAR (* u365 ONE_DAY))
(define-constant PRECISION (pow u10 u9))
(define-constant DEN u10000)

;; @desc funds are received from loan contract and distributed as rewards to LPers, stakers and Pool Delegate
;; the bitcoin has been made through the bridge and if it's enough for the next payment, then it is distributed
;; this is only for periodic payments
;; @restricted loan
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: cp contract that holds zest rewards distributed for cover providers
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param height: height of the Bitcoin tx
;; @param loan-id: id of loan being paid for
;; @param paid-amount: amount being paid
;; @param xbtc: SIP-010 token to account for bitcoin sent to pools
;; @param caller: principal of the user making the payment (assumes principal is validated)
;; @returns (respone { reward: uint, z-reward: uint, repayment: bool })
(define-public (make-next-payment
  (lp <sip-010>)
  (l-v <lv>)
  (token-id uint)
  (cp <cp-token>)
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (height uint)
  (loan-id uint)
  (paid-amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (lp-contract (contract-of lp))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (cover-pool (contract-call? .cover-pool-v1-0 get-pool-read token-id))
    (delegate (get pool-delegate pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    (next-payment (get next-payment loan))
    (payment (get-payment token-id amount (get payment-period loan) apr height next-payment caller))
    ;; get amount of Zest required for x amount of xBTC
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token payment)))
    (xbtc-staker-portion (get-prc payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc payment (get delegate-fee pool)))
    (xbtc-lp-portion (- payment xbtc-staker-portion xbtc-delegate-portion))
    (z-staker-portion (get-prc zest-amount (get cover-fee pool)))
    (z-delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (z-lp-portion (- zest-amount z-staker-portion z-delegate-portion))
    (amount-paid (unwrap! (contract-call? xbtc get-balance (as-contract tx-sender)) ERR_PANIC)))
    (try! (is-approved-contract contract-caller))
    (asserts! (<= payment paid-amount) ERR_NOT_ENOUGH_PAID)
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (asserts! (is-eq (contract-of l-v) (get liquidity-vault pool)) ERR_INVALID_LV)
    (try! (distribute-xbtc l-v .protocol-treasury lp cp-rewards-token token-id xbtc-lp-portion .cover-pool-v1-0 (get available cover-pool) xbtc-staker-portion xbtc-delegate-portion (get pool-delegate pool) xbtc))
    (try! (distribute-zest lp token-id cp zd-token z-lp-portion .cover-pool-v1-0 z-staker-portion delegate z-delegate-portion))

    ;; set to false when a payment is done always
    (map-set late-payment-switch caller false)
    (print { type: "late-payment-switch-payment-fixed", payload: { key: caller, data: { switch: false }} })
    
    (if (is-eq u1 (get remaining-payments loan))
      (begin
        (asserts! (>= paid-amount (+ payment (get loan-amount loan))) ERR_NOT_ENOUGH_REPAID)
        (try! (as-contract (contract-call? l-v add-asset xbtc amount token-id tx-sender)))
        (ok { reward: payment, z-reward: zest-amount, repayment: true }))
      (ok { reward: payment, z-reward: zest-amount, repayment: false }))))

;; @desc funds are received from loan contract and distributed as rewards to LPers, stakers and Pool Delegate
;; the bitcoin has been made through the bridge and if it's enough for the next payment, then it is distributed.
;; this is only for full repayment + a premium
;; @restricted loan
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: cp contract that holds zest rewards distributed for cover providers
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param height: height of the Bitcoin tx
;; @param loan-id: id of loan being paid for
;; @param paid-amount: amount being paid
;; @param xbtc: SIP-010 token to account for bitcoin sent to pools
;; @param caller: principal of the user making the payment (assumes principal is validated)
;; @returns (respone { reward: uint, z-reward: uint, repayment: bool })
(define-public (make-full-payment
  (lp <sip-010>)
  (l-v <lv>)
  (token-id uint)
  (cp <cp-token>)
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (height uint)
  (loan-id uint)
  (paid-amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (lp-contract (contract-of lp))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (cover-pool (contract-call? .cover-pool-v1-0 get-pool-read token-id))
    (delegate (get pool-delegate pool))
    (pool-lv (get liquidity-vault pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; amount * delta * (APR / blocks_per_year)
    (payment (get-payment token-id amount (get payment-period loan) apr height (get next-payment loan) caller))
    (early-payment (+ payment (get-prc payment (get-early-repayment-fee token-id))))
    (xbtc-staker-portion (get-prc early-payment (get cover-fee pool)))
    (xbtc-delegate-portion (get-prc early-payment (get delegate-fee pool)))
    (xbtc-lp-portion (- early-payment xbtc-staker-portion xbtc-delegate-portion))
    (zest-amount (try! (contract-call? swap-router get-y-given-x xbtc .zge000-governance-token early-payment)))
    (z-staker-portion (get-prc zest-amount (get cover-fee pool)))
    (z-delegate-portion (get-prc zest-amount (get delegate-fee pool)))
    (z-lp-portion (- zest-amount z-staker-portion z-delegate-portion)))
    (try! (is-approved-contract contract-caller))
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_PAYMENT)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP)
    (asserts! (is-eq (contract-of l-v) pool-lv) ERR_INVALID_LV)
    (try! (distribute-xbtc l-v .protocol-treasury lp cp-rewards-token token-id xbtc-lp-portion .cover-pool-v1-0 (get available cover-pool) xbtc-staker-portion xbtc-delegate-portion (get pool-delegate pool) xbtc))
    (try! (distribute-zest lp token-id cp zd-token z-lp-portion .cover-pool-v1-0 z-staker-portion delegate z-delegate-portion))

    ;; set to false when a payment is done always
    (map-set late-payment-switch caller false)
    (print { type: "late-payment-switch-payment-fixed", payload: { key: caller, data: { switch: false }} })
    
    (try! (as-contract (contract-call? l-v add-asset xbtc amount token-id tx-sender)))
    (ok { reward: early-payment, z-reward: u0, full-payment: amount })))

;; -- late-payment-switch
(define-map late-payment-switch principal bool)

;; @desc trigger a late payment only for the next (1) payment
;; @restricted pool-delegate
;; @param loan-id: id of loan being paid for
;; @param token-id: id of the pool that the pool delegate controls
;; @returns (respone true uint)
(define-public (trigger-late-payment (loan-id uint) (token-id uint))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (loan-pool-id (try! (contract-call? .pool-v2-0 get-loan-pool-id loan-id)))
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq loan-pool-id token-id) ERR_UNAUTHORIZED)

    (print { type: "trigger-late-payment-payment-fixed", payload: { key: (get borrower loan), data: { switch: true }} })
    (ok (map-set late-payment-switch (get borrower loan) true))))

(define-read-only (is-paying-late-fees (caller principal))
  (default-to false (map-get? late-payment-switch caller)))

;; -- payment getters
(define-read-only (get-payment (token-id uint) (amount uint) (payment-period uint) (apr uint) (height uint) (next-payment uint) (caller principal))
  (let (
    (payment (/ (/ (* amount payment-period apr PRECISION) BLOCKS_PER_YEAR) PRECISION DEN)))
    (if (and (is-paying-late-fees caller) (> height next-payment))
      (+ payment (/ (* payment (get-late-fee token-id)) DEN))
      payment)))

(define-read-only (get-payment-at-height (loan-id uint) (height uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v2-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v2-0 get-pool-read token-id))
    (payment (get-payment token-id (get loan-amount loan) (get payment-period loan) (get apr loan) height (get next-payment loan) caller)))
    payment))

(define-read-only (get-current-loan-payment (loan-id uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v2-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v2-0 get-pool-read token-id))
    (payment (get-payment token-id (get loan-amount loan) (get payment-period loan) (get apr loan) burn-block-height (get next-payment loan) caller)))
    payment))

(define-read-only (get-early-repayment-amount (loan-id uint) (caller principal))
  (let (
    (loan (contract-call? .loan-v1-0 get-loan-read loan-id))
    (token-id (contract-call? .pool-v2-0 get-loan-pool-id-read loan-id))
    (pool (contract-call? .pool-v2-0 get-pool-read token-id))
    (payment (get-payment token-id (get loan-amount loan) (get payment-period loan) (get apr loan) burn-block-height (get next-payment loan) caller))
    (early-repayment (get-prc payment (get-early-repayment-fee token-id))))
    (+ payment early-repayment (get loan-amount loan))))

(define-read-only (get-prc (amount uint) (bp uint))
  (/ (* bp amount) DEN))

;; @desc distribute xbtc rewards to the LPers, CPers and delegate
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param treasury: treasury contract address
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param token-id: id of the pool that the pool delegate controls
;; @param lp-portion: portion of funds going to LPers
;; @param cover-pool: sp contract that holds zest rewards distributed for liquidity providers
;; @param cover-enabled: if cover is enabled
;; @param cover-portion: if cover enabled, portion going to CPers
;; @param delegate-portion: portion of funds going to the pool delegate
;; @param delegate: pool delegate principal
;; @param xbtc: SIP-010 for xbtc
;; @returns (response true uint)
(define-private (distribute-xbtc
  (l-v <lv>)
  (treasury principal)
  (lp <sip-010>)
  (cp-rewards-token <dt>)
  (token-id uint)
  (lp-portion uint)
  (cover-pool principal)
  (cover-enabled bool)
  (cover-portion uint)
  (delegate-portion uint)
  (delegate principal)
  (xbtc <ft>))
  (let (
    (globals (contract-call? .globals get-globals)))
    (asserts! (is-eq treasury (get treasury globals)) ERR_INVALID_TREASURY)

    ;; to delegate
    (print { type: "delegate-token-rewards", payload: { key: { recipient: delegate, token-id: token-id }, data: { delegate-rewards-earned: delegate-portion }} })
    (try! (as-contract (contract-call? xbtc transfer delegate-portion tx-sender delegate none)))
    
    (if cover-enabled
      (begin
        ;; to LPs
        (print { type: "lp-token-rewards", payload: { key: { token-id: token-id }, data: { lp-rewards-earned: lp-portion }} })
        (try! (as-contract (contract-call? l-v add-asset xbtc lp-portion token-id tx-sender)))
        ;; to Cover
        (print { type: "cp-rewards-token-rewards", payload: { key: { token-id: token-id }, data: { cp-rewards-earned: cover-portion }} })
        (try! (contract-call? cp-rewards-token add-rewards token-id cover-portion))
        (try! (as-contract (contract-call? l-v add-asset xbtc cover-portion token-id tx-sender))))
      (let (
        (total-portion (+ cover-portion lp-portion)))
        (print { type: "lp-token-rewards", payload: { key: { token-id: token-id }, data: { lp-rewards-earned: total-portion }} })
        (try! (as-contract (contract-call? l-v add-asset xbtc total-portion token-id tx-sender)))
      )
    )

    (ok true)))

;; @desc LPers' and CPers' rewards are stored for when it's their time to claim rewards
;;  Pool delegate receives Zest rewards according to their share
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param token-id: id of the pool that the pool delegate controls
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param lp-portion: portion of funds going to LPers
;; @param staking-pool: sp contract that holds zest rewards distributed for liquidity providers
;; @param cover-portion: portion of funds going to CPers
;; @param delegate: pool delegate address
;; @param delegate-portion: portion of funds going to the pool delegate
;; @returns (response true uint)
(define-private (distribute-zest
  (lp <sip-010>)
  (token-id uint)
  (cp <cp-token>)
  (zd-token <dt>)
  (lp-portion uint)
  (staking-pool principal)
  (cover-portion uint)
  (delegate principal)
  (delegate-portion uint))
  (let (
    (cover-pool (contract-call? .cover-pool-v1-0 get-pool-read token-id)))
    (try! (contract-call? .zge000-governance-token edg-mint-many (list { amount: delegate-portion, recipient: delegate })))
    (print { type: "delegate-zest-rewards", payload: { key: { delegate: delegate, token-id: token-id }, data: { rewards-earned: delegate-portion }} })
    (print { type: "zd-token-zest-rewards", payload: { key: { token-id: token-id }, data: { rewards-earned: lp-portion }} })
    (try! (contract-call? zd-token add-rewards token-id lp-portion))

    (if (get available cover-pool)
      (begin
        (print { type: "cp-token-zest-rewards", payload: { key: { token-id: token-id }, data: { rewards-earned: cover-portion }} })
        (try! (contract-call? cp add-rewards token-id cover-portion)))
      u0)
    (ok true)))

;; -- token-id -> late-fee
(define-map late-fee uint uint)

;; @desc set late fee
;; @param fee: new late fee in BP
;; @returns (response true uint)
(define-public (set-late-fee (token-id uint) (fee uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (asserts! (not (contract-call? .pool-v2-0 is-ready token-id)) ERR_PARAM_LOCKED)
    (print { type: "set-late-fee-payment-fixed", payload: { token-id: token-id, fee: fee } })
    (ok (map-set late-fee token-id fee))))

(define-read-only (get-late-fee (token-id uint))
  (default-to u10 (map-get? late-fee token-id)))

;; -- token-id -> early-repayment-fee
(define-map early-repayment-fee uint uint)

;; @desc set early repayment fee
;; @param fee: new early repayment fee in BP
;; @returns (response true uint)
(define-public (set-early-repayment-fee (token-id uint) (fee uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (asserts! (not (contract-call? .pool-v2-0 is-ready token-id)) ERR_PARAM_LOCKED)
    (print { type: "set-early-repayment-fee-payment-fixed", payload: { token-id: token-id, early-repayment-fee: fee } })
    (ok (map-set early-repayment-fee token-id fee))))

(define-read-only (get-early-repayment-fee (token-id uint))
  (default-to u10 (map-get? early-repayment-fee token-id)))

;; -- ownable trait
(define-data-var contract-owner principal tx-sender)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-payment-fixed", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

;; -- approved
(define-read-only (is-approved-contract (contract principal))
  (if (contract-call? .globals is-loan-contract contract-caller) (ok true) ERR_UNAUTHORIZED))

;; -- Extension callback
(define-public (callback (sender principal) (memo (buff 34)))
	(ok true))

;; ERROR START 5000
(define-constant ERR_UNAUTHORIZED (err u5000))
(define-constant ERR_INVALID_TREASURY (err u5001))
(define-constant ERR_NOT_ENOUGH_PAID (err u5002))
(define-constant ERR_INVALID_PAYMENT (err u5003))
(define-constant ERR_INVALID_SWAP (err u5004))
(define-constant ERR_NOT_ENOUGH_REPAID (err u5005))
(define-constant ERR_INVALID_LV (err u5006))
(define-constant ERR_PARAM_LOCKED (err u5007))
(define-constant ERR_PANIC (err u5008))
