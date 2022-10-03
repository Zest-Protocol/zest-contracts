(impl-trait .distribution-token-trait.distribution-token-trait)
(impl-trait .ownable-trait.ownable-trait)

(use-trait ft .sip-010-trait.sip-010-trait)

(define-fungible-token loan)
(define-data-var token-uri (string-utf8 256) u"")

(define-data-var contract-owner principal tx-sender)
(define-constant ERR_UNAUTHORIZED (err u300))

;; -- sip-010 functions

(define-read-only (get-total-supply)
  (ok (ft-get-supply loan))
)

(define-read-only (get-name)
  (ok "loan")
)

(define-read-only (get-symbol)
  (ok "loan")
)

(define-read-only (get-decimals)
  (ok u0)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance loan account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set token-uri value))
  )
)

(define-read-only (get-token-uri)
    (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    
    (match (ft-transfer? loan amount sender recipient)
      response (let (
          (correction-mag (to-int (* amount (var-get points-per-share))))
          (points-correction-from (+ (unwrap! (map-get? points-correction sender) ERR_INVALID_PRINCIPAL) correction-mag))
          (points-correction-to (- (unwrap! (map-get? points-correction recipient) ERR_INVALID_PRINCIPAL) correction-mag))
        )
          (map-set points-correction sender points-correction-from)
          (map-set points-correction recipient points-correction-to)
          (print memo)
          (ok response)
      )
      error (err error)
    )
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

;; distribution-token-trait BEGIN
;; Uses Funds Distribution Token model from : https://github.com/ethereum/EIPs/issues/2222
;; token circulation can be of 2^112 because:
;; Max satoshi :
;; 2.1 * 10^7 * 10^8  = 2.1 * 10^15
;; require 2^51 precision
;; and max uint precision is 2^128

(define-data-var funds uint u0)
(define-constant POINTS_MULTIPLIER (pow u2 u64))
(define-data-var points-per-share uint u0)

(define-constant FUNDS_HOLDER_CONTRACT (as-contract tx-sender))

(define-map points-correction principal int)
(define-map withdrawn-funds principal uint)

;; -- PUBLIC FUNCTIONS --

;; claim withdrawable funds by the token owner
(define-public (withdraw-funds)
  (let (
    (recipient contract-caller)
    (withdrawable-funds (prepare-withdraw contract-caller))
    )
    (try! (as-contract (contract-call? .xbtc transfer withdrawable-funds FUNDS_HOLDER_CONTRACT recipient none)))
    (ok (update-funds-balance (- (to-int withdrawable-funds))))
  )
)

;; called by pool to deposit rewards acquired
(define-public (deposit-rewards (amount int))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (update-funds-balance amount))
  )
)

(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (mint-priv recipient amount)
  )
)

(define-public (burn (recipient principal) (amount uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (burn-priv recipient amount)
  )
)

;; -- PRIVATE FUNCTIONS --

(define-private (mint-priv (recipient principal) (amount uint))
  (begin
    (map-set points-correction recipient
      (-
        (default-to 0 (map-get? points-correction recipient))
        (to-int (* amount (var-get points-per-share)))
      ))
    (ft-mint? loan amount recipient)
  )
)

(define-private (burn-priv (owner principal) (amount uint))
  (begin
    (map-set points-correction owner
      (+
        (default-to 0 (map-get? points-correction owner))
        (to-int (* amount (var-get points-per-share)))
      ))
    (ft-burn? loan amount owner)
  )
)

;; update withdrawn funds with the amount of withdrawable dividend
(define-private (prepare-withdraw (owner principal))
  (let (
    (withdrawable-funds (withdrawable-funds-of owner))
  )
    (map-set withdrawn-funds owner (+ (default-to u0 (map-get? withdrawn-funds owner)) withdrawable-funds))
    withdrawable-funds
  )
)

(define-read-only (withdrawable-funds-of (owner principal))
  (- (accumulative-funds-of owner) (default-to u0 (map-get? withdrawn-funds owner)))
)

(define-read-only (accumulative-funds-of (owner principal))
  (/
    (to-uint (+
        (to-int (* (var-get points-per-share) (ft-get-balance loan owner)))
        (default-to 0 (map-get? points-correction owner))
    ))
    POINTS_MULTIPLIER
  )
)

;; increase or decrease funds held by delta and distribute in case of increase
(define-private (update-funds-balance (delta int))
  (begin
    ;; update distribution funds in holdings
    (var-set funds (to-uint (+ (to-int (var-get funds)) delta)))
    (asserts! (and (> delta 0 ) (> (ft-get-supply loan) u0)) delta)
    ;; only distribute when funds are earned
    (var-set points-per-share (+ (var-get points-per-share) (/ (* (to-uint delta) POINTS_MULTIPLIER) (ft-get-supply loan))))
    delta
  )
)

(define-constant ERR_INVALID_PRINCIPAL (err u1001))
