(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(define-data-var last-loan-id uint u0)

(define-constant INIT 0x00)
(define-constant ACTIVE 0x01)
(define-constant INACTIVE 0x02)
(define-constant MATURED 0x03)
(define-constant LIQUIDATED 0x04)
(define-constant EXPIRED 0x05)

(define-constant ONE_DAY u144)

(define-constant BP_PRC u10000)

(define-map loans uint
  {
    status: (buff 1),
    borrower: principal,
    loan-amount: uint,
    coll-ratio: uint, ;; ratio in BP
    coll-token: principal,
    next-payment: uint,
    apr: uint, ;; apr in basis points, 1 BP = 1 / 10_000
    payment-period: uint,
    remaining-payments: uint,
    coll-vault: principal,
    funding-vault: principal,
    created: uint }) ;; time in blocks (10 minutes)


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
  (token-id uint)
  (loan-amount uint)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal)
  )
  (let (
    (last-id (var-get last-loan-id))
    (globals (contract-call? .globals get-globals))
  )
    (try! (can-borrow tx-sender))
    (try! (is-pool))
    (asserts! (contract-call? .globals is-funding-vault funding-vault) ERR_INVALID_FV)
    (asserts! (contract-call? .globals is-coll-vault coll-vault) ERR_INVALID_CV)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-token)) ERR_INVALID_COLL)

    (asserts! (> payment-period u0) ERR_INVALID_TIME)
    (asserts! (is-eq u0 (mod maturity-length payment-period)) ERR_INVALID_TIME)
    (asserts! (> loan-amount u0) ERR_INVALID_LOAN_AMT)
    
    (map-set loans last-id
      {
        status: INIT,
        borrower: tx-sender,
        loan-amount: loan-amount,
        coll-ratio: coll-ratio,
        coll-token: (contract-of coll-token),
        next-payment: u0,
        apr: apr,
        payment-period: payment-period,
        remaining-payments: (/ maturity-length payment-period),
        coll-vault: coll-vault,
        funding-vault: funding-vault,
        created: burn-block-height })
    (var-set last-loan-id (+ u1 last-id))
    (ok last-id)
  )
)

;; Get state of the a loan
;;
;; @returns the state of the loand with id of loan-id
;; @param loan-id: id of the loan
(define-public (get-loan (loan-id uint))
  (ok (unwrap! (map-get? loans loan-id) ERR_INVALID_LOAN_ID))
)

(define-read-only (get-loan-read (loan-id uint))
  (unwrap-panic (map-get? loans loan-id))
)

(define-read-only (get-last-loan-id)
  (var-get last-loan-id)
)

;; called by the pool to confirm that the values are valid
;; assumes pool has sent the funds to the funding vault
;;
;; @restricted pool
;; @returns true
;;
;; @param loan-id: id of loan being funded
;; @param amount: amount the loan is being funded for
(define-public (fund-loan (loan-id uint) (amount uint))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
  )
    (try! (is-pool))
    (asserts! (is-eq INIT (get status loan)) ERR_INVALID_STATUS)
    (asserts! (is-eq amount (get loan-amount loan)) ERR_NOT_AGREED_AMOUNT)
    (asserts! (<= (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_EXPIRED)

    (ok true)
  )
)

