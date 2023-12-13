(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
;; (use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)

(use-trait ft .ft-trait.ft-trait)
(use-trait sip-010 .sip-010-trait.sip-010-trait)

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
(define-constant IMPAIRED 0x08)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant BP_PRC u10000)

;; amount moved while testing loan-id -> tested-amount
(define-map tested-amounts uint uint)

(define-private (set-tested-amount (loan-id uint) (amount uint))
  (begin
    (print { type: "set-tested-amounts", payload: { loan-id: loan-id, data: amount } })
    (map-set tested-amounts loan-id amount)))

(define-read-only (get-tested-amount (loan-id uint))
  (default-to u0 (map-get? tested-amounts loan-id)))

;; @desc Borrower creates a loan from the pool contract
;; @restricted pool & borrower
;; @param loan-amount: amount requested for the loan
;; @param xbtc: principal of xBTC contract
;; @param coll-ratio: collateral-to-xbtc ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param apr: APR in BPS
;; @param maturity-length: time until maturity
;; @param payment-period: intervals at which payment is due
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param funding-vault: contract that holds funds before drawdown
;; @param borrower: principal of the borrower
;; @returns the id of the loan created
(define-public (create-loan
  (loan principal)
  (loan-amount uint)
  (xbtc <ft>)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal)
  (borrower principal))
  (let (
    (last-id (get-last-loan-id))
    (next-id (+ u1 last-id))
    (asset-contract (contract-of xbtc))
    (globals (contract-call? .globals get-globals))
    (data {
      status: INIT,
      loan-contract: loan,
      borrower: borrower,
      loan-amount: loan-amount,
      coll-ratio: coll-ratio,
      coll-token: (contract-of coll-token),
      next-payment: u0,
      original-next-payment: u0,
      apr: apr,
      payment-period: payment-period,
      remaining-payments: (/ maturity-length payment-period),
      coll-vault: coll-vault,
      funding-vault: funding-vault,
      created: burn-block-height,
      asset: asset-contract,
      open-term: (is-eq maturity-length u0)
      }))
    (try! (caller-is-pool))
    (try! (can-borrow borrower))
    (asserts! (contract-call? .globals is-coll-vault coll-vault) ERR_INVALID_CV)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (> payment-period u0) ERR_INVALID_TIME)
    (asserts! (is-eq u0 (mod maturity-length payment-period)) ERR_INVALID_TIME)
    (asserts! (> loan-amount u0) ERR_INVALID_LOAN_AMT)
    
    (try! (contract-call? .loan-data create-loan last-id data))
    (try! (contract-call? .loan-data set-last-loan-id next-id))

    (ok last-id)))

(define-public (get-loan (loan-id uint))
  (contract-call? .loan-data get-loan loan-id))

(define-public (get-loan-pool-id (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id loan-id))

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id))

(define-read-only (get-loan-pool-id-read (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id-read loan-id))

(define-read-only (get-loan-read (loan-id uint))
  (contract-call? .loan-data get-loan-read loan-id))

(define-read-only (get-last-loan-id)
  (contract-call? .loan-data get-last-loan-id))

;; @desc gets next payment of a loan
;; @param loan-id: id of loan being queried
;; @returns Stacks block height at which next payment is in
(define-read-only (next-payment-in (loan-id uint))
  (let (
    (next-payment (get next-payment (get-loan-read loan-id)))
    (current-height block-height))
    (if (> current-height next-payment) u0 (- next-payment current-height))))

;; @desc called by the pool to validate loan status and update loan state
;; assumes pool has sent the funds to the funding vault
;; @restricted pool
;; @param loan-id: id of loan being funded
;; @returns true
(define-public (fund-loan (loan-id uint))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: FUNDED })))
    (try! (caller-is-pool))
    (asserts! (is-eq INIT (get status loan)) ERR_INVALID_STATUS)
    (asserts! (<= (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_EXPIRED)

    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok (get loan-amount loan))))

