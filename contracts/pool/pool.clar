(impl-trait .sip-010-trait.sip-010-trait)
(impl-trait .ownable-trait.ownable-trait)
(use-trait ft .sip-010-trait.sip-010-trait)

(use-trait cv .coll-vault-trait.coll-vault-trait)

(define-constant POINTS_PRECISION (pow u2 u64))

(define-data-var pool-id uint u0)

(define-map pools
  uint
  {
    lp-token: principal
  }
)

(define-map pools-data
  principal
  {
    pool-delegate: principal,
    staking-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint
  }  
)

;; -- ownable-trait
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

(define-public (create-pool (pool-delegate principal) (lp-token <ft>) (staking-fee uint) (delegate-fee uint) (liquidity-cap uint))
  (let (
    (new-pool-id (+ u1 (var-get pool-id)))
    (lp-contract (contract-of lp-token))
  )
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)

    (map-set pools new-pool-id { lp-token: lp-contract })
    (map-set pools-data lp-contract { pool-delegate: pool-delegate, staking-fee: staking-fee, delegate-fee: delegate-fee, liquidity-cap: liquidity-cap })
    (ok true)
  )
)

(define-public (set-liquidity-cap (lp-token <ft>) (liquidity-cap uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (asserts! (lc-check liquidity-cap (get liquidity-cap pool)) ERR_INVALID_VALUES)
    ;; (asserts! (is-eq tx-sender ()))
    (map-set pools-data lp-contract (merge pool { liquidity-cap: liquidity-cap }))
    (ok true)
  )
)

(define-public (set-pool-delegate (lp-token <ft>) (pool-delegate principal))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (map-set pools-data lp-contract (merge pool { pool-delegate: pool-delegate }))
    (ok true)
  )
)

(define-private (get-pool-data (lp-token principal))
  (map-get? pools-data lp-token)
)

;; @desc sanity checks for liquidity cap
(define-read-only (lc-check (new-lc uint) (previous-lc uint))
  (and (> new-lc previous-lc) (> new-lc u0))
)

;; token circulation can be of 2^112 because:
;; Max satoshi :
;; 2.1 * 10^7 * 10^8  = 2.1 * 10^15
;; require 2^51 precision
;; and max uint precision is 2^128
(define-fungible-token pool-token POINTS_PRECISION)
(define-data-var token-uri (string-utf8 256) u"")

(define-data-var fund-gains uint u0)
(define-constant points-multiplier (pow u2 u64))
(define-data-var points-per-share uint u0)

(define-constant TOKEN_PRECISION (pow u10 u18))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-data-var latest-pool-loss uint u0)


(define-map point-correction principal int)
(define-map withdrawn-funds principal uint)

(define-read-only (get-asset-name)
    (ok "pool-token")
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply pool-token))
)

(define-read-only (get-name)
  (ok "pool-token")
)

(define-read-only (get-symbol)
  (ok "pool-token")
)

(define-read-only (get-decimals)
  (ok u0)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance pool-token account))
)

(define-read-only (get-token-uri)
    (ok (some (var-get token-uri)))
)


(define-public (deposit (amount uint))
  (begin
    (try! (contract-call? .xbtc transfer amount tx-sender .liquidity-vault none))
    (mint tx-sender (to-precision amount))
  )
)

;; withdraw funds deposited
(define-public (withdraw (amount uint))
  (let (
    (recipient tx-sender)
    (lost-funds (prepare-losses-withdrawal tx-sender))
    )
    ;; TODO: withdrawal cooldown
    (try! (contract-call? .liquidity-vault transfer (- amount lost-funds) tx-sender .xbtc))
    (burn tx-sender (to-precision amount))
  )
)

(define-public (fund-loan (loan-id uint))
  (begin
    ;; TODO: fetch debt-vault addr to change debt strategy
    (contract-call? .loan fund-loan loan-id)
  )
)

;; TODO: this should liquidate the Loan first, then compensate with funds from the staking vault
(define-public (liquidate
  (loan-id uint)
  (coll-vault <cv>)
  )
  (let (
      (defaulted-amount (try! (contract-call? .loan liquidate loan-id coll-vault)))
    )
    ;; (asserts! (is-eq tx-sender (var-get pool-delegate)) ERR_UNAUTHORIZED)
    (var-set latest-pool-loss (+ defaulted-amount (var-get latest-pool-loss)))
    (ok defaulted-amount)
  )
)

