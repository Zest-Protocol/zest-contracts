(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait fv .funding-vault-trait.funding-vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait swap .swap-router-trait.swap-router-trait)


(define-constant INIT 0x00)
(define-constant FUNDED 0x01)
(define-constant AWAITING_DRAWDOWN 0x02)
(define-constant ACTIVE 0x03)
(define-constant INACTIVE 0x04)
(define-constant MATURED 0x05)
(define-constant LIQUIDATED 0x06)
(define-constant EXPIRED 0x07)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))

(define-constant BP_PRC u10000)

;; Borrower creates a loan from the pool contract
;;
;; @restricted pool & borrower
;; @returns the id of the loan created
;;
;; @param loan-amount: amount requested for the loan
;; @param coll-ratio: collateral-to-xbtc amount ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param apr: APR in BPS
;; @param maturity-length: time until maturity
;; @param payment-period: intervals at which payment is due
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param funding-vault: contract that holds funds before drawdown
(define-public (create-loan
  (loan-amount uint)
  (xbtc <ft>)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal)
  (borrower principal)
  )
  (let (
    (last-id (get-last-loan-id))
    (next-id (+ u1 last-id))
    (asset-contract (contract-of xbtc))
    (globals (contract-call? .globals get-globals))
    (data {
      status: INIT,
      borrower: borrower,
      loan-amount: loan-amount,
      coll-ratio: coll-ratio,
      coll-token: (contract-of coll-token),
      next-payment: u0,
      apr: apr,
      payment-period: payment-period,
      remaining-payments: (/ maturity-length payment-period),
      coll-vault: coll-vault,
      funding-vault: funding-vault,
      created: burn-block-height,
      asset: asset-contract
      })
  )
    (try! (caller-is-pool))
    (try! (can-borrow borrower))
    ;; (asserts! (contract-call? .globals is-funding-vault funding-vault) ERR_INVALID_FV)
    (asserts! (contract-call? .globals is-coll-vault coll-vault) ERR_INVALID_CV)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-token)) ERR_INVALID_COLL)

    (asserts! (> payment-period u0) ERR_INVALID_TIME)
    (asserts! (is-eq u0 (mod maturity-length payment-period)) ERR_INVALID_TIME)
    (asserts! (> loan-amount u0) ERR_INVALID_LOAN_AMT)
    
    (try! (contract-call? .loan-data create-loan last-id data))
    (try! (contract-call? .loan-data set-last-loan-id next-id))

    (ok last-id)
  )
)

;; Get state of the a loan
;;
;; @returns the state of the loand with id of loan-id
;; @param loan-id: id of the loan
(define-public (get-loan (loan-id uint))
  (contract-call? .loan-data get-loan loan-id)
)

(define-read-only (get-loan-read (loan-id uint))
  (contract-call? .loan-data get-loan-read loan-id)
)

(define-read-only (get-last-loan-id)
  (contract-call? .loan-data get-last-loan-id)
)

(define-read-only (next-payment-in (loan-id uint))
  (let (
    (next-payment (get next-payment (get-loan-read loan-id)))
    (current-height block-height)
  )
    (if (> current-height next-payment) u0 (- next-payment current-height))
  )
)

;; called by the pool to confirm that the values are valid
;; assumes pool has sent the funds to the funding vault
;;
;; @restricted pool
;; @returns true
;;
;; @param loan-id: id of loan being funded
;; @param amount: amount the loan is being funded for
(define-public (fund-loan (loan-id uint))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: FUNDED }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq INIT (get status loan)) ERR_INVALID_STATUS)
    ;; (asserts! (is-eq amount (get loan-amount loan)) ERR_NOT_AGREED_AMOUNT)
    (asserts! (<= (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_EXPIRED)

    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (ok (get loan-amount loan))
  )
)

