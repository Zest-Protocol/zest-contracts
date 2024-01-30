(use-trait ft .ft-mint-trait.ft-mint-trait)
(use-trait sip10 .ft-trait.ft-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)

(impl-trait .a-token-trait.a-token-trait)

(impl-trait .ownable-trait.ownable-trait)

(define-fungible-token lp-diko)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var token-name (string-ascii 32) "LP DIKO")
(define-data-var token-symbol (string-ascii 32) "LP-DIKO")

(define-constant pool-id u0)
(define-constant asset-addr .diko)

(define-read-only (get-total-supply)
  (ok (ft-get-supply lp-diko)))

(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok u6))

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri))))

(define-read-only (get-balance (account principal))
  (let (
    (current-principal-balance (ft-get-balance lp-diko account))
  )
    (if (is-eq current-principal-balance u0)
      (ok u0)
      (let (
        (cumulated-balance
          (contract-call? .pool-0-reserve calculate-cumulated-balance
            account
            u6
            asset-addr
            current-principal-balance
            u6)))
        cumulated-balance
      )
    )
  )
)

(define-read-only (get-principal-balance (account principal))
  (ok (ft-get-balance lp-diko account)))

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set token-uri value))))

(define-public (set-token-name (value (string-ascii 32)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok   (var-set token-name value))))

(define-public (set-token-symbol (value (string-ascii 32)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set token-symbol value))))

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
    (execute-transfer-internal amount sender recipient)
  )
)


(define-public (transfer-on-liquidation (amount uint) (from principal) (to principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (try! (execute-transfer-internal amount from to))
    (ok amount)
  )
)

(define-private (burn-internal (amount uint) (owner principal))
  (ft-burn? lp-diko amount owner)
)

(define-private (mint-internal (amount uint) (owner principal))
  (ft-mint? lp-diko amount owner)
)

(define-public (burn-on-liquidation (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (let ((ret (try! (cumulate-balance-internal owner))))
      (try! (burn-internal amount owner))

      (if (is-eq (- (get current-balance ret) amount) u0)
        (try! (contract-call? .pool-0-reserve reset-user-index owner asset-addr))
        false
      )
      (ok amount)
    )
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (let (
      (ret (try! (cumulate-balance-internal recipient)))
    )
      (mint-internal amount recipient)
    )
  )
)

(define-public (burn (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (burn-internal amount owner)
  )
)

(define-private (cumulate-balance-internal (account principal))
  (let (
    (previous-balance (unwrap-panic (get-principal-balance account)))
    (balance-increase (- (unwrap-panic (get-balance account)) previous-balance))
    (reserve-state (try! (contract-call? .pool-0-reserve get-reserve-state asset-addr)))
    (new-user-index (contract-call? .pool-0-reserve get-normalized-income
        (get current-liquidity-rate reserve-state)
        (get last-updated-block reserve-state)
        (get last-liquidity-cumulative-index reserve-state)
    ))
  )
    (try! (contract-call? .pool-0-reserve set-user-index account asset-addr new-user-index))

    (ok {
      previous-user-balance: previous-balance,
      current-balance: (+ previous-balance balance-increase),
      balance-increase: balance-increase,
      index: new-user-index,
    })
  )
)

(define-constant max-value (contract-call? .math get-max-value))

(define-public (withdraw
  (pool-reserve principal)
  (asset <sip10>)
  (oracle <oracle-trait>)
  (amount uint)
  (owner principal)
  (assets (list 100 { asset: <sip10>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (ret (try! (cumulate-balance-internal tx-sender)))
    (amount-to-redeem (if (is-eq amount max-value) (get current-balance ret) amount))
  )
    (asserts! (and (> amount u0) (>= (get current-balance ret) amount-to-redeem)) (err u899933))
    (asserts! (try! (is-transfer-allowed asset-addr oracle amount tx-sender assets)) (err u998887))
    
    (try! (burn-internal amount tx-sender))

    (if (is-eq (- (get current-balance ret) amount) u0)
      (try! (contract-call? .pool-0-reserve reset-user-index tx-sender asset-addr))
      false
    )

    (contract-call? .pool-borrow redeem-underlying
      pool-reserve
      asset-addr
      oracle
      assets
      amount-to-redeem
      (get current-balance ret)
      tx-sender
    )
  )
)

(define-private (execute-transfer-internal
  (amount uint)
  (sender principal)
  (recipient principal)
  )
  (let (
    (from-ret (try! (cumulate-balance-internal sender)))
    (to-ret (try! (cumulate-balance-internal recipient)))
  )
    (try! (transfer-internal amount sender recipient none))
    (if (is-eq (- (get current-balance from-ret) amount) u0)
      (contract-call? .pool-0-reserve reset-user-index tx-sender asset-addr)
      (ok true)
    )
  )
)

(define-public (is-transfer-allowed
  (asset <sip10>)
  (oracle <oracle-trait>)
  (amount uint)
  (user principal)
  (assets-to-calculate (list 100 { asset: <sip10>, lp-token: <ft>, oracle: <oracle-trait> })))
  (contract-call? .pool-0-reserve check-balance-decrease-allowed asset oracle amount user assets-to-calculate)
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