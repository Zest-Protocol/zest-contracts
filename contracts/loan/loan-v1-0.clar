(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait loan-token .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait payment .payment-trait.payment-trait)

(define-data-var last-loan-id uint u0)

(define-constant INIT 0x00)
(define-constant ACTIVE 0x01)
(define-constant INACTIVE 0x02)
(define-constant MATURED 0x03)
(define-constant LIQUIDATED 0x04)
(define-constant EXPIRED 0x05)

(define-constant ONE_DAY u144)


;; to be GLOBAL
(define-constant GRACE_PERIOD (* ONE_DAY u5))
(define-constant FUNDING_PERIOD (* ONE_DAY u10))

(define-map
  loans
  uint
  {
    status: (buff 1),
    borrower: principal,
    loan-amount: uint,
    ;; use collateral ratio
    coll-ratio: uint, ;; ratio in BP
    coll-token: principal,
    next-payment: uint,
    apr: uint,   ;; apr in basis points, 1 BP = 1 / 10_000
    payment-period: uint,
    remaining-payments: uint,
    coll-vault: principal,
    loan-token: principal,
    funding-vault: principal,
    created: uint}) ;; time in blocks (10 minutes)

(define-read-only (get-loan-data (loan-id uint))
  (map-get? loans loan-id)
)

(define-public (create-loan
  (loan-amount uint)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (loan-token principal)
  (funding-vault principal)
  )
  (let (
      (last-id (var-get last-loan-id))
    )
      (try! (is-borrower))
      (try! (is-pool))
      ;; add loan sanity checks
      (map-set
        loans
        last-id
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
          loan-token: loan-token,
          funding-vault: funding-vault,
          created: burn-block-height
        })
      (var-set last-loan-id (+ u1 last-id))
      (ok last-id)
  )
)

(define-public (get-loan (loan-id uint))
  (ok (unwrap! (map-get? loans loan-id) ERR_INVALID_VALUES))
)

;; @desc assumes pool has sent the funds to the funding vault, mints loan tokens to lp contract
(define-public (fund-loan (loan-id uint) (lp-token <lp-token>) (loan-token <loan-token>) (amount uint))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
  )
    (try! (is-pool))
    (asserts! (>= amount (get loan-amount loan)) ERR_INVALID_AMOUNT)
    (asserts! (<= (- burn-block-height (get created loan)) FUNDING_PERIOD) ERR_FUNDING_EXPIRED)
    (asserts! (is-eq INIT (get status loan)) ERR_INVALID_STATUS)

    (try! (contract-call? loan-token mint (contract-of lp-token) (to-precision amount)))
    (ok true)
  )
)

;; @desc inverse the effects of fund-loan
(define-public (unwind (loan-id uint) (lp-token <lp-token>) (loan-token <loan-token>) (amount uint))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
  )
    (try! (is-pool))
    (asserts! (>= amount (get loan-amount loan)) ERR_INVALID_AMOUNT)
    (asserts! (> (- burn-block-height (get created loan)) FUNDING_PERIOD) ERR_FUNDING_IN_PROGRESS)
    
    (try! (contract-call? loan-token burn (contract-of lp-token) (to-precision amount)))
    (map-set loans loan-id (merge loan { status: EXPIRED }))

    (ok (get loan-amount loan))
  )
)

;; @desc send funds to the bridge contract
(define-public (drawdown (loan-id uint) (height uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
    (loan-amount (get loan-amount loan))
    (coll-ratio (get coll-ratio loan))
  )
    (try! (is-bridge))
    (asserts! (and
      (is-eq (get borrower loan) tx-sender)
      (is-eq (contract-of fv) (get funding-vault loan))) ERR_INVALID_VALUES)

    (if (> coll-ratio u0)
      (let (
        (coll-amount (/ (* coll-ratio loan-amount) u10000))
      )
        ;; borrower sends funds to collateral vault
        (try! (deposit-collateral coll-token coll-vault coll-amount loan-id))
        true
      )
      false
    )
    (try! (contract-call? fv transfer (get loan-amount loan) (var-get bridge-contract) .xbtc))
    (map-set loans loan-id (merge loan { status: ACTIVE, next-payment: (+ height (get payment-period loan)) }))

    (ok loan-amount)
  )
)

