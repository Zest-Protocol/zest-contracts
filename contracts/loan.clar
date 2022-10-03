(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)

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

(define-data-var defaulted-amount uint u0)

;; TODO: add abstraction to bitcoin address
(define-map
  loans
  uint
  {
    status: (buff 1),
    borrower: principal,
    loan-amount: uint,
    coll-amount: uint,
    coll-type-addr: (optional principal),
    next-payment: uint,
    apr: uint,   ;; apr in basis points, 1 BP = 1 / 10_000
    payment-period: uint,
    remaining-payments: uint,
    coll-vault-addr: principal,
    debt-addr: principal }) ;; time in blocks (10 minutes)

(define-read-only (is-pool)
    (is-eq contract-caller .pool)
)

(define-read-only (get-loan (loan-id uint))
  (unwrap-panic (map-get? loans loan-id))
)

;; TODO: debt-dest should be a debt-vault interface
(define-public (create-loan
  (loan-amount uint)
  (coll-amount uint)
  (coll-type-addr (optional principal))
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (debt-dest principal)
  (coll-vault-addr principal))
    (let (
      (last-id (var-get last-loan-id))
    )
      ;; add loan sanity checks
      (map-set
        loans
        last-id
        {
          status: INIT,
          borrower: tx-sender,
          loan-amount: loan-amount,
          coll-amount: coll-amount,
          coll-type-addr: coll-type-addr,
          next-payment: u0,
          apr: apr,
          payment-period: payment-period,
          remaining-payments: (/ maturity-length payment-period),
          debt-addr: debt-dest,
          coll-vault-addr: coll-vault-addr
        })
      (var-set last-loan-id (+ u1 last-id))
      (ok last-id)
    )
)

(define-public (transfer-funds (recipient principal) (amount uint) (ft <ft>))
    (begin
        (asserts! (is-pool) ERR_UNAUTHORIZED)    
        (as-contract (contract-call? ft transfer amount tx-sender recipient none))
    )
)

(define-public (fund-loan (loan-id uint))
  (let (
      (loan (unwrap! (map-get? loans loan-id) ERR_LOAN_DOES_NOT_EXIST))
  )
      (asserts! (and (is-eq INIT (get status loan)) (is-pool)) ERR_UNAUTHORIZED)
      (try! (contract-call? .liquidity-vault transfer (get loan-amount loan) .funding-vault .xbtc))
      (mint (get debt-addr loan) (to-precision (get loan-amount loan)))
  )
)

;; TODO: should be called by the bitcoin contract when bitcoin has been transferred
;; called by borrower as tx-sender to send the loan funds
;;
;; @returns transfer result
;;
;; @param loan-id; loan id
;; @param height; block height (Stacks height)
(define-public (drawdown (loan-id uint) (height uint) (coll-type <ft>) (coll-vault <cv>))
  (let (
      (loan (unwrap! (map-get? loans loan-id) ERR_LOAN_DOES_NOT_EXIST))
      (coll (get coll-type-addr loan))
      (coll-amount (get coll-amount loan))
  )
      (asserts! (is-eq (get borrower loan) tx-sender) ERR_UNAUTHORIZED)
      ;; should swap initiate swap for xbtc instead of transferring to borrower
      (map-set loans loan-id (merge loan { status: ACTIVE, next-payment: (+ height (get payment-period loan)) }))

      (match coll
        some-val (begin
          (asserts! (and (> coll-amount u0) (is-eq (contract-of coll-type) some-val)) ERR_UNAUTHORIZED)
          (try! (contract-call? coll-vault store coll-type coll-amount loan-id))
        )
        false
      )

      (contract-call? .funding-vault transfer (get loan-amount loan) (get borrower loan) .xbtc)
  )
)

;; TODO : to be called by the bitcoin contract
(define-public (verify-payment (loan-id uint) (height uint))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_LOAN_DOES_NOT_EXIST))
    (is-late (> height (get next-payment loan)))
    (amount (unwrap-panic (get-interest-payment (get loan-amount loan) (get apr loan) (get payment-period loan) is-late)))
    )
    (asserts! (is-eq ACTIVE (get status loan)) ERR_UNAUTHORIZED)
    (if (is-eq (get remaining-payments loan) u1)
      (begin
        (map-set
          loans
          loan-id
          (merge loan {
            next-payment: u0,
            remaining-payments: u0,
            status: MATURED }))

        ;; TODO: set up payment that is on escrow
        ;; tx-sender should be the escrow contract
        (try! (contract-call? .xbtc transfer (+ (get loan-amount loan) amount) tx-sender (as-contract tx-sender) none))
      )
      (begin
        ;; TODO: advance payments step-by-step
        (map-set
          loans
          loan-id
          (merge loan {
            next-payment: (+ (get payment-period loan) (get next-payment loan)),
            remaining-payments: (- (get remaining-payments loan) u1) }))
        ;; TODO: set up payment that is on escrow
        ;; tx-sender should be the escrow contract
        (try! (contract-call? .xbtc transfer amount tx-sender (as-contract tx-sender) none))
      )
    )

    ;; ALWAYS UPDATE
    (ok (update-funds-deposited (to-int amount)))
  )
)

;; can only be called by Pool Delegate
;; should only be called by Pool
;; liquidates a Loan and recovers funds from the Collateral Vault if there are any
(define-public (liquidate (loan-id uint) (coll-vault <cv>))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_LOAN_DOES_NOT_EXIST))
    )
    ;; TODO: add assert so that only the Pool Delegate can call this function
    (asserts! (and
      (is-eq ACTIVE (get status loan))
      (is-eq (contract-of coll-vault) (get coll-vault-addr loan)))
      ERR_UNAUTHORIZED)
    
    (if (> block-height (+ GRACE_PERIOD (get next-payment loan)))
      (let (
        ;; TODO: add function liquidate the collateral and swap then send recovered funds to the loan
        ;; In this case, we draw the collateral from the collateral vault
        (amount (unwrap! (contract-call? coll-vault draw .xbtc loan-id) ERR_UNABLE_TO_DRAW_FUNDS))
      )
        (map-set loans loan-id (merge loan { status: LIQUIDATED }))
        (var-set defaulted-amount (+ (var-get defaulted-amount) (- (get loan-amount loan) amount)))
        
        (update-funds-deposited (to-int amount))
        (ok (- (get loan-amount loan) amount))
      )
      ERR_LIQUIDATION_UNAVAILABLE
    )
  )
)

(define-public (get-interest-payment (amount uint) (apr uint) (block-delta uint) (is-late bool))
  (if is-late
    (contract-call? .loan-payment-late-fixed get-interest-payment amount apr block-delta)
    (contract-call? .loan-payment-fixed get-interest-payment amount apr block-delta)
  )
)


(impl-trait .sip-010-trait.sip-010-trait)
(define-constant POINTS_PRECISION (pow u2 u64))


;; Uses Funds Distribution Token model from : https://github.com/ethereum/EIPs/issues/2222
;; token circulation can be of 2^112 because:
;; Max satoshi :
;; 2.1 * 10^7 * 10^8  = 2.1 * 10^15
;; require 2^51 precision
;; and max uint precision is 2^128
(define-fungible-token loan-token POINTS_PRECISION)
(define-data-var token-uri (string-utf8 256) u"")

(define-data-var fund-gains uint u0)
(define-constant points-multiplier (pow u2 u64))
(define-data-var points-per-share uint u0)

(define-constant TOKEN_PRECISION (pow u10 u18))
(define-constant BITCOIN_PRECISION (pow u10 u8))


(define-map point-correction principal int)
(define-map withdrawn-funds principal uint)

(define-read-only (get-asset-name)
    (ok "loan-token")
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply loan-token))
)

(define-read-only (get-name)
  (ok "loan-token")
)

(define-read-only (get-symbol)
  (ok "loan-token")
)

(define-read-only (get-decimals)
  (ok u0)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance loan-token account))
)

(define-read-only (get-token-uri)
    (ok (some (var-get token-uri)))
)

(define-private (mint (owner principal) (amount uint))
  (begin
    (map-set point-correction owner
      (-
        (default-to 0 (map-get? point-correction owner))
        (to-int (* amount (var-get points-per-share)))
      ))
    (ft-mint? loan-token amount owner)
  )
)

(define-private (burn (owner principal) (amount uint))
  (begin
    (map-set point-correction owner
      (+
        (default-to 0 (map-get? point-correction owner))
        (to-int (* amount (var-get points-per-share)))
      ))
    (ft-burn? loan-token amount owner)
  )
)

(define-read-only (to-precision (amount uint))
  (/ (* amount TOKEN_PRECISION) BITCOIN_PRECISION)
)

;; TODO: add points correction between 2 accounts
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    
    (match (ft-transfer? loan-token amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (withdraw-funds)
  (let (
    ;; map to the bitcoin owner
    ;; (loan (unwrap! (map-get? loans loan-id) ERR_LOAN_DOES_NOT_EXIST))
    (sender (as-contract tx-sender))
    (recipient contract-caller)
    (withdrawable-funds (prepare-withdraw contract-caller))
    )
    (try! (as-contract (contract-call? .xbtc transfer withdrawable-funds sender recipient none)))
    (ok (update-funds-balance (- (to-int withdrawable-funds))))
  )
)



(define-private (prepare-withdraw (owner principal))
  (let (
    (withdrawable-dividend (withdrawable-funds-of owner))
  )
    (map-set withdrawn-funds owner (+ (default-to u0 (map-get? withdrawn-funds owner)) withdrawable-dividend))
    withdrawable-dividend
  )
)

(define-read-only (withdrawable-funds-of (owner principal))
  (- (accumulative-funds-of owner) (default-to u0 (map-get? withdrawn-funds owner)))
)

(define-read-only (accumulative-funds-of (owner principal))
  (/
    (to-uint (+
        (to-int (* (var-get points-per-share) (ft-get-balance loan-token owner)))
        (default-to 0 (map-get? point-correction owner))
    ))
    points-multiplier
  )
)

(define-private (update-funds-deposited (delta int))
  (begin
    (update-funds-balance delta)
    (asserts! (> delta 0) false)
    (distribute-funds (to-uint delta))
  )
)

(define-private (update-funds-balance (delta int))
  (let (
    (prev-funds (var-get fund-gains))
  )
    (var-set fund-gains (to-uint (+ (to-int prev-funds) delta)))
    delta
  )
)

(define-private (distribute-funds (amount uint))
  (begin
    (asserts! (and (> amount u0) (> (ft-get-supply loan-token) u0)) false)
    (var-set points-per-share (+ (var-get points-per-share) (/ (* amount points-multiplier) (ft-get-supply loan-token))))
  )
)



(define-constant ERR_UNAUTHORIZED (err u300))

(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_ACCOUNT_DOES_NOT_EXIST (err u302))
(define-constant ERR_TOKEN_UNAVAILABLE (err u303))
(define-constant ERR_LOAN_DOES_NOT_EXIST (err u304))
(define-constant ERR_LIQUIDATION_UNAVAILABLE (err u305))
(define-constant ERR_UNABLE_TO_DRAW_FUNDS (err u306))