;; @desc reverse the effects of fund-loan
;; @restricted pool
;; @param token-id: pool associated to the affected loan
;; @param loan-id: id of affected loan
;; @param fv: funding vault address
;; @param lv-contract: liquidity vault to which funds are being returned
;; @param xbtc: SIP-010 xbtc token
;; @returns loan amount
(define-public (unwind (token-id uint) (loan-id uint) (f-v <fv>) (l-v <lv>) (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: EXPIRED }))

    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals)))
    (investor-portion (get-bp loan-amount (get investor-fee globals)))
    (borrow-amount (- loan-amount treasury-portion)))
    (try! (caller-is-pool))
    (asserts! (is-eq FUNDED (get status loan)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of f-v) (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (> (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_IN_PROGRESS)
    
    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (try! (contract-call? f-v remove-asset xbtc loan-amount loan-id (as-contract tx-sender)))
    (try! (as-contract (contract-call? l-v add-asset xbtc loan-amount token-id tx-sender)))

    (ok (get loan-amount loan))))

(define-constant TEST_AMOUNT (contract-call? .globals get-test-amount))
(define-constant MAX_TRIALS_AMOUNT (* TEST_AMOUNT u3))

(define-public (drawdown-verify
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (lp <sip-010>)
  (token-id uint)
  (pool-delegate principal)
  (delegate-fee uint)
  (swap-router <swap>)
  (xbtc <ft>)
  (sender principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (globals (contract-call? .globals get-globals))
    (funding-period (get funding-period globals))
    (total-sent-amount (+ TEST_AMOUNT (get-tested-amount loan-id))))
    (try! (caller-is-pool))
    (asserts! (is-eq (get borrower loan) sender) ERR_UNAUTHORIZED)
    (asserts! (< (- burn-block-height (get created loan)) funding-period) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (get funding-vault loan) (contract-of f-v)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)
    (asserts! (is-eq (get status loan) FUNDED) ERR_INVALID_STATUS)
    (asserts! (<= total-sent-amount MAX_TRIALS_AMOUNT) ERR_TOO_MANY_TRIALS)
    (asserts! (> loan-amount total-sent-amount) ERR_UNDERFLOW)

    (try! (contract-call? f-v remove-asset xbtc TEST_AMOUNT loan-id (get supplier-interface globals)))

    (set-tested-amount loan-id total-sent-amount)
    (ok TEST_AMOUNT)))

;; @desc Start drawdown process for a selected loan. Collateral is sent to the coll-vault
;; and xbtc funds are sent to the supplier-interface (for escrowing)
;; @restricted pool
;; @param loan-id: id of loan being funded
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param lv-principal: principal of the liquidity vault
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool associated where the funds are taken from
;; @param pool-delegate: pool delegate address
;; @param delegate-fee: delegate fees in BP
;; @param swap-router: logic for swapping assets
;; @param xbtc: SIP-010 xbtc token
;; @param sender: principal of account calling function
;; @returns the amount borrowed
(define-public (drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (lv-principal principal)
  (lp <sip-010>)
  (token-id uint)
  (pool-delegate principal)
  (delegate-fee uint)
  (swap-router <swap>)
  (xbtc <ft>)
  (sender principal))
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
    (tested-amount (get-tested-amount loan-id))
    (borrow-amount (- loan-amount treasury-portion tested-amount))
    (new-loan (merge loan { status: AWAITING_DRAWDOWN })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get borrower loan) sender) ERR_UNAUTHORIZED)
    (asserts! (< (- burn-block-height (get created loan)) funding-period) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (get funding-vault loan) (contract-of f-v)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)
    (asserts! (is-eq (get status loan) FUNDED) ERR_INVALID_STATUS)

    (if (> coll-ratio u0)
      (let (
        (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc loan-amount)))
        (coll-amount (/ (* coll-equivalent coll-ratio) BP_PRC)))
        (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
        (asserts! (> coll-amount u0) ERR_NOT_ENOUGH_COLLATERAL)
        (try! (send-collateral coll-vault coll-token coll-amount loan-id sender))
        true)
      false)

    ;; reset value

    ;; for Magic Protocol
    (try! (contract-call? f-v remove-asset xbtc borrow-amount loan-id (get supplier-interface globals)))
    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (ok borrow-amount)
  )
)

;; @desc Finalize drawdown process for a selected loan. sends treasury fee and update loan
;; to ACTIVE
;; @restricted pool
;; @param loan-id: id of loan being funded
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param lv-principal: principal of the liquidity vault
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool associated where the funds are taken from
;; @param pool-delegate: pool delegate address
;; @param delegate-fee: delegate fees in BP
;; @param xbtc: SIP-010 xbtc token
;; @returns (respose { borrower: principal, borrow-amount: uint })
(define-public (finalize-drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (lv-principal principal)
  (lp <sip-010>)
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
    (tested-amount (get-tested-amount loan-id))
    (borrow-amount (- loan-amount treasury-portion tested-amount))
    (new-loan (merge loan { status: ACTIVE, next-payment: (+ burn-block-height (get payment-period loan)) })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) AWAITING_DRAWDOWN) ERR_INVALID_STATUS)
    (asserts! (or (is-eq coll-ratio u0) (is-eq (get coll-token loan) (contract-of coll-token))) ERR_INVALID_COLL)
    (asserts! (is-eq (get funding-vault loan) (contract-of f-v)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)
    
    (try! (contract-call? f-v remove-asset xbtc treasury-portion loan-id (get treasury globals)))
    
    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (set-tested-amount loan-id u0)
    
    (print { type: "finalize-loan-drawdown", payload: { key: { loan-id: loan-id, token-id: token-id }, data: new-loan } })

    (ok { borrower: (get borrower loan), borrow-amount:  borrow-amount })))