;; reverse the effects of fund-loan
;;
;; @restricted pool
;; @returns loan amount
;;
;; @param loan-id: id of loan being funded
;; @param amount: amount the loan is being funded for
(define-public (unwind (loan-id uint) (fv <v>) (lv-contract principal) (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: EXPIRED }))

    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))

    ;; (funding-period (get funding-period globals))
    ;; (treasury-addr (get treasury globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
    (investor-portion (get-bp loan-amount (get investor-fee globals)))
    ;; (delegate-portion (get-bp investor-portion delegate-fee))
    ;; (lp-portion (- investor-portion delegate-portion))
    (borrow-amount (- loan-amount treasury-portion))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq FUNDED (get status loan)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of fv) (get funding-vault loan)) ERR_INVALID_FV)
    ;; (asserts! (>= amount (get loan-amount loan)) ERR_NOT_AGREED_AMOUNT)
    (asserts! (> (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_IN_PROGRESS)
    
    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (try! (contract-call? fv transfer loan-amount lv-contract xbtc))

    (ok (get loan-amount loan))
  )
)

;; Send funds to the supplier interface so it can be used to create an outbound-swap on Magic Bridge
;;
;; @restricted pool
;; @returns the amount borrowed
;;
;; @param loan-id: id of loan being funded
;; @param height: collateral-to-xbtc amount ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param lp-token: token that holds funds and distributes them
;; @param pool-delegate: pool delegate address
;; @param delegate-fee: delegate fees in BP
(define-public (drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <v>)
  (lv-principal principal)
  (lp-token <lp-token>)
  (token-id uint)
  (pool-delegate principal)
  (delegate-fee uint)
  (swap-router <swap>)
  (xbtc <ft>)
  (sender principal)
  )
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
    (globals (contract-call? .globals get-globals))
    (funding-period (get funding-period globals))
    (treasury-addr (get treasury globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
    (investor-portion (get-bp loan-amount (get investor-fee globals)))
    (delegate-portion (get-bp investor-portion delegate-fee))
    (lp-portion (- investor-portion delegate-portion))
    (borrow-amount (- loan-amount treasury-portion))
    (new-loan (merge loan { status: AWAITING_DRAWDOWN }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get borrower loan) sender) ERR_UNAUTHORIZED)
    (asserts! (< (- burn-block-height (get created loan)) funding-period) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (get funding-vault loan) (contract-of fv)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)
    (asserts! (is-eq (get status loan) FUNDED) ERR_INVALID_STATUS)

    (if (> coll-ratio u0)
      (let (
        (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc loan-amount)))
        (coll-amount (/ (* coll-equivalent coll-ratio) BP_PRC))
      )
        (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
        ;; not enough collateral
        (asserts! (> coll-amount u0) ERR_NOT_ENOUGH_COLLATERAL)
        ;; borrower sends funds to collateral vault
        (try! (send-collateral coll-vault coll-token coll-amount loan-id sender))
        true
      )
      false
    )

    ;; for Magic Protocol
    (try! (contract-call? fv transfer borrow-amount (get supplier-interface globals) xbtc))
    ;; (try! (contract-call? fv transfer (+ treasury-portion delegate-portion) (get funding-vault loan) xbtc))

    (try! (contract-call? .loan-data set-loan loan-id new-loan))


    (ok borrow-amount)
  )
)