;; reverse the effects of fund-loan
;;
;; @restricted pool
;; @returns loan amount
;;
;; @param loan-id: id of loan being funded
;; @param amount: amount the loan is being funded for
(define-public (unwind (loan-id uint) (amount uint))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
  )
    (try! (is-pool))
    (asserts! (is-eq INIT (get status loan)) ERR_INVALID_STATUS)
    (asserts! (>= amount (get loan-amount loan)) ERR_NOT_AGREED_AMOUNT)
    (asserts! (> (- burn-block-height (get created loan)) (get funding-period globals)) ERR_FUNDING_IN_PROGRESS)
    
    (map-set loans loan-id (merge loan { status: EXPIRED }))
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
(define-public (drawdown (loan-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (lv principal) (lp-token <lp-token>) (token-id uint) (pool-delegate principal) (delegate-fee uint) (xbtc <ft>))
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
  )
    (try! (is-pool))
    (asserts! (is-eq (get borrower loan) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (< (- burn-block-height (get created loan)) funding-period) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq (get coll-token loan) (contract-of coll-token)) ERR_INVALID_COLL)
    (asserts! (is-eq (get funding-vault loan) (contract-of fv)) ERR_INVALID_FV)
    (asserts! (is-eq (get coll-vault loan) (contract-of coll-vault)) ERR_INVALID_CV)

    (if (> coll-ratio u0)
      (let (
        (coll-amount (/ (* coll-ratio loan-amount) u10000))
      )
        ;; borrower sends funds to collateral vault
        (try! (send-collateral coll-token coll-vault coll-amount loan-id))
        true
      )
      false
    )
    (print { delegate-portion: delegate-portion, borrow-amount: borrow-amount })
    (print { treasury-amount: treasury-portion, lp-portion: lp-portion })

    (try! (contract-call? fv transfer lp-portion lv xbtc))
    (try! (contract-call? lp-token add-rewards token-id lp-portion))
    (try! (contract-call? fv transfer delegate-portion pool-delegate xbtc))
    (try! (contract-call? fv transfer treasury-portion (get treasury globals) xbtc))
    ;; for Magic Protocol
    (try! (contract-call? fv transfer borrow-amount (get supplier-interface globals) xbtc))

    (map-set loans loan-id (merge loan { status: ACTIVE, next-payment: (+ burn-block-height (get payment-period loan)) }))

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
(define-public (make-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (token-id uint) (cp-token <lp-token>) (zd-token <dt>) (swap-router <swap>) (amount uint) (xbtc <ft>))
  (let (
    (done (try! (contract-call? xbtc transfer amount tx-sender (contract-of payment) none)))
    (loan (try! (get-loan loan-id)))
    (payment-response (try! (contract-call? payment make-next-payment lp-token token-id cp-token zd-token swap-router height loan-id xbtc)))
  )
    (try! (is-supplier-interface))
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
    (asserts! (>= amount (get reward payment-response)) ERR_NOT_ENOUGH_PAID)

    (let (
      (remaining-payments (get remaining-payments loan))
      (updated-loan
        (if (is-eq remaining-payments u1)
          (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED})
          (merge loan { remaining-payments: (- remaining-payments u1), next-payment: (+ (get next-payment loan) (get payment-period loan)) })
        ))
    )
      (map-set loans loan-id updated-loan)
    )

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
(define-public (make-full-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (token-id uint) (cp-token <lp-token>) (zd-token <dt>) (swap-router <swap>) (amount uint) (xbtc <ft>))
  (begin
    (try! (as-contract (contract-call? xbtc transfer amount tx-sender (contract-of payment) none)))
    (let (
      (loan (try! (get-loan loan-id)))
      (payment-response (try! (contract-call? payment make-full-payment lp-token token-id cp-token zd-token swap-router height loan-id xbtc)))
      (updated-loan (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED}))
    )
      (try! (is-supplier-interface))
      (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
      (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
      (asserts! (>= amount (+ (get reward payment-response) (get full-payment payment-response))) ERR_NOT_ENOUGH_PAID)

      (map-set loans loan-id updated-loan)
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
(define-public (liquidate (loan-id uint) (coll-vault <cv>) (coll-token <ft>) (recipient principal))
  (let (
    (loan (try! (get-loan loan-id)))
    (recovered (if (> (get coll-ratio loan) u0) (try! (withdraw-collateral coll-vault coll-token loan-id recipient)) u0))
    (globals (contract-call? .globals get-globals))
  )
    (try! (is-pool))
    (asserts! (is-eq (get status loan) ACTIVE) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_COLL)
    (asserts! (> burn-block-height (+ (get grace-period globals) (get next-payment loan))) ERR_LOAN_IN_PROGRESS)

    (map-set loans loan-id (merge loan { status: LIQUIDATED }))
    (ok { recovered-funds: recovered, loan-amount: (get loan-amount loan)})
  )
)

;; -- rollover section

(define-map rollover-progress uint
  {
    status: (buff 1),
    apr: uint,
    new-amount: uint,
    maturity-length: uint,
    payment-period: uint,
    coll-ratio: uint,
    coll-type: principal })

(define-constant REQUESTED 0x00)
(define-constant ACCEPTED 0x01)
(define-constant COMPLETED 0x02)

(define-public (get-rollover (loan-id uint))
  (ok (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN_ID))
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
(define-public (request-rollover (loan-id uint) (apr uint) (new-amount uint) (maturity-length uint) (payment-period uint) (coll-ratio uint) (coll-type <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
  )
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? rollover-progress loan-id)) ERR_ROLLOVER_EXISTS)
    (asserts! (is-eq u0 (mod maturity-length payment-period)) ERR_INVALID_TIME)
    (asserts! (contract-call? .globals is-coll-contract (contract-of coll-type)) ERR_INVALID_COLL)

    (map-set
      rollover-progress
      loan-id
      {
        status: REQUESTED,
        apr: apr,
        new-amount: new-amount,
        maturity-length: maturity-length,
        payment-period: payment-period,
        coll-ratio: coll-ratio,
        coll-type: (contract-of coll-type) })
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
(define-public (complete-rollover (loan-id uint) (coll-type <ft>) (cv <cv>) (fv <v>) (swap-router <swap>) (xbtc <ft>))
  (let (
    (loan (try! (get-loan loan-id)))
    (globals (contract-call? .globals get-globals))
    (rollover (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN_ID))
    (is-ok (asserts! (contract-call? .globals is-swap (contract-of swap-router)) ERR_INVALID_SWAP))
    (new-terms
      (merge loan
        {
          coll-ratio: (get coll-ratio rollover),
          coll-token: (get coll-type rollover),
          next-payment: (+ burn-block-height (get payment-period rollover)),
          apr: (+ burn-block-height (get payment-period rollover)),
          remaining-payments: (/ (get maturity-length rollover) (get payment-period rollover))
          }))
    
    (loan-coll (try! (contract-call? cv get-loan-coll loan-id)))
    (required-xbtc (/ (* (get coll-ratio rollover) (get loan-amount loan)) u10000))
    (coll-xbtc-eq (try! (contract-call? swap-router get-x-given-y xbtc coll-type required-xbtc)))
    (diff-coll (try! (contract-call? swap-router get-x-given-y xbtc coll-type (- required-xbtc coll-xbtc-eq))))
  )
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq ACCEPTED (get status rollover)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_COLL)
    (asserts! (is-eq (contract-of cv) (get coll-vault loan)) ERR_INVALID_CV)
    (asserts! (is-eq (contract-of fv) (get funding-vault loan)) ERR_INVALID_FV)

    (if (> coll-xbtc-eq required-xbtc)
      true
      (try! (contract-call? cv add-collateral coll-type diff-coll loan-id))
    )

    (if (> (get new-amount rollover) (get loan-amount loan))
      (try! (contract-call? fv transfer (- (get new-amount rollover) (get loan-amount loan)) (get supplier-interface globals) xbtc))
      false
    )
    
    (map-set loans loan-id new-terms)
    (map-delete rollover-progress loan-id)
    (ok true)
  )
)

;; called by the the pool delegate before completing the rollover process
;;
;; @restricted pool
;; @returns true
;;
;; @param loan-id: id of loan being paid for
(define-public (accept-rollover (loan-id uint))
  (let (
    (rollover (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN_ID))
    (loan (try! (get-loan loan-id)))
    (loan-amount (get loan-amount loan))
    (request-amount (get new-amount rollover))
  )
    (try! (is-pool))
    (asserts! (is-eq (get status rollover) REQUESTED) ERR_UNAUTHORIZED)

    (map-set rollover-progress loan-id (merge rollover { status: ACCEPTED }))
    (ok true)
  )
)

(define-private (send-collateral (coll-token <ft>) (coll-vault <cv>) (amount uint) (loan-id uint))
  (begin
    (contract-call? coll-vault store coll-token amount loan-id)
  )
)

(define-private (withdraw-collateral (coll-vault <cv>) (coll-token <ft>) (loan-id uint) (recipient principal))
  (begin
    (contract-call? coll-vault draw coll-token loan-id recipient)
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
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-data-var pool-contract principal tx-sender)

(define-read-only (get-pool-contract)
  (ok (var-get pool-contract))
)

(define-public (set-pool-contract (new-pool principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set pool-contract new-pool))
  )
)

(define-read-only (is-pool)
  (if (is-eq contract-caller (var-get pool-contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-constant DFT_PRECISION (pow u10 u5))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION)
)

;; -- onboarding users

(define-read-only (can-borrow (caller principal))
  (if (contract-call? .globals is-onboarded caller)
    (ok true)
    ERR_NOT_ONBOARDED
  )
)

(define-read-only (is-onboarded (caller principal))
  (contract-call? .globals is-onboarded caller)
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

(define-constant ERR_UNAUTHORIZED (err u1000))

(define-constant ERR_INVALID_FV (err u3000))
(define-constant ERR_INVALID_CV (err u3001))
(define-constant ERR_INVALID_COLL (err u3002))
(define-constant ERR_INVALID_TIME (err u3003))
(define-constant ERR_INVALID_LOAN_AMT (err u3004))
(define-constant ERR_INVALID_LOAN_ID (err u3005))
(define-constant ERR_FUNDING_EXPIRED (err u3006))
(define-constant ERR_INVALID_STATUS (err u3007))
(define-constant ERR_FUNDING_IN_PROGRESS (err u3008))
(define-constant ERR_NOT_ENOUGH_PAID (err u3009))
(define-constant ERR_INVALID_SWAP (err u3010))
(define-constant ERR_LOAN_IN_PROGRESS (err u3011))
(define-constant ERR_ROLLOVER_EXISTS (err u3012))
(define-constant ERR_NOT_AGREED_AMOUNT (err u3013))
(define-constant ERR_NOT_ONBOARDED (err u3014))

(var-set pool-contract .loan-v1-0)