;; @desc revert back to when loan was drawdown. can unwind afterwards
;; @restricted pool
;; @param loan-id: id of loan being funded
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param lv-principal: principal of the liquidity vault
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool associated where the funds are taken from
;; @param pool-delegate: pool delegate address
;; @param delegate-fee: delegate fees in BP
;; @param xbtc: SIP-010 xbtc token
;; @returns borrowed amount
(define-public (cancel-drawdown
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (lv-principal principal)
  (lp <sip-010>)
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
    (tested-amount (get-tested-amount loan-id))
    (borrow-amount (- loan-amount treasury-portion tested-amount))
    (new-loan (merge loan { status: FUNDED })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) AWAITING_DRAWDOWN) ERR_INVALID_STATUS)
    (asserts! (is-eq (get funding-vault loan) (contract-of f-v)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)

    (if (> coll-ratio u0)
      ;; return collateral
      (begin
        (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
        (try! (contract-call? coll-vault draw coll-token loan-id tx-sender))
        true)
      false)
    
    (try! (as-contract (contract-call? f-v add-asset xbtc borrow-amount loan-id tx-sender)))

    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok borrow-amount)
  )
)

(define-public (make-payment-verify
  (loan-id uint)
  (height uint)
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (done (try! (contract-call? xbtc transfer amount caller (as-contract tx-sender) none)))
    (loan (try! (get-loan loan-id)))
    (token-id (try! (get-loan-pool-id loan-id)))
    (total-tested-amount (+ amount (get-tested-amount loan-id)))
  )
    (try! (is-supplier-interface))
    (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
    (asserts! (<= total-tested-amount MAX_TRIALS_AMOUNT) ERR_INVALID_VERIFICATION_PAYMENT)

    (print { type: "make-payment-verify", payload: { key: { loan-id: loan-id, token-id: token-id }, data: loan, amount: amount } })

    ;; for payment testing
    (set-tested-amount loan-id total-tested-amount)

    (ok total-tested-amount)
  )
)

;; @desc funds are received from the supplier interface sent to the payment contract. If loan
;; is impaired, set back to active.
;; @restricted bridge
;; @param loan-id: id of loan being paid for
;; @param height: height of the Bitcoin tx
;; @param payment: payment logic contract for verifying and distributing rewards
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param lv: contract of the liquidity vault
;; @param token-id: pool associated where the funds are taken from
;; @param cp-token: cp contract that holds zest rewards distributed to CPers
;; @param cp-rewards-token: cp contract that holds xbtc rewards distributed to CPers
;; @param zd-token: zd contract that holds zest rewards distributed to liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param amount: amount that is being paid from the supplier interface
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of account making the payment
;; @returns (respone uint uint)
(define-public (make-payment
  (loan-id uint)
  (height uint)
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (tested-amount (get-tested-amount loan-id))
    (done
      (begin
        (try! (as-contract (contract-call? xbtc transfer amount tx-sender (contract-of pay) none)))
        (if (> tested-amount u0)
          (as-contract (try! (contract-call? xbtc transfer tested-amount tx-sender (contract-of pay) none)))
          true
        )))
    (loan (try! (get-loan loan-id)))
    (token-id (try! (get-loan-pool-id loan-id)))
    (payment-response (try! (contract-call? pay make-next-payment lp l-v token-id cp swap-router height loan-id (+ tested-amount amount) xbtc caller)))
    (amount-due (- (get reward payment-response) tested-amount))
    (remaining-payments (get remaining-payments loan))
    (impaired (is-eq IMPAIRED (get status loan)))
    (is-last-payment (or (and (is-eq (get status loan) IMPAIRED) (get open-term loan)) (is-eq remaining-payments u1)))
  )
    (try! (caller-is-pool))
    (asserts! (or (is-eq ACTIVE (get status loan)) impaired) ERR_INVALID_STATUS)
    (asserts! (>= amount amount-due) ERR_NOT_ENOUGH_PAID)
    ;; if repayment, assert amount being sent is greater than the total loan
    (let (
      (new-loan
        (if is-last-payment
          (begin
            (merge loan { next-payment: u0, remaining-payments: u0, original-next-payment: u0, status: MATURED }))
          (merge loan
            {
              remaining-payments: (if (get open-term loan) u0 (- remaining-payments u1)),
              next-payment: (+ (get next-payment loan) (get payment-period loan)),
              original-next-payment: u0,
              status: ACTIVE })
        )))
      (try! (contract-call? .loan-data set-loan loan-id new-loan))

      (print { type: "make-payment", payload: { key: { loan-id: loan-id, token-id: token-id }, data: new-loan, amount: amount } })
      ;; for payment testing
      (set-tested-amount loan-id u0)

      (ok (merge payment-response { loan-amount: (get loan-amount loan), has-remaining-payments: (not is-last-payment), is-impaired: impaired }))
    )
  )
)