(define-public (finalize-drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <v>)
  (lv-principal principal)
  (lp-token <lp-token>)
  (token-id uint)
  (pool-delegate principal)
  (delegate-fee uint)
  (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
    (globals (contract-call? .globals get-globals))
    (funding-period (get funding-period globals))
    (treasury-addr (get treasury globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
    (investor-portion (get-bp loan-amount (get investor-fee globals)))
    (delegate-portion (get-bp investor-portion delegate-fee))
    (lp-portion (- investor-portion delegate-portion))
    (borrow-amount (- loan-amount treasury-portion investor-portion))
    (new-loan (merge loan { status: ACTIVE, next-payment: (+ burn-block-height (get payment-period loan)) }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) AWAITING_DRAWDOWN) ERR_INVALID_STATUS)
    (asserts! (or (is-eq coll-ratio u0) (is-eq (get coll-token loan) (contract-of coll-token))) ERR_INVALID_COLL)
    (asserts! (is-eq (get funding-vault loan) (contract-of fv)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)
    
    ;; lp-rewards in liquidity-vault and add rewards
    
    ;; (try! (contract-call? lp-token add-rewards token-id lp-portion))
    ;; (try! (contract-call? fv transfer delegate-portion pool-delegate xbtc))
    (try! (contract-call? fv transfer treasury-portion (get treasury globals) xbtc))
    
    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (try! (contract-call? .read-data active-loans-plus))
    (try! (contract-call? .read-data add-active-loan-amount token-id borrow-amount))
    (try! (contract-call? .read-data add-delegate-btc-rewards-earned pool-delegate delegate-portion))


    (ok { borrower: (get borrower loan), borrow-amount:  borrow-amount })
  )
)

;; revert back to when loan was drawdown. can unwind afterwards
(define-public (cancel-drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (lv-principal principal)
  (lp-token <lp-token>)
  (token-id uint)
  (pool-delegate principal)
  (delegate-fee uint)
  (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
    (globals (contract-call? .globals get-globals))
    (funding-period (get funding-period globals))
    (treasury-addr (get treasury globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
    (investor-portion (get-bp loan-amount (get investor-fee globals)))
    (delegate-portion (get-bp investor-portion delegate-fee))
    (lp-portion (- investor-portion delegate-portion))
    (borrow-amount (- loan-amount treasury-portion))
    (new-loan (merge loan { status: FUNDED }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) AWAITING_DRAWDOWN) ERR_INVALID_STATUS)
    (asserts! (is-eq (get funding-vault loan) (contract-of fv)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)

    (if (> coll-ratio u0)
      ;; return collateral
      (begin
        (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
        (try! (contract-call? coll-vault draw coll-token loan-id contract-caller))
        true
      )
      false
    )
    
    ;; lp-rewards in liquidity-vault and add rewards
    ;; (try! (contract-call? fv transfer loan-amount lv-principal xbtc))

    (try! (as-contract (contract-call? fv add-asset xbtc borrow-amount loan-id tx-sender)))

    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (ok borrow-amount)
  )
)

;; funds are received from the supplier interface and distributed to LPs, Delegate and stakers
;;
;; @restricted bridge
;; @returns (respone { reward: uint, z-reward: uint, repayment: bool })
;;
;; @param loan-id: id of loan being paid for
;; @param height: height of the Bitcoin tx
;; @param payment: payment logic contract for verifying and distributing rewards
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param amount: amount that is being paid from the supplier interface
(define-public (make-payment
  (loan-id uint)
  (height uint)
  (payment <payment>)
  (lp-token <lp-token>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (done (try! (contract-call? xbtc transfer amount caller (contract-of payment) none)))
    (loan (try! (get-loan loan-id)))
    (payment-response (try! (contract-call? payment make-next-payment lp-token lv token-id cp-token cp-rewards-token zd-token swap-router height loan-id amount xbtc caller)))
  )
    (try! (is-supplier-interface))
    (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
    (asserts! (>= amount (get reward payment-response)) ERR_NOT_ENOUGH_PAID)
    ;; if repayment, assert amount being sent is greater than the total loan
    ;; (asserts! (if (get repayment payment-response) (> amount (+ (get reward payment-response) (get loan-amount loan))) true) (err u9999))

    (let (
      (remaining-payments (get remaining-payments loan))
      (new-loan
        (if (is-eq remaining-payments u1)
          (begin
            (try! (contract-call? .read-data active-loans-minus))
            (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED})
          )
          (merge loan { remaining-payments: (- remaining-payments u1), next-payment: (+ (get next-payment loan) (get payment-period loan)) })
        ))
    )
      (try! (contract-call? .loan-data set-loan loan-id new-loan))
    )

    ;; (try! (contract-call? .read-data add-pool-btc-rewards-earned token-id amount))
    (try! (contract-call? .read-data remove-active-loan-amount token-id amount))

    (ok payment-response)
  )
)

;; funds are received from the supplier interface and distributed to LPs, Delegate and stakers, the loan is fully paid back
;;
;; @restricted bridge
;; @returns (respone { reward: uint, z-reward: uint, full-payment: uint })
;;
;; @param loan-id: id of loan being paid for
;; @param height: height of the Bitcoin tx
;; @param payment: payment logic contract for verifying and distributing rewards
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param amount: amount that is being paid from the supplier interface
(define-public (make-full-payment
  (loan-id uint)
  (height uint)
  (payment <payment>)
  (lp-token <lp-token>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>) 
  (cp-rewards-token <dt>)
  (zd-token <dt>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (begin
    (let (
      (done (try! (contract-call? xbtc transfer amount caller (contract-of payment) none)))
      (loan (try! (get-loan loan-id)))
      (payment-response (try! (contract-call? payment make-full-payment lp-token lv token-id cp-token cp-rewards-token zd-token swap-router height loan-id amount xbtc caller)))
      (new-loan (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED}))
    )
      (try! (is-supplier-interface))
      (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
      (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
      (asserts! (>= amount (+ (get reward payment-response) (get full-payment payment-response))) ERR_NOT_ENOUGH_PAID)


      (try! (contract-call? .loan-data set-loan loan-id new-loan))

      ;; (try! (contract-call? .read-data add-pool-btc-rewards-earned token-id amount))
      (try! (contract-call? .read-data active-loans-minus))
      (try! (contract-call? .read-data remove-active-loan-amount token-id amount))


      (ok payment-response)
    )
  )
)

;; Pool Delegate liquidites loans that have their grace period expired. values are validated here and collateral is sent to recipient.
;;
;; @restricted pool
;; @returns (respone { recovered-funds: uint, loan-amount: uint})
;;
;; @param loan-id: id of loan being paid for
;; @param cv: collateral vault holding the collateral to be recovered
;; @param coll-token: the SIP-010 token being held for collateral
;; @param recipient: the recipient of the collateral (in pool-v1-0, it's the pool contract)
(define-public (liquidate (loan-id uint) (coll-vault <cv>) (coll-token <ft>) (swap-router <swap>) (xbtc <ft>) (recipient principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: LIQUIDATED }))
    (max-slippage (get max-slippage globals))
    (this-contract (as-contract tx-sender))
    (has-collateral (> (get coll-ratio loan) u0))
    (withdrawn-funds (if has-collateral (try! (withdraw-collateral coll-vault coll-token loan-id recipient)) u0))
    (xbtc-to-recover (if has-collateral (try! (contract-call? swap-router get-y-given-x coll-token xbtc withdrawn-funds)) u0))
    (min-xbtc-to-recover (/ (* xbtc-to-recover max-slippage) BP_PRC))
    (recovered-funds (if has-collateral (try! (contract-call? swap-router swap-x-for-y recipient coll-token xbtc withdrawn-funds (some min-xbtc-to-recover))) u0))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) ACTIVE) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_COLL)
    (asserts! (> burn-block-height (+ (get grace-period globals) (get next-payment loan))) ERR_LOAN_IN_PROGRESS)


    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (ok { recovered-funds: recovered-funds, loan-amount: (get loan-amount loan)})
  )
)

(define-public (liquidate-otc
  (loan-id uint)
  (coll-vault <cv>)
  (coll-token <ft>)
  (xbtc <ft>)
  (recipient principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (has-collateral (> (get coll-ratio loan) u0))
    (withdrawn-funds (if has-collateral (try! (withdraw-collateral coll-vault coll-token loan-id recipient)) u0))
  )
    (try! (caller-is-pool))
    (asserts! (can-liquidate loan-id) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_COLL)
    ;; (asserts! (> burn-block-height (+ (get grace-period globals) (get next-payment loan))) ERR_LOAN_IN_PROGRESS)


    (ok true)
  )
)

(define-read-only (can-liquidate (loan-id uint))
  (let (
    (loan (get-loan-read loan-id))
    (globals (contract-call? .globals get-globals))

  )
    (and
      (is-eq (get status loan) ACTIVE)
      (> burn-block-height (+ (get grace-period globals) (get next-payment loan)))
    )
  )
)

;; -- rollover section

(define-constant REQUESTED 0x00)
(define-constant ACCEPTED 0x01)
(define-constant READY 0x02)
(define-constant COMPLETED 0x03)

(define-public (get-rollover-progress (loan-id uint))
  (contract-call? .loan-data get-rollover-progress loan-id)
)

(define-read-only (get-rollover-progress-read (loan-id uint))
  (contract-call? .loan-data get-rollover-progress-read loan-id)
)

(define-read-only (get-rollover-progress-optional (loan-id uint))
  (contract-call? .loan-data get-rollover-progress-optional loan-id)
)

;; borrower requests for a modification to the loan agreement
;;
;; @restricted loan borrower
;; @returns (respone { recovered-funds: uint, loan-amount: uint})
;;
;; @param loan-id: id of loan being paid for
;; @param apr: new apr in BPS
;; @param new-amount: new loan amount requested
;; @param maturity-length: new time until maturity
;; @param payment-period: time between payments
;; @param coll-ratio: new collateral ratio
;; @param coll-type: new collateral type SIP-010 token
(define-public (request-rollover
  (loan-id uint)
  (apr (optional uint))
  (new-amount (optional uint))
  (maturity-length (optional uint))
  (payment-period (optional uint))
  (coll-ratio (optional uint))
  (coll-type <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (remaining-length (* (get payment-period loan) (get remaining-payments loan)))
    (loan-amount (get loan-amount loan))
    (new-amount-final (default-to (get loan-amount loan) new-amount))
    (new-rollover-progress {
      status: REQUESTED,
      apr: (default-to (get apr loan) apr),
      new-amount: new-amount-final,
      maturity-length: (default-to remaining-length maturity-length),
      payment-period: (default-to (get payment-period loan) payment-period),
      coll-ratio: (default-to (get coll-ratio loan) coll-ratio),
      coll-type: (contract-of coll-type),
      created-at: block-height,

      moved-collateral: 0,
      sent-funds: 0,
      ;; if new amount is smaller, there is residual to pay
      residual: (if (> loan-amount new-amount-final)
          (- loan-amount new-amount-final)
          u0
        )
      })
    (globals (contract-call? .globals get-globals))
    ;; can create a rollover request if funding period expired or if rollover-progress doesn't exist
    (can-create
      (match (get-rollover-progress-optional loan-id)
        rollover-data (< (- block-height (get created-at rollover-data)) (get funding-period globals))
        true)
    )
  )
    (asserts! (is-eq contract-caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! can-create ERR_UNABLE_TO_REQUEST)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-type)) ERR_INVALID_COLL)
    (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)


    ;; If Coll -> Coll
    ;; or Coll -> No Coll
    (if (or (and (> (get coll-ratio new-rollover-progress) u0) (> (get coll-ratio loan) u0))
      (and (is-eq (get coll-ratio new-rollover-progress) u0) (> (get coll-ratio loan) u0))
      )
      (asserts! (is-eq (get coll-token loan) (get coll-type new-rollover-progress)) ERR_DIFFERENT_COLL)
      false)

    (asserts! (is-eq u0 (mod (get maturity-length new-rollover-progress) (get payment-period new-rollover-progress))) ERR_INVALID_TIME)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))

    (ok true)
  )
)

(define-public (ready-rollover (loan-id uint) (sent-funds int))
  (let (
    (rollover (try! (get-rollover-progress loan-id)))
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (request-amount (get new-amount rollover))
    (new-rollover-progress (merge rollover { status: READY, sent-funds: sent-funds }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) REQUESTED) ERR_UNAUTHORIZED)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))

    (ok true)
  )
)

