(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)

(define-constant one-8 (contract-call? .math get-one))
(define-constant max-value (contract-call? .math get-max-value))
(define-constant one-3 u1000)

(define-read-only (get-one-3) one-3)

(define-data-var flashloan-fee-total uint (/ (* one-8 u35) one-8))

(define-public (set-flashloan-fee-total (fee uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set flashloan-fee-total fee))))

(define-public (get-flashloan-fee-total)
  (ok (var-get flashloan-fee-total)))
(define-read-only (get-flashloan-fee-total-read)
  (var-get flashloan-fee-total))

(define-data-var flashloan-fee-protocol uint (/ (* one-8 u3000) one-8))
(define-public (set-flashloan-fee-protocol (fee uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set flashloan-fee-protocol fee))))

(define-public (get-flashloan-fee-protocol)
  (ok (var-get flashloan-fee-protocol)))
(define-read-only (get-flashloan-fee-protocol-read)
  (var-get flashloan-fee-protocol))

(define-data-var health-factor-liquidation-threshold uint u100000000)
(define-public (set-health-factor-liquidation-threshold (hf uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set health-factor-liquidation-threshold hf))))

(define-public (get-health-factor-liquidation-threshold)
  (ok (var-get health-factor-liquidation-threshold)))
(define-read-only (get-health-factor-liquidation-threshold-read)
  (var-get health-factor-liquidation-threshold))

(define-data-var protocol-treasury-addr principal .protocol-treasury)
(define-public (set-protocol-treasury-addr (protocol-treasury principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set protocol-treasury-addr protocol-treasury))))

(define-public (get-protocol-treasury-addr)
  (ok (var-get protocol-treasury-addr)))
(define-read-only (get-protocol-treasury-addr-read)
  (var-get protocol-treasury-addr))

(define-map user-reserve-data
  { user: principal, reserve: principal}
  (tuple
    (principal-borrow-balance uint)
    (last-variable-borrow-cumulative-index uint)
    (origination-fee uint)
    (stable-borrow-rate uint)
    (last-updated-block uint)
    (use-as-collateral bool)))

(define-public (set-user-reserve-data
  (user principal)
  (reserve principal)
  (data
    (tuple
    (principal-borrow-balance uint)
    (last-variable-borrow-cumulative-index uint)
    (origination-fee uint)
    (stable-borrow-rate uint)
    (last-updated-block uint)
    (use-as-collateral bool))))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set user-reserve-data { user:user, reserve: reserve } data))))

(define-public (delete-user-reserve-data
  (user principal)
  (reserve principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-delete user-reserve-data { user:user, reserve: reserve }))))

(define-public (get-user-reserve-data
  (user principal)
  (reserve principal))
  (ok (map-get? user-reserve-data { user: user, reserve: reserve })))
(define-read-only (get-user-reserve-data-read
  (user principal)
  (reserve principal))
  (map-get? user-reserve-data { user: user, reserve: reserve }))

(define-map user-assets principal
  { assets-supplied: (list 100 principal), assets-borrowed: (list 100 principal)})
(define-public (set-user-assets
  (user principal)
  (data
    (tuple 
      (assets-supplied (list 100 principal))
      (assets-borrowed (list 100 principal)))))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set user-assets user data))))
(define-public (delete-user-assets
  (user principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-delete user-assets user))))

(define-public (get-user-assets
  (user principal))
  (ok (map-get? user-assets user)))
(define-read-only (get-user-assets-read
  (user principal))
  (map-get? user-assets user))

(define-map reserve-state
  principal
  (tuple
    (last-liquidity-cumulative-index uint)
    (current-liquidity-rate uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-stable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
    (last-variable-borrow-cumulative-index uint)
    (base-ltv-as-collateral uint)
    (liquidation-threshold uint)
    (liquidation-bonus uint)
    (decimals uint)
    (a-token-address principal)
    (oracle principal)
    (interest-rate-strategy-address principal)
    (flashloan-enabled bool)
    (last-updated-block uint)
    (borrowing-enabled bool)
    (usage-as-collateral-enabled bool)
    (is-stable-borrow-rate-enabled bool)
    (supply-cap uint)
    (borrow-cap uint)
    (debt-ceiling uint)
    (is-active bool)
    (is-frozen bool)))

(define-public (set-reserve-state
  (reserve principal)
  (data
    (tuple
    (last-liquidity-cumulative-index uint)
    (current-liquidity-rate uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-stable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
    (last-variable-borrow-cumulative-index uint)
    (base-ltv-as-collateral uint)
    (liquidation-threshold uint)
    (liquidation-bonus uint)
    (decimals uint)
    (a-token-address principal)
    (oracle principal)
    (interest-rate-strategy-address principal)
    (flashloan-enabled bool)
    (last-updated-block uint)
    (borrowing-enabled bool)
    (usage-as-collateral-enabled bool)
    (is-stable-borrow-rate-enabled bool)
    (supply-cap uint)
    (borrow-cap uint)
    (debt-ceiling uint)
    (is-active bool)
    (is-frozen bool))))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set reserve-state reserve data))))

(define-public (delete-reserve-state
  (reserve principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-delete reserve-state reserve))))

(define-public (get-reserve-state
  (reserve principal))
  (ok (map-get? reserve-state reserve)))
(define-read-only (get-reserve-state-read
  (reserve principal))
  (map-get? reserve-state reserve))

(define-map user-index principal uint)
(define-public (set-user-index
  (user principal)
  (data uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set user-index user data))))
(define-public (delete-user-index
  (user principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-delete user-index user))))

(define-public (get-user-index
  (user principal))
    (ok (map-get? user-index user)))
(define-read-only (get-user-index-read
  (user principal))
  (map-get? user-index user))

(define-data-var assets (list 100 principal) (list))
(define-public (set-assets
  (data (list 100 principal)))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set assets data))))

(define-public (get-assets)
    (ok (var-get assets)))
(define-read-only (get-assets-read)
    (var-get assets))

(define-map isolated-assets principal bool)
(define-public (set-isolated-assets
  (reserve principal)
  (data bool))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set isolated-assets reserve data))))
(define-public (delete-isolated-assets
  (reserve principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-delete isolated-assets reserve))))

(define-public (get-isolated-assets
  (reserve principal))
  (ok (map-get? isolated-assets reserve)))
(define-read-only (get-isolated-assets-read
  (reserve principal))
  (map-get? isolated-assets reserve))

;; Assets that can be borrowed using isolated assets as collateral
(define-data-var borroweable-isolated (list 100 principal) (list))
(define-public (set-borroweable-isolated
  (data (list 100 principal)))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set borroweable-isolated data))))

(define-public (get-borroweable-isolated)
    (ok (var-get borroweable-isolated)))
(define-read-only (get-borroweable-isolated-read)
    (var-get borroweable-isolated))

;; -- ownable-trait --
(define-data-var contract-owner principal tx-sender)
(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-reserve-data", payload: owner })
    (ok (var-set contract-owner owner))))

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))
(define-read-only (get-contract-owner-read)
  (var-get contract-owner))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; -- permissions
(define-map approved-contracts principal bool)

(define-public (set-approved-contract (contract principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set approved-contracts contract enabled))))

(define-public (delete-approved-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-delete approved-contracts contract))))

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))

;; (map-set approved-contracts .pool-borrow true)
;; (map-set approved-contracts .liquidation-manager true)
(map-set approved-contracts .pool-0-reserve true)

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