;; @desc expect funds to be sent to the loan from the bridge router
(define-public (make-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (sp-token <lp-token>) (amount uint))
  (begin
    (try! (as-contract (contract-call? .xbtc transfer amount tx-sender (contract-of payment) none)))
    (let (
      (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
      (payment-response (try! (contract-call? payment make-next-payment lp-token sp-token height loan-id)))
    )
      (try! (is-bridge))
      (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
      (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
      (asserts! (>= amount (get reward payment-response)) ERR_INVALID_AMOUNT)

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
)

(define-public (make-full-payment (loan-id uint) (height uint) (payment <payment>) (lp-token <lp-token>) (sp-token <lp-token>) (amount uint))
  (begin
    (try! (as-contract (contract-call? .xbtc transfer amount tx-sender (contract-of payment) none)))
    (let (
      (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
      (payment-response (try! (contract-call? payment make-full-payment lp-token sp-token height loan-id)))
      (updated-loan (merge loan { next-payment: u0, remaining-payments: u0, status: MATURED}))
    )
      (try! (is-bridge))
      (asserts! (is-eq ACTIVE (get status loan)) ERR_INVALID_STATUS)
      (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
      (asserts! (>= amount (+ (get reward payment-response) (get full-payment payment-response))) ERR_INVALID_AMOUNT)

      (map-set loans loan-id updated-loan)
      (ok payment-response)
    )
  )
)

(define-public (liquidate (loan-id uint) (coll-vault <cv>) (coll-token <ft>) (recipient principal))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
    (recovered (try! (withdraw-collateral coll-vault coll-token loan-id recipient)))
  )
    (try! (is-pool))
    (asserts! (is-eq (get status loan) ACTIVE) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-vault) (get coll-vault loan)) ERR_INVALID_VALUES)
    (asserts! (is-eq (contract-of coll-token) (get coll-token loan)) ERR_INVALID_VALUES)
    (asserts! (> burn-block-height (+ GRACE_PERIOD (get next-payment loan))) ERR_LOAN_IN_PROGRESS)

    (map-set loans loan-id (merge loan { status: LIQUIDATED }))
    (ok { recovered-funds: recovered, loan-amount: (get loan-amount loan)})
  )
)

(define-map rollover-progress uint { status: (buff 1), apr: uint, maturity-length: uint, payment-period: uint, coll-ratio: uint, coll-type: principal })

(define-constant REQUESTED 0x00)
(define-constant ACCEPTED 0x01)
(define-constant COMPLETED 0x02)

(define-public (request-rollover (loan-id uint) (apr uint) (maturity-length uint) (payment-period uint) (coll-ratio uint) (coll-type <ft>))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
  )
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? rollover-progress loan-id)) ERR_ROLLOVER_EXISTS)
    (asserts! (is-eq u0 (mod maturity-length payment-period)) ERR_INVALID_VALUES)

    (map-set
      rollover-progress
      loan-id
      {
        status: REQUESTED,
        apr: apr,
        maturity-length: maturity-length,
        payment-period: payment-period,
        coll-ratio: coll-ratio,
        coll-type: (contract-of coll-type) })
    (ok true)
  )
)

(define-public (complete-rollover (loan-id uint) (coll-type <ft>) (cv <cv>))
  (let (
    (loan (unwrap! (get-loan-data loan-id) ERR_INVALID_LOAN))
    (rollover (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN))
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
    (coll-xbtc-eq (try! (contract-call? .swap-router get-y-given-x coll-type .xbtc required-xbtc)))
    (diff-coll (try! (contract-call? .swap-router get-y-given-x coll-type .xbtc (- required-xbtc coll-xbtc-eq))))
  )
    (asserts! (is-eq tx-sender (get borrower loan)) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? rollover-progress loan-id)) ERR_ROLLOVER_EXISTS)
    (asserts! (is-eq ACCEPTED (get status rollover)) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of coll-type) (get coll-type rollover)) ERR_INVALID_VALUES)
    (if (> coll-xbtc-eq required-xbtc)
      true
      (try! (contract-call? cv add-collateral coll-type diff-coll loan-id))
    )
    
    (map-set loans loan-id new-terms)
    (ok true)
  )
)

(define-public (accept-rollover (loan-id uint))
  (let (
    (rollover (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN))
  )
    (try! (is-pool))
    (asserts! (is-eq (get status rollover) REQUESTED) ERR_UNAUTHORIZED)

    (map-set rollover-progress loan-id (merge rollover { status: ACCEPTED }))
    (ok true)
  )
)

(define-private (deposit-collateral (coll-token <ft>) (coll-vault <cv>) (amount uint) (loan-id uint))
  (begin
    (contract-call? coll-vault store coll-token amount loan-id)
  )
)

(define-private (withdraw-collateral (coll-vault <cv>) (coll-token <ft>) (loan-id uint) (recipient principal))
  (begin
    (contract-call? coll-vault draw coll-token loan-id recipient)
  )
)

;; --- ownable trait

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

(define-data-var pool-contract principal .pool-v1-0)

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

(define-constant DFT_PRECISION (pow u10 u18))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (/ (* amount DFT_PRECISION) BITCOIN_PRECISION)
)

;; --- onboarding borrowers

(define-map borrowers principal bool)

(define-public (add-borrower (borrower principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set borrowers borrower true))
	)
)

(define-public (remove-borrower (borrower principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set borrowers borrower false))
	)
)

(define-read-only (is-borrower)
  (if (default-to false (map-get? borrowers tx-sender))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

 ;; bridge access
(define-data-var bridge-contract principal .bridge-router-test)

(define-public (set-bridge-contract (new-bridge principal))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set bridge-contract new-bridge))
  )
)

(define-read-only (is-bridge)
  (if (is-eq contract-caller (var-get bridge-contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-constant ERR_UNAUTHORIZED (err u5000))
(define-constant ERR_INVALID_VALUES (err u5001))
(define-constant ERR_INVALID_LOAN (err u5002))
(define-constant ERR_INVALID_AMOUNT (err u5003))
(define-constant ERR_FUNDING_EXPIRED (err u5004))
(define-constant ERR_FUNDING_IN_PROGRESS (err u5005))
(define-constant ERR_INVALID_STATUS (err u5006))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u5007))
(define-constant ERR_LOAN_IN_PROGRESS (err u5008))
(define-constant ERR_ROLLOVER_EXISTS (err u5009))