;; called by the borrower to restart the loan with the new terms
;;
;; @restricted loan borrower
;; @returns true
;;
;; @param loan-id: id of loan being paid for
;; @param coll-type: collateral type SIP-010 token in the new agreement
;; @param cv: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
(define-public (complete-rollover
  (loan-id uint)
  (coll-type <ft>)
  (cv <cv>)
  (fv <v>)
  (swap-router <swap>)
  (token-id uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
    (rollover (try! (get-rollover-progress loan-id)))
    (globals (contract-call? .globals get-globals))
    (funding-period (get funding-period globals))
    (valid-swap (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP))
    (pre-coll-ratio (get coll-ratio loan))
    (new-coll-ratio (get coll-ratio rollover))
    (new-rollover-progress (merge rollover { status: COMPLETED }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq READY (get status rollover)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of cv) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of fv) (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (is-eq (get residual rollover) u0) ERR_REMAINING_RESIDUAL)
    (asserts! (< (- block-height (get created-at rollover)) (get funding-period globals)) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_COLL)

    (if (is-eq pre-coll-ratio u0)
      (if (is-eq new-coll-ratio pre-coll-ratio)
        ;; No coll-ratio -> No coll-ratio
        (begin
          (print u1)
          (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
          u1
        )
        ;; No Coll-ratio -> Coll-ratio
        (let (
          (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
          (coll-amount (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC))
        )
          (asserts! (> coll-amount u0) ERR_NOT_ENOUGH_COLLATERAL)
          ;; the collateral contract in the loan does not have to be the same as the new collateral being used
          (try! (send-collateral cv coll-type coll-amount loan-id caller))
          (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int coll-amount) })))
          (print u2)
          u2
        )
      )
      (if (is-eq new-coll-ratio u0)
        ;; Coll-ratio -> No Coll-ratio
        (let (
          (prev-coll (get amount (try! (contract-call? cv get-loan-coll loan-id))))
        )
          (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_COLL)
          (print u3)
          (try! (remove-collateral cv coll-type prev-coll loan-id caller))
          (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int prev-coll)) })))
          u3
        )
        ;; Coll-ratio -> Yes Coll-ratio
        (if (> new-coll-ratio pre-coll-ratio)
          ;; Coll-ratio -> More Coll-ratio
          (let (
            (coll-equivalent (try! (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
            (new-coll (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC))
            (prev-coll (get amount (try! (contract-call? cv get-loan-coll loan-id))))
          )
            (asserts! (is-eq (contract-of coll-type) (get coll-token loan)) ERR_INVALID_COLL)
            (if (> new-coll prev-coll)
              (begin
                (print u4)
                (try! (add-collateral cv coll-type (- new-coll prev-coll) loan-id caller))
                (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int (- new-coll prev-coll)) })))
              )
              (if (is-eq (- prev-coll new-coll) u0)
                (begin
                  (print u5)
                  (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
                  false
                )
                ;; if (< new-coll prev-coll), return collateral
                (begin
                  (print u6)
                  (try! (remove-collateral cv coll-type (- prev-coll new-coll) loan-id caller))
                  (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int (- prev-coll new-coll))) })))
                )
              )
            )
            u3
          )
          ;; Coll-ratio -> Less coll-ratio
          (let (
            (coll-equivalent (try! (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
            (new-coll (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC))
            (prev-coll (get amount (try! (contract-call? cv get-loan-coll loan-id))))
          )
            (asserts! (is-eq (contract-of coll-type) (get coll-token loan)) ERR_INVALID_COLL)
            (if (> new-coll prev-coll)
              (begin
                (print u7)
                (try! (add-collateral cv coll-type (- new-coll prev-coll) loan-id caller))
                (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int (- new-coll prev-coll)) })))
              )
              (if (is-eq (- prev-coll new-coll) u0)
                (begin
                  (print u8)
                  (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
                  false
                )
                ;; if (< new-coll prev-coll), return collateral
                (begin
                  (print u9)
                  (try! (remove-collateral cv coll-type (- prev-coll new-coll) loan-id caller))
                  (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int (- prev-coll new-coll))) })))
                )
              )
            )
            u4
          )
        )
      )
    )

    ;; (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))

    (if (> (get new-amount rollover) loan-amount)
      (let (
        (new-amount (- (get new-amount rollover) loan-amount))
        (treasury-portion (get-bp new-amount (get treasury-fee globals)))
        (borrow-amount (- new-amount treasury-portion))
      )
        (try! (contract-call? fv transfer borrow-amount (get supplier-interface globals) xbtc))
        (try! (contract-call? .loan-data set-rollover-progress loan-id (merge (unwrap-panic (get-rollover-progress loan-id)) { sent-funds: (to-int borrow-amount) })))
        (ok borrow-amount)
      )
      ;; new and previous amount is same or lower so no need to drawdown
      (let (
        (new-terms (merge loan {
          coll-ratio: (get coll-ratio rollover),
          coll-token: (get coll-type rollover),
          next-payment: (+ burn-block-height (get payment-period rollover)),
          apr: (get apr rollover),
          payment-period: (get payment-period rollover),
          remaining-payments: (/ (get maturity-length rollover) (get payment-period rollover)) }))
      )
        (try! (contract-call? .loan-data set-loan loan-id new-terms))
        (try! (contract-call? .loan-data delete-rollover-progress loan-id))
        (ok u0)
      )
    )
  )
)

