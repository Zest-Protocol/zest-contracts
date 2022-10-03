;; contract for holding the global values of the protocol
(impl-trait .ownable-trait.ownable-trait)

(define-constant ONE_DAY u144)

(define-data-var globals
  {
    grace-period: uint,
    funding-period: uint,
    treasury-fee: uint,
    investor-fee: uint,
    staker-cooldown-period: uint,
    cover-cooldown-period: uint,
    lp-cooldown-period: uint,
    staker-unstake-window: uint,
    cover-unstake-window: uint,
    lp-unstake-window: uint,
    ;; payment-contract: uint,
    paused: bool,
    treasury: principal,
    supplier-interface: principal,
    max-slippage: uint
  }
  {
    grace-period: (* u5 ONE_DAY),
    funding-period: (* u10 ONE_DAY),
    treasury-fee: u50,
    investor-fee: u50,
    lp-cooldown-period: (* u10 ONE_DAY),
    lp-unstake-window:  (* u2 ONE_DAY),
    cover-cooldown-period: (* u10 ONE_DAY),
    cover-unstake-window:  (* u2 ONE_DAY),
    staker-cooldown-period: (* u10 ONE_DAY),
    staker-unstake-window: (* u2 ONE_DAY),
    paused: false,
    treasury: .protocol-treasury,
    ;; supplier-interface: .bridge-router-test,
    supplier-interface: .supplier-interface,
    max-slippage: u1000
  }
)

(define-map rewards-calcs principal bool)
(define-map swaps principal bool)
;; cover pool contracts
(define-map cps principal bool)
;; liquidity-providers contracts
(define-map lps principal bool)
;; zest distribution contracts
(define-map zps principal bool)
;; staking pool contracts
(define-map sps principal bool)
(define-map liquidity-vaults principal bool)
(define-map funding-vaults principal bool)
(define-map xbtc-contracts principal bool)
(define-map coll-vaults principal bool)
(define-map coll-contracts principal bool)
(define-map payments principal bool)



(define-read-only (is-rewards-calc (rewards-calc principal))
  (default-to false (map-get? rewards-calcs rewards-calc))
)

(define-read-only (is-swap (swap principal))
  (default-to false (map-get? swaps swap))
)

(define-read-only (is-cp (cp principal))
  (default-to false (map-get? cps cp))
)

(define-read-only (is-lp (lp principal))
  (default-to false (map-get? lps lp))
)

(define-read-only (is-zp (zp principal))
  (default-to false (map-get? zps zp))
)

(define-read-only (is-sp (sp principal))
  (default-to false (map-get? sps sp))
)

(define-read-only (is-liquidity-vault (liquidity-vault principal))
  (default-to false (map-get? liquidity-vaults liquidity-vault))
)

(define-read-only (is-funding-vault (funding-vault principal))
  (default-to false (map-get? funding-vaults funding-vault))
)

(define-read-only (is-xbtc (xbtc principal))
  (default-to false (map-get? xbtc-contracts xbtc))
)

(define-read-only (is-coll-vault (coll-vault principal))
  (default-to false (map-get? coll-vaults coll-vault))
)

(define-read-only (is-coll-contract (coll-contract principal))
  (default-to false (map-get? coll-contracts coll-contract))
)

(define-read-only (is-payment (payment principal))
  (default-to false (map-get? payments payment))
)

;; map setters

(define-public (set-rewards-calc (rewards-calc principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set rewards-calcs rewards-calc true))
  )
)

(define-public (set-swap (swap principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set swaps swap true))
  )
)

(define-public (set-cp (cp principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set cps cp true))
  )
)

(define-public (set-lp (lp principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set lps lp true))
  )
)

(define-public (set-zp (zp principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set zps zp true))
  )
)

(define-public (set-sp (sp principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set sps sp true))
  )
)

(define-public (set-liquidity-vault (liquidity-vault principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set liquidity-vaults liquidity-vault true))
  )
)

(define-public (set-funding-vault (funding-vault principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set funding-vaults funding-vault true))
  )
)

(define-public (set-xbtc-contract (xbtc-contract principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set xbtc-contracts xbtc-contract true))
  )
)

(define-public (set-coll-vault (coll-vault principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set coll-vaults coll-vault true))
  )
)

(define-public (set-coll-contract (coll-contract principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set coll-contracts coll-contract true))
  )
)

(define-public (set-payment (payment principal))
  (begin
    (try! (is-contract-owner))
    (ok (map-set payments payment true))
  )
)

;; global variable setters

(define-public (set-grace-period (grace-period uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { grace-period: grace-period })))
  )
)

(define-public (set-funding-period (funding-period uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { funding-period: funding-period })))
  )
)

(define-public (set-treasury-fee (treasury-fee uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { treasury-fee: treasury-fee })))
  )
)

(define-public (set-investor-fee (investor-fee uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { investor-fee: investor-fee })))
  )
)

(define-public (set-staker-cooldown-period (staker-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { staker-cooldown-period: staker-cooldown-period })))
  )
)

(define-public (set-lp-cooldown-period (lp-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { lp-cooldown-period: lp-cooldown-period })))
  )
)

(define-public (set-cover-cooldown-period (cover-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { cover-cooldown-period: cover-cooldown-period })))
  )
)
(define-public (set-cover-unstake-window (cover-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { cover-unstake-window: cover-unstake-window })))
  )
)

(define-public (set-staker-unstake-window (staker-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { staker-unstake-window: staker-unstake-window })))
  )
)

(define-public (set-lp-unstake-window (lp-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { lp-unstake-window: lp-unstake-window })))
  )
)

(define-public (set-paused (paused bool))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { paused: paused })))
  )
)

(define-public (set-protocol-treasury (treasury principal))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { treasury: treasury })))
  )
)

(define-public (set-supplier-interface (supplier-interface principal))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { supplier-interface: supplier-interface })))
  )
)

(define-public (set-max-slippage (max-slippage uint))
  (begin
    (try! (is-contract-owner))
    (ok (var-set globals (merge (var-get globals) { max-slippage: max-slippage })))
  )
)

(define-read-only (get-globals)
  (var-get globals)
)

;; -- ownable-trait --

(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner)
  (if (is-eq tx-sender (var-get contract-owner))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-read-only (is-treasury (treasury principal))
  (is-eq (get treasury (var-get globals)) treasury)
)

;; -- onboarding

(define-map onboarded principal bool)

(define-read-only (is-onboarded (user principal))
  (default-to false (map-get? onboarded user))
)

(define-public (is-onboarded-user (user principal))
  (ok (default-to false (map-get? onboarded user)))
)

(define-public (onboard-user (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set onboarded user true))
  )
)

(define-public (offboard-user (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set onboarded user false))
  )
)

(define-constant ERR_UNAUTHORIZED (err u1000))

(map-set rewards-calcs .rewards-calc true)
(map-set swaps .swap-router true)
(map-set cps .cp-token true)
(map-set lps .lp-token true)
(map-set zps .zest-reward-dist true)
(map-set sps .sp-token true)
(map-set liquidity-vaults .liquidity-vault-v1-0 true)
(map-set funding-vaults .funding-vault true)
(map-set xbtc-contracts .xbtc true)
(map-set xbtc-contracts 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin true)
(map-set coll-vaults .coll-vault true)
(map-set coll-contracts .xbtc true)
(map-set payments .payment-fixed true)