(define-public (compensate-pool
  ;; (stake-vault <sv>)
  (zest <ft>)
  (xbtc <ft>)
  )
  (let (
    (pool-loss (var-get latest-pool-loss))
    ;; (available-funds (try! (contract-call? stake-vault get-available-funds)))
    (available-funds u0)
  )
    (if (> pool-loss available-funds)
      ;; (contract-call? stake-vault default-withdrawal available-funds (as-contract tx-sender))
      ;; (contract-call? stake-vault default-withdrawal pool-loss (as-contract tx-sender))
      (ok available-funds)
      (ok pool-loss)
    )
    ;; TODO: swap zest tokens
  )
)

;; withdraw rewards gained
(define-public (claim-interest (loan-id uint))
  (let ((claimed (try! (contract-call? .debt-vault claim))))
    ;; TODO: add distribution to treasury and pool delegate
    (ok (update-funds-deposited (to-int claimed)))
  )
)


(define-private (mint (owner principal) (amount uint))
  (begin
    ;; mint gains
    (map-set point-correction owner
      (-
        (default-to 0 (map-get? point-correction owner))
        (to-int (* amount (var-get points-per-share)))
      ))

    ;; mint losses
    (map-set losses-correction owner
      (-
        (default-to 0 (map-get? losses-correction owner))
        (to-int (* amount (var-get losses-per-share)))
      ))
    (ft-mint? pool-token amount owner)
  )
)

(define-private (burn (owner principal) (amount uint))
  (begin
    ;; burn gains
    (map-set point-correction owner
      (+
        (default-to 0 (map-get? point-correction owner))
        (to-int (* amount (var-get points-per-share)))
      ))

    ;; burn losses
    (map-set losses-correction owner
      (+
        (default-to 0 (map-get? losses-correction owner))
        (to-int (* amount (var-get losses-per-share)))
      ))

    (ft-burn? pool-token amount owner)
  )
)

(define-read-only (to-precision (amount uint))
  (/ (* amount TOKEN_PRECISION) BITCOIN_PRECISION)
)

;; TODO: add points correction between 2 accounts
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    
    (match (ft-transfer? pool-token amount sender recipient)
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
        (to-int (* (var-get points-per-share) (ft-get-balance pool-token owner)))
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
    (asserts! (and (> amount u0) (> (ft-get-supply pool-token) u0)) false)
    (var-set points-per-share (+ (var-get points-per-share) (/ (* amount points-multiplier) (ft-get-supply pool-token))))
  )
)

;; BEGIN RECOGNIZE LOSSES
(define-data-var losses-per-share uint u0)
(define-map losses-correction principal int)
(define-map recognized-losses principal uint)

(define-data-var fund-losses uint u0)

(define-private (prepare-losses-withdrawal (owner principal))
  (let (
    (recognizable-losses (recognizable-losses-of owner))
  )
    (map-set recognized-losses owner (+ (default-to u0 (map-get? recognized-losses owner)) recognizable-losses))
    recognizable-losses
  )
)

(define-read-only (recognizable-losses-of (owner principal))
  (- (accumulative-losses-of owner) (default-to u0 (map-get? recognized-losses owner)))
)

(define-read-only (accumulative-losses-of (owner principal))
  (/
    (to-uint (+
        (to-int (* (var-get losses-per-share) (ft-get-balance pool-token owner)))
        (default-to 0 (map-get? losses-correction owner))
    ))
    points-multiplier
  )
)

(define-private (update-funds-lost (delta int))
  (begin
    (update-funds-losses delta)
    (asserts! (> delta 0) false)
    (distribute-losses (to-uint delta))
  )
)

(define-private (update-funds-losses (delta int))
  (let (
    (prev-losses (var-get fund-losses))
  )
    (var-set fund-losses (to-uint (+ (to-int prev-losses) delta)))
    delta
  )
)

(define-private (distribute-losses (amount uint))
  (begin
    (asserts! (and (> amount u0) (> (ft-get-supply pool-token) u0)) false)
    (var-set losses-per-share (+ (var-get losses-per-share) (/ (* amount points-multiplier) (ft-get-supply pool-token))))
  )
)


(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_ACCOUNT_DOES_NOT_EXIST (err u302))
(define-constant ERR_TOKEN_UNAVAILABLE (err u303))
(define-constant ERR_INVALID_LP (err u304))