;; @desc funds are received from the supplier interface and sent to the payment contract
;; @restricted bridge
;; @param loan-id: id of loan being paid for
;; @param height: height of the Bitcoin tx
;; @param payment: payment logic contract for verifying and distributing rewards
;; @param lp-token: lp contract that holds xbtc rewards distributed for liquidity providers
;; @param lv: contract of the liquidity vault
;; @param token-id: pool associated where the funds are taken from
;; @param cp-token: sp contract that holds zest rewards distributed for stakers
;; @param cp-rewards-token: cp contract that holds xbtc rewards distributed to CPers
;; @param zd-token: zd contract that holds zest rewards distributed for liquidity providers
;; @param swap-router: contract for swapping with DEX protocol
;; @param amount: amount that is being paid from the supplier interface
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of account making the payment
;; @returns (respone { reward: uint, z-reward: uint, full-payment: uint })
(define-public (make-full-payment
  (loan-id uint)
  (height uint)
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (tested-amount (get-tested-amount loan-id))
    (done
      (begin
        (try! (contract-call? xbtc transfer amount caller (contract-of pay) none))
        (if (> tested-amount u0)
          (as-contract (try! (contract-call? xbtc transfer tested-amount tx-sender (contract-of pay) none)))
          true)))
    (loan (try! (get-loan loan-id)))
    (token-id (try! (get-loan-pool-id loan-id)))
    (payment-response (try! (contract-call? pay make-full-payment lp l-v token-id cp swap-router height loan-id (+ tested-amount amount) xbtc caller)))
    (new-loan (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED}))
    (amount-due (- (+ (get reward payment-response) (get full-payment payment-response)) tested-amount)))
    (try! (is-supplier-interface))
    (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (or (is-eq ACTIVE (get status loan)) (is-eq IMPAIRED (get status loan))) ERR_INVALID_STATUS)
    (asserts! (>= amount amount-due) ERR_NOT_ENOUGH_PAID)

    (try! (contract-call? .loan-data set-loan loan-id new-loan))

    (set-tested-amount loan-id u0)

    (print { type: "make-repayment", payload: { key: { loan-id: loan-id, token-id: token-id }, data: loan, amount: amount } })
    (ok payment-response)))

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;;  Values are validated here and collateral is sent to recipient.
;; @restricted pool
;; @param loan-id: id of loan being paid for
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param coll-token: the SIP-010 token being held for collateral
;; @param swap-router: contract for swapping with DEX protocol
;; @param xbtc: SIP-010 xbtc token
;; @param recipient: the recipient of the collateral (in pool-v1-0, it's the pool contract)
;; @returns (respone { recovered-funds: uint, loan-amount: uint})
(define-public (liquidate (loan-id uint) (coll-vault <cv>) (coll-token <ft>) (swap-router <swap>) (xbtc <ft>) (recipient principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (pool-id (try! (get-loan-pool-id loan-id)))
    (pool (try! (get-pool pool-id)))
    (globals (contract-call? .globals get-globals))
    (new-loan (merge loan { status: LIQUIDATED }))
    (max-slippage (get max-slippage globals))
    (this-contract (as-contract tx-sender))
    (has-collateral (> (get coll-ratio loan) u0))
    (withdrawn-funds (if has-collateral (try! (withdraw-collateral coll-vault coll-token loan-id recipient)) u0))
    (xbtc-to-recover (if has-collateral (try! (contract-call? swap-router get-y-given-x coll-token xbtc withdrawn-funds)) u0))
    (min-xbtc-to-recover (/ (* xbtc-to-recover max-slippage) BP_PRC))
    (status (get status loan))
    (impaired (is-eq (get status loan) IMPAIRED))
  )
    (try! (caller-is-pool))
    (asserts!  (and
      (or (is-eq status ACTIVE) (is-eq status IMPAIRED))
      (> burn-block-height (+ (get grace-period globals) (get next-payment loan))))
      ERR_LOAN_IN_PROGRESS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_COLL)

    (if (is-eq (unwrap-panic (element-at? (get assets pool) u0)) (contract-of xbtc))
      (begin
        (try! (contract-call? .loan-data set-loan loan-id new-loan))
        (ok { recovered-funds: withdrawn-funds, loan-amount: (get loan-amount loan), impaired: impaired })
      )
      (let
        ((recovered-funds (if has-collateral (try! (contract-call? swap-router swap-x-for-y recipient coll-token xbtc withdrawn-funds (some min-xbtc-to-recover))) u0)))

        (try! (contract-call? .loan-data set-loan loan-id new-loan))
        (ok { recovered-funds: recovered-funds, loan-amount: (get loan-amount loan), impaired: impaired })
      )
    )
  )
)

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;;  Values are validated here and collateral is sent to recipient.
;; @restricted pool
;; @param loan-id: id of loan being paid for
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param coll-token: the SIP-010 token being held for collateral
;; @param xbtc: SIP-010 xbtc token
;; @param recipient: the recipient of the collateral
;; @returns (respone { recovered-funds: uint, loan-amount: uint})
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
    (new-loan (merge loan { status: LIQUIDATED }))
    (globals (contract-call? .globals get-globals)))
    (try! (caller-is-pool))
    (asserts! (can-liquidate loan-id) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_COLL)

    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok withdrawn-funds)))