(define-public (finalize-rollover
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <v>)
  (token-id uint)
  (xbtc <ft>)
  )
  (let (
    (rollover (try! (get-rollover-progress loan-id)))
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (request-amount (get new-amount rollover))
    (new-amount (- (get new-amount rollover) loan-amount))
    (globals (contract-call? .globals get-globals))
    (treasury-portion (get-bp new-amount (get treasury-fee globals)))
    (treasury-addr (get treasury globals))
    (new-terms
      (merge loan
        {
          loan-amount: request-amount,
          coll-ratio: (get coll-ratio rollover),
          coll-token: (get coll-type rollover),
          next-payment: (+ burn-block-height (get payment-period rollover)),
          apr: (get apr rollover),
          remaining-payments: (/ (get maturity-length rollover) (get payment-period rollover))
          }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) COMPLETED) ERR_UNAUTHORIZED)
    (asserts! (< (- block-height (get created-at rollover)) (get funding-period globals)) ERR_FUNDING_EXPIRED)

    (try! (contract-call? fv transfer treasury-portion treasury-addr xbtc))

    
    (try! (contract-call? .loan-data delete-rollover-progress loan-id))
    (try! (contract-call? .loan-data set-loan loan-id new-terms))

    (ok true)
  )
)

(define-public (cancel-rollover
  (loan-id uint)
  (coll-token <ft>)
  (cv <cv>)
  (fv <fv>)
  (lv-principal principal)
  (lp-token <lp-token>)
  (token-id uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (rollover (try! (get-rollover-progress loan-id)))
    (new-amount (get new-amount rollover))
    (prev-amount (get loan-amount loan))
    (sent-funds (get sent-funds rollover))
    (moved-collateral (get moved-collateral rollover))
    (globals (contract-call? .globals get-globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) COMPLETED) ERR_INVALID_STATUS)
    (asserts! (is-eq (get funding-vault loan) (contract-of fv)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of cv)) ERR_INVALID_CV)

    (if (> new-amount prev-amount)
      (begin
        (if (> moved-collateral 0)
          (try! (remove-collateral cv coll-token (to-uint moved-collateral) loan-id caller))
          (if (is-eq moved-collateral 0)
            false
            (try! (add-collateral cv coll-token (to-uint (- moved-collateral)) loan-id caller))
          )
        )
        true
      )
      false
    )


    (if (> sent-funds 0)
      (begin
        (try! (as-contract (contract-call? fv add-asset xbtc (to-uint sent-funds) loan-id tx-sender)))
        true
      )
      (begin
        (try! (as-contract (contract-call? xbtc transfer (to-uint (- sent-funds)) tx-sender caller none)))
        false
      )
    )

    (try! (contract-call? .loan-data set-rollover-progress loan-id (merge rollover { sent-funds: 0, status: READY, moved-collateral: 0 })))
    (ok sent-funds)
  )
)

