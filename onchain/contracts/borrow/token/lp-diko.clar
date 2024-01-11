(use-trait ft .ft-mint-trait.ft-mint-trait)

(impl-trait .a-token-trait.a-token-trait)

(impl-trait .ownable-trait.ownable-trait)

(define-fungible-token lp-diko)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var token-name (string-ascii 32) "LP DIKO")
(define-data-var token-symbol (string-ascii 32) "LP-DIKO")

(define-constant pool-id u0)

(define-read-only (get-total-supply)
  (ok (ft-get-supply lp-diko)))

(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok u8))

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri))))

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance lp-diko account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender (get pool-delegate (try! (contract-call? .pool-v2-0 get-pool u0))))
    (ok (var-set token-uri value))
    ERR_UNAUTHORIZED))

(define-public (set-token-name (value (string-ascii 32)))
  (if (is-eq tx-sender (get pool-delegate (try! (contract-call? .pool-v2-0 get-pool u0))))
    (ok (var-set token-name value))
    ERR_UNAUTHORIZED))

(define-public (set-token-symbol (value (string-ascii 32)))
  (if (is-eq tx-sender (get pool-delegate (try! (contract-call? .pool-v2-0 get-pool u0))))
    (ok (var-set token-symbol value))
    ERR_UNAUTHORIZED))


(define-private (transfer-internal (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (match (ft-transfer? lp-diko amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (transfer-internal amount sender recipient memo)
  )
)


(define-public (transfer-on-liquidation (amount uint) (from principal) (to principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (try! (transfer-internal amount from to none))
    (ok amount)
  )
)

(define-public (burn-on-liquidation (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (try! (burn-internal amount owner))
    (ok amount)
  )
)

(define-private (burn-internal (amount uint) (owner principal))
  (ft-burn? lp-diko amount owner)
)

(define-private (mint-internal (amount uint) (owner principal))
  (ft-mint? lp-diko amount owner)
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (mint-internal amount recipient)
  )
)

(define-public (burn (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (burn-internal amount owner)
  )
)

;; -- ownable-trait --
(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-lp-diko", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; TODO: should use the pool logic designated by the Pool Delegate
;; -- permissions
(define-map approved-contracts principal bool)

(define-public (set-approved-contract (contract principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set approved-contracts contract enabled))
  )
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))

(map-set approved-contracts .pool-borrow true)
(map-set approved-contracts .liquidation-manager true)
(map-set approved-contracts .pool-0-reserve true)

(define-constant ERR_UNAUTHORIZED (err u14401))