;; @desc Can loan be liquidated based after next payment and grace-period has passed
;; @param loan-id: id of loan being paid for
;; @returns bool
(define-read-only (can-liquidate (loan-id uint))
  (let (
    (loan (get-loan-read loan-id))
    (globals (contract-call? .globals get-globals)))
    (and
      (is-eq (get status loan) ACTIVE)
      (> burn-block-height (+ (get grace-period globals) (get next-payment loan))))))

;; -- rollover section
(define-constant REQUESTED 0x00)
(define-constant ACCEPTED 0x01)
(define-constant READY 0x02)
(define-constant COMPLETED 0x03)

(define-public (get-rollover-progress (loan-id uint))
  (contract-call? .loan-data get-rollover-progress loan-id))

(define-read-only (get-rollover-progress-read (loan-id uint))
  (contract-call? .loan-data get-rollover-progress-read loan-id))

(define-read-only (get-rollover-progress-optional (loan-id uint))
  (contract-call? .loan-data get-rollover-progress-optional loan-id))


(define-public (impair-loan (loan-id uint))
  (let (
    (loan (get-loan-read loan-id))
    (prev-next-payment (get next-payment loan))
    (next-payment (if (> block-height prev-next-payment) prev-next-payment block-height))
    (new-loan (merge loan { status: IMPAIRED, next-payment: next-payment, original-next-payment: prev-next-payment })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) ACTIVE) ERR_INVALID_STATUS)
    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok new-loan)))

;; impairing an open term loan
(define-public (call-loan (loan-id uint))
  (let (
    (loan (get-loan-read loan-id))
    (prev-next-payment (get next-payment loan))
    (next-payment (if (> block-height prev-next-payment) prev-next-payment block-height))
    (new-loan (merge loan { status: IMPAIRED, next-payment: next-payment, original-next-payment: prev-next-payment, remaining-payments: u1 })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) ACTIVE) ERR_INVALID_STATUS)
    (asserts! (is-eq (get remaining-payments loan) u0) ERR_NOT_OPEN_TERM_LOAN)

    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok new-loan)))

(define-public (reverse-impaired-loan (loan-id uint))
  (let (
    (loan (get-loan-read loan-id))
    (new-loan (merge loan { status: ACTIVE, next-payment: (get original-next-payment loan), original-next-payment: u0 })))
    (asserts! (> (get original-next-payment loan) u0) ERR_INVALID_STATUS)
    (asserts! (is-eq (get status loan) IMPAIRED) ERR_INVALID_STATUS)

    (try! (caller-is-pool))
    (try! (contract-call? .loan-data set-loan loan-id new-loan))
    (ok new-loan)
  )
)

;; @desc borrower requests for a modification to the loan agreement
;; Can go from open term loan to regular maturing loan
;; Can go from maturing loan to open term loan
;; @restricted borrower
;; @param loan-id: id of loan being paid for
;; @param apr: new apr in BPS
;; @param new-amount: new loan amount requested
;; @param maturity-length: new time until maturity
;; @param payment-period: time between payments
;; @param coll-ratio: new collateral ratio
;; @param coll-type: new collateral type SIP-010 token
;; @returns bool
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
    (remaining-payments (if (and (get open-term loan) (is-none maturity-length)) u0 (get remaining-payments loan)))
    (remaining-length (* (get payment-period loan) remaining-payments))
    (loan-amount (get loan-amount loan))
    (new-amount-final (default-to (get loan-amount loan) new-amount))
    ;; TODO: handle open term loan to maturing loan
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
          u0)})
    (globals (contract-call? .globals get-globals))
    ;; can create a rollover request if funding period expired or if rollover-progress doesn't exist
    (can-create
      (match (get-rollover-progress-optional loan-id)
        rollover-data (< (- block-height (get created-at rollover-data)) (get funding-period globals))
        true)))
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! can-create ERR_UNABLE_TO_REQUEST)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-type)) ERR_INVALID_COLL)
    (asserts! (or (is-eq ACTIVE (get status loan)) (is-eq IMPAIRED (get status loan))) ERR_INVALID_STATUS)

    (asserts! (is-eq u0 (mod (get maturity-length new-rollover-progress) (get payment-period new-rollover-progress))) ERR_INVALID_TIME)
    ;; If Coll -> Coll
    ;; or Coll -> No Coll
    (if (or (and (> (get coll-ratio new-rollover-progress) u0) (> (get coll-ratio loan) u0))
          (and (is-eq (get coll-ratio new-rollover-progress) u0) (> (get coll-ratio loan) u0)))
      (asserts! (is-eq (get coll-token loan) (get coll-type new-rollover-progress)) ERR_DIFFERENT_COLL)
      false)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
    (ok true)))