(define-public (make-residual-payment
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (amount uint)
  (xbtc <ft>)
  )
  (let (
    (loan (try! (get-loan loan-id)))
    (rollover (try! (get-rollover-progress loan-id)))
    (residual (get residual rollover))
    (remaining (if (>= amount residual)
      u0
      (- amount residual)
    ))
    (new-rollover-progress (merge rollover { residual: remaining, sent-funds: (- (to-int amount)) }))
  )
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) READY) ERR_UNAUTHORIZED)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress)) 
    (ok true)
  )
)

(define-public (withdraw-collateral-loan (loan-id uint) (amount uint) (swap-router <swap>) (coll-token <ft>) (xbtc <ft>) (cv <cv>))
  (let (
    (loan (try! (get-loan loan-id)))
    (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc (get loan-amount loan))))
    (required-coll-amount (/ (* coll-equivalent (get coll-ratio loan)) BP_PRC))
    (sent-coll (get amount (try! (contract-call? cv get-loan-coll loan-id))))
  )
    (asserts! (> sent-coll required-coll-amount) ERR_NOT_ENOUGH_COLLATERAL)
    (asserts! (is-eq (get borrower loan) contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_SWAP_INVALID)
    (asserts! (is-eq (get coll-vault loan) (contract-of cv)) ERR_INVALID_CV)
    (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (is-eq (get asset loan) (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (>= (- sent-coll required-coll-amount) amount) ERR_WITHDRAWING_ABOVE_LIMIT)

    (try! (remove-collateral cv coll-token amount loan-id (get borrower loan)))

    (ok (- sent-coll required-coll-amount))
  )
)

(define-public (get-withdrawable-collateral (loan-id uint) (amount uint) (swap-router <swap>) (coll-token <ft>) (xbtc <ft>) (cv <cv>))
  (let (
    (loan (try! (get-loan loan-id)))
    (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc (get loan-amount loan))))
    (required-coll-amount (/ (* coll-equivalent (get coll-ratio loan)) BP_PRC))
    (sent-coll (get amount (try! (contract-call? cv get-loan-coll loan-id))))
  )
    (asserts! (> sent-coll required-coll-amount) ERR_NOT_ENOUGH_COLLATERAL)
    (asserts! (is-eq (get borrower loan) contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_SWAP_INVALID)
    (asserts! (is-eq (get coll-vault loan) (contract-of cv)) ERR_INVALID_CV)
    (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (is-eq (get asset loan) (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (>= (- sent-coll required-coll-amount) amount) ERR_WITHDRAWING_ABOVE_LIMIT)

    (ok (- sent-coll required-coll-amount))
  )
)

(define-private (send-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (sender principal))
  (begin
    (contract-call? coll-vault store coll-token amount loan-id sender)
  )
)

(define-private (add-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (sender principal))
  (begin
    (contract-call? coll-vault add-collateral coll-token amount loan-id sender)
  )
)

(define-private (withdraw-collateral (coll-vault <cv>) (coll-token <ft>) (loan-id uint) (recipient principal))
  (begin
    (contract-call? coll-vault draw coll-token loan-id recipient)
  )
)

(define-private (remove-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (recipient principal))
  (begin
    (contract-call? coll-vault remove-collateral coll-token amount loan-id recipient)
  )
)

(define-read-only (get-bp (amount uint) (bp uint))
  (/ (* amount bp) BP_PRC)
)

;; --- ownable trait

;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-loan-v1-0", payload: { owner: owner } })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-read-only (get-pool-contract)
  (contract-call? .globals get-pool-contract)
)

(define-read-only (caller-is-pool)
  (if (contract-call? .globals is-pool-contract contract-caller) (ok true) ERR_UNAUTHORIZED)
)

(define-constant DFT_PRECISION (pow u10 u5))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION)
)

;; -- onboarding users

(define-read-only (can-borrow (caller principal))
  (if (contract-call? .globals is-onboarded-user-read caller)
    (ok true)
    ERR_NOT_ONBOARDED
  )
)

(define-read-only (is-onboarded (caller principal))
  (contract-call? .globals is-onboarded-user-read caller)
)


;; bridge access
(define-public (is-supplier-interface)
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (if (is-eq contract-caller (get supplier-interface globals))
      (ok true)
      ERR_UNAUTHORIZED
    )
  )
)

;; ERROR START 4000
(define-constant ERR_UNAUTHORIZED (err u4000))

(define-constant ERR_INVALID_FV (err u4001))
(define-constant ERR_INVALID_CV (err u4002))
(define-constant ERR_INVALID_COLL (err u4003))
(define-constant ERR_INVALID_TIME (err u4004))
(define-constant ERR_INVALID_LOAN_AMT (err u4005))
(define-constant ERR_INVALID_LOAN_ID (err u4006))
(define-constant ERR_FUNDING_EXPIRED (err u4007))
(define-constant ERR_INVALID_STATUS (err u4008))
(define-constant ERR_FUNDING_IN_PROGRESS (err u4009))
(define-constant ERR_NOT_ENOUGH_PAID (err u4010))
(define-constant ERR_INVALID_SWAP (err u4011))
(define-constant ERR_LOAN_IN_PROGRESS (err u4012))
(define-constant ERR_ROLLOVER_EXISTS (err u4013))
(define-constant ERR_NOT_AGREED_AMOUNT (err u4014))
(define-constant ERR_NOT_ONBOARDED (err u4015))
(define-constant ERR_UNABLE_TO_REQUEST (err u4016))
(define-constant ERR_NOT_ENOUGH_COLLATERAL (err u4017))
(define-constant ERR_DIFFERENT_COLL (err u4018))
(define-constant ERR_REMAINING_RESIDUAL (err u4019))
(define-constant ERR_SWAP_INVALID (err u4020))
(define-constant ERR_INVALID_ASSET (err u4021))
(define-constant ERR_WITHDRAWING_ABOVE_LIMIT (err u4022))
(define-constant ERR_INVALID_LV (err u4023))
