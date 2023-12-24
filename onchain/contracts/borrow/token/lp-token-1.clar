(use-trait ft .ft-mint-trait.ft-mint-trait)
(impl-trait .ownable-trait.ownable-trait)

(define-fungible-token lp-token-0)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var token-name (string-ascii 32) "LP Token 1")
(define-data-var token-symbol (string-ascii 32) "LP1")

(define-constant pool-id u0)

(define-read-only (get-total-supply)
  (ok (ft-get-supply lp-token-0)))

(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok u8))

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri))))

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance lp-token-0 account))
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

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (match (ft-transfer? lp-token-0 amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! true ERR_UNAUTHORIZED)
    (ft-mint? lp-token-0 amount recipient)
  )
)

(define-public (burn (amount uint) (owner principal))
  (begin
    (asserts! true ERR_UNAUTHORIZED)
    (ft-burn? lp-token-0 amount owner)
  )
)

;; -- ownable-trait --
(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-lp-token-0", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; TODO: should use the pool logic designated by the Pool Delegate
;; -- permissions
(define-map approved-contracts principal bool)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))

(map-set approved-contracts .loan-v1-0 true)
(map-set approved-contracts .pool-v1-0 true)
(map-set approved-contracts .payment-fixed true)
(map-set approved-contracts .supplier-interface true)

(define-constant ERR_UNAUTHORIZED (err u14401))