;; @desc update rollover status to ready and 
;; @restricted pool
;; @param loan-id: id of loan being paid for
;; @param sent-funds: different between requested amout and previous loan amount
;; @returns (response bool uint)
(define-public (ready-rollover (loan-id uint) (sent-funds int))
  (let (
    (rollover (try! (get-rollover-progress loan-id)))
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (request-amount (get new-amount rollover))
    (new-rollover-progress (merge rollover { status: READY, sent-funds: sent-funds })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) REQUESTED) ERR_UNAUTHORIZED)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
    (ok true)))

;; @desc called by the borrower to restart the loan with the new terms
;; adds or removes collateral depending on whether more collateral or less is requested
;; send funds to the supplier interface for escrow or implement rollover
;; if no more funds are requested by the borrower
;; @restricted pool & borrower
;; @param loan-id: id of loan being paid for
;; @param coll-type: collateral type SIP-010 token in the new agreement
;; @param cv: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
;; @param token-id: pool associated to the affected loan
;; @param xbtc: SIP-010 xbtc token
;; @param caller: caller of the pool contract
;; @returns (response uint uint)
(define-public (complete-rollover
  (loan-id uint)
  (coll-type <ft>)
  (c-v <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc <ft>)
  (caller principal))
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
    (new-rollover-progress (merge rollover { status: COMPLETED })))
    (try! (caller-is-pool))
    (asserts! (is-eq caller (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq READY (get status rollover)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of c-v) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of f-v) (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (is-eq (get residual rollover) u0) ERR_REMAINING_RESIDUAL)
    (asserts! (< (- block-height (get created-at rollover)) (get funding-period globals)) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_COLL)

    (if (is-eq pre-coll-ratio u0)
      (if (is-eq new-coll-ratio pre-coll-ratio)
        ;; No coll-ratio -> No coll-ratio
        (begin
          (print u1)
          (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
          u1)
        ;; No Coll-ratio -> Coll-ratio
        (let (
          (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
          (coll-amount (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC)))
          (asserts! (> coll-amount u0) ERR_NOT_ENOUGH_COLLATERAL)
          ;; the collateral contract in the loan does not have to be the same as the new collateral being used
          (try! (send-collateral c-v coll-type coll-amount loan-id caller))
          (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int coll-amount) })))
          (print u2)
          u2))
      (if (is-eq new-coll-ratio u0)
        ;; Coll-ratio -> No Coll-ratio
        (let (
          (prev-coll (get amount (try! (contract-call? c-v get-loan-coll loan-id)))))
          (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_COLL)
          (print u3)
          (try! (remove-collateral c-v coll-type prev-coll loan-id caller))
          (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int prev-coll)) })))
          u3)
        ;; Coll-ratio -> Yes Coll-ratio
        (if (> new-coll-ratio pre-coll-ratio)
          ;; Coll-ratio -> More Coll-ratio
          (let (
            (coll-equivalent (try! (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
            (new-coll (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC))
            (prev-coll (get amount (try! (contract-call? c-v get-loan-coll loan-id)))))
            (asserts! (is-eq (contract-of coll-type) (get coll-token loan)) ERR_INVALID_COLL)
            (if (> new-coll prev-coll)
              (begin
                (print u4)
                (try! (add-collateral c-v coll-type (- new-coll prev-coll) loan-id caller))
                (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int (- new-coll prev-coll)) }))))
              (if (is-eq (- prev-coll new-coll) u0)
                (begin
                  (print u5)
                  (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
                  false)
                ;; if (< new-coll prev-coll), return collateral
                (begin
                  (print u6)
                  (try! (remove-collateral c-v coll-type (- prev-coll new-coll) loan-id caller))
                  (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int (- prev-coll new-coll))) }))))))
            u3)
          ;; Coll-ratio -> Less coll-ratio
          (let (
            (coll-equivalent (try! (contract-call? swap-router get-x-given-y coll-type xbtc (get new-amount rollover))))
            (new-coll (/ (* coll-equivalent (get coll-ratio rollover)) BP_PRC))
            (prev-coll (get amount (try! (contract-call? c-v get-loan-coll loan-id)))))
            (asserts! (is-eq (contract-of coll-type) (get coll-token loan)) ERR_INVALID_COLL)
            (if (> new-coll prev-coll)
              (begin
                (print u7)
                (try! (add-collateral c-v coll-type (- new-coll prev-coll) loan-id caller))
                (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (to-int (- new-coll prev-coll)) }))))
              (if (is-eq (- prev-coll new-coll) u0)
                (begin
                  (print u8)
                  (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress))
                  false)
                ;; if (< new-coll prev-coll), return collateral
                (begin
                  (print u9)
                  (try! (remove-collateral c-v coll-type (- prev-coll new-coll) loan-id caller))
                  (try! (contract-call? .loan-data set-rollover-progress loan-id (merge new-rollover-progress { moved-collateral: (- (to-int (- prev-coll new-coll))) }))))))
            u4))))

    (if (> (get new-amount rollover) loan-amount)
      (let (
        (new-amount (- (get new-amount rollover) loan-amount))
        (treasury-portion (get-bp new-amount (get treasury-fee globals)))
        (borrow-amount (- new-amount treasury-portion)))
        (try! (contract-call? f-v remove-asset xbtc borrow-amount loan-id (get supplier-interface globals)))
        (try! (contract-call? .loan-data set-rollover-progress loan-id (merge (unwrap-panic (get-rollover-progress loan-id)) { sent-funds: (to-int borrow-amount) })))
        (ok borrow-amount))
      ;; new and previous amount is same or lower so no need to drawdown
      (let (
        (new-terms (merge loan {
          coll-ratio: (get coll-ratio rollover),
          coll-token: (get coll-type rollover),
          next-payment: (+ burn-block-height (get payment-period rollover)),
          original-next-payment: u0,
          apr: (get apr rollover),
          payment-period: (get payment-period rollover),
          remaining-payments: (/ (get maturity-length rollover) (get payment-period rollover)),
          status: ACTIVE,
          loan-amount: (get new-amount rollover) })))
        (try! (contract-call? .loan-data set-loan loan-id new-terms))
        (try! (contract-call? .loan-data delete-rollover-progress loan-id))
        (ok u0)))))

;; @desc implement rollover when funds are sent to the magic-protocol
;; to escrow and finalize.
;; @param loan-id: id of loan being paid for
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param token-id: pool associated to the affected loan
;; @param xbtc: SIP-010 xbtc token
;; @returns (response true uint)
(define-public (finalize-rollover
  (loan-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (xbtc <ft>))
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
      (merge loan {
        loan-amount: request-amount,
        coll-ratio: (get coll-ratio rollover),
        coll-token: (get coll-type rollover),
        next-payment: (+ burn-block-height (get payment-period rollover)),
        apr: (get apr rollover),
        remaining-payments: (/ (get maturity-length rollover) (get payment-period rollover))
        })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) COMPLETED) ERR_UNAUTHORIZED)
    (asserts! (< (- block-height (get created-at rollover)) (get funding-period globals)) ERR_FUNDING_EXPIRED)

    (try! (contract-call? f-v remove-asset xbtc treasury-portion loan-id treasury-addr))
    
    (try! (contract-call? .loan-data delete-rollover-progress loan-id))
    (try! (contract-call? .loan-data set-loan loan-id new-terms))

    (ok true)))

;; @desc return collateral and funds to the liquidity vault
;; @param loan-id: id of loan being paid for
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param cv: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param lv-principal: principal of the liquidity vault
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool associated to the affected loan
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of account chosen by pool contract
;; @returns (response uint uint)
(define-public (cancel-rollover
  (loan-id uint)
  (coll-token <ft>)
  (c-v <cv>)
  (f-v <fv>)
  (lv-principal principal)
  (lp <sip-010>)
  (xbtc <ft>)
  (caller principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (rollover (try! (get-rollover-progress loan-id)))
    (new-amount (get new-amount rollover))
    (prev-amount (get loan-amount loan))
    (sent-funds (get sent-funds rollover))
    (moved-collateral (get moved-collateral rollover))
    (globals (contract-call? .globals get-globals))
    (treasury-portion (get-bp loan-amount (get treasury-fee globals))))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status loan) COMPLETED) ERR_INVALID_STATUS)
    (asserts! (is-eq (get funding-vault loan) (contract-of f-v)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of c-v)) ERR_INVALID_CV)

    (if (> new-amount prev-amount)
      (begin
        (if (> moved-collateral 0)
          (try! (remove-collateral c-v coll-token (to-uint moved-collateral) loan-id caller))
          (if (is-eq moved-collateral 0)
            false
            (try! (add-collateral c-v coll-token (to-uint (- moved-collateral)) loan-id caller))))
        true)
      false)

    (if (> sent-funds 0)
      (begin
        (try! (as-contract (contract-call? f-v add-asset xbtc (to-uint sent-funds) loan-id tx-sender)))
        true)
      (begin
        (try! (as-contract (contract-call? xbtc transfer (to-uint (- sent-funds)) tx-sender caller none)))
        false))

    (try! (contract-call? .loan-data set-rollover-progress loan-id (merge rollover { sent-funds: 0, status: READY, moved-collateral: 0 })))
    (ok sent-funds)))

;; @desc updates rollover-progress to reduce the amount owed
;; @param loan-id: id of loan being paid for
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool associated to the affected loan
;; @param amount: amount paid
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (make-residual-payment
  (loan-id uint)
  (lp <ft>)
  (amount uint)
  (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (rollover (try! (get-rollover-progress loan-id)))
    (residual (get residual rollover))
    (remaining (if (>= amount residual)
      u0
      (- amount residual)))
    (new-rollover-progress (merge rollover { residual: remaining, sent-funds: (- (to-int amount)) })))
    (try! (caller-is-pool))
    (asserts! (is-eq (get status rollover) READY) ERR_UNAUTHORIZED)

    (try! (contract-call? .loan-data set-rollover-progress loan-id new-rollover-progress)) 
    (ok true)))

;; @desc withdraw collateral available
;; @param loan-id: id of loan being paid for
;; @param amount: amount paid
;; @param swap-router: contract for swapping with DEX protocol
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param xbtc: SIP-010 xbtc token
;; @param cv: collateral vault holding the collateral to be recovered
;; @returns (response uint uint)
(define-public (withdraw-collateral-loan (loan-id uint) (amount uint) (swap-router <swap>) (coll-token <ft>) (xbtc <ft>) (c-v <cv>))
  (let (
    (loan (try! (get-loan loan-id)))
    (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc (get loan-amount loan))))
    (required-coll-amount (/ (* coll-equivalent (get coll-ratio loan)) BP_PRC))
    (sent-coll (get amount (try! (contract-call? c-v get-loan-coll loan-id)))))
    (asserts! (> sent-coll required-coll-amount) ERR_NOT_ENOUGH_COLLATERAL)
    (asserts! (is-eq (get borrower loan) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_SWAP_INVALID)
    (asserts! (is-eq (get coll-vault loan) (contract-of c-v)) ERR_INVALID_CV)
    (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (is-eq (get asset loan) (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (>= (- sent-coll required-coll-amount) amount) ERR_WITHDRAWING_ABOVE_LIMIT)

    (try! (remove-collateral c-v coll-token amount loan-id (get borrower loan)))

    (ok (- sent-coll required-coll-amount))))

;; @desc get amount of collateral that can be withdrawn
;; @param loan-id: id of loan being paid for
;; @param amount: amount paid
;; @param swap-router: contract for swapping with DEX protocol
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param xbtc: SIP-010 xbtc token
;; @param cv: collateral vault holding the collateral to be recovered
;; @returns (response uint uint)
(define-public (get-withdrawable-collateral (loan-id uint) (amount uint) (swap-router <swap>) (coll-token <ft>) (xbtc <ft>) (c-v <cv>))
  (let (
    (loan (try! (get-loan loan-id)))
    (coll-equivalent (unwrap-panic (contract-call? swap-router get-x-given-y coll-token xbtc (get loan-amount loan))))
    (required-coll-amount (/ (* coll-equivalent (get coll-ratio loan)) BP_PRC))
    (sent-coll (get amount (try! (contract-call? c-v get-loan-coll loan-id)))))
    (asserts! (> sent-coll required-coll-amount) ERR_NOT_ENOUGH_COLLATERAL)
    (asserts! (is-eq (get borrower loan) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_SWAP_INVALID)
    (asserts! (is-eq (get coll-vault loan) (contract-of c-v)) ERR_INVALID_CV)
    (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (is-eq (get asset loan) (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (>= (- sent-coll required-coll-amount) amount) ERR_WITHDRAWING_ABOVE_LIMIT)

    (ok (- sent-coll required-coll-amount))))

(define-private (send-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (sender principal))
  (begin (contract-call? coll-vault store coll-token amount loan-id sender)))

(define-private (add-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (sender principal))
  (begin (contract-call? coll-vault add-collateral coll-token amount loan-id sender)))

(define-private (withdraw-collateral (coll-vault <cv>) (coll-token <ft>) (loan-id uint) (recipient principal))
  (begin (contract-call? coll-vault draw coll-token loan-id recipient)))

(define-private (remove-collateral (coll-vault <cv>) (coll-token <ft>) (amount uint) (loan-id uint) (recipient principal))
  (begin (contract-call? coll-vault remove-collateral coll-token amount loan-id recipient)))

(define-read-only (get-bp (amount uint) (bp uint))
  (/ (* amount bp) BP_PRC))

;; --- ownable trait

(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-loan-v1-0", payload: { owner: owner } })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-read-only (get-pool-contract)
  (contract-call? .globals get-pool-contract))

(define-read-only (caller-is-pool)
  (if (contract-call? .globals is-pool-contract contract-caller) (ok true) ERR_UNAUTHORIZED))

(define-constant DFT_PRECISION (pow u10 u5))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION))

;; -- onboarding users
(define-read-only (can-borrow (caller principal))
  (if (contract-call? .globals is-onboarded-user-read caller)
    (ok true)
    ERR_NOT_ONBOARDED))

(define-read-only (is-onboarded (caller principal))
  (contract-call? .globals is-onboarded-user-read caller))


;; protocol access
(define-public (is-supplier-interface)
  (let (
    (globals (contract-call? .globals get-globals)))
    (if (is-eq contract-caller (get supplier-interface globals))
      (ok true)
      ERR_UNAUTHORIZED)))

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
(define-constant ERR_UNDERFLOW (err u4024))
(define-constant ERR_TOO_MANY_TRIALS (err u4025))
(define-constant ERR_INVALID_VERIFICATION_PAYMENT (err u4026))
(define-constant ERR_NOT_OPEN_TERM_LOAN (err u4027))
