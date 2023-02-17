;; contract for holding the global values of the protocol
(impl-trait .ownable-trait.ownable-trait)

(define-constant ONE_DAY
u144)
;; u36)
(define-constant CYCLE (* u14 ONE_DAY))

(define-read-only (get-day-length-default) ONE_DAY)
(define-read-only (get-cycle-length-default) CYCLE)

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
    paused: bool,
    treasury: principal,
    supplier-interface: principal,
    max-slippage: uint,
    contingency-plan: bool
  }
  {
    grace-period: (* u5 ONE_DAY),
    funding-period: (* u10 ONE_DAY),
    treasury-fee: u30,
    investor-fee: u50,
    lp-cooldown-period: (* u10 ONE_DAY),
    lp-unstake-window:  (* u2 ONE_DAY),
    cover-cooldown-period: (* u10 ONE_DAY),
    cover-unstake-window:  (* u2 ONE_DAY),
    staker-cooldown-period: (* u10 ONE_DAY),
    staker-unstake-window: (* u2 ONE_DAY),
    paused: false,
    treasury: .protocol-treasury,
    supplier-interface: .supplier-interface,
    max-slippage: u1000,
    contingency-plan: false
  })

;; zest rewards calculator contracts
(define-map rewards-calcs principal bool)
;; swap router contracts
(define-map swaps principal bool)
;; cover-pool rewards contractss
(define-map cps principal bool)
;; lp xBTC rewards contracts
(define-map lps principal bool)
;; lp zest rewards contracts
(define-map zps principal bool)
;; staking-pool rewards contracts
(define-map sps principal bool)
(define-map liquidity-vaults principal bool)
(define-map funding-vaults principal bool)
;; SIP-010 xbtc contracts
(define-map xbtc-contracts principal bool)
;; SIP-010 to be used as cover
(define-map cover-pool-tokens principal bool)
;; cover-pool xBTC rewards contracts
(define-map cover-rewards-pool-tokens principal bool)
(define-map coll-vaults principal bool)
(define-map cover-vaults principal bool)
;; SIP-010 to be used as collateral
(define-map coll-contracts principal bool)
(define-map payments principal bool)

(define-data-var pool-contract principal .pool-v2-0)
(define-data-var loan-contract principal .loan-v1-0)
(define-data-var cover-pool-contract principal .cover-pool-v1-0)
(define-data-var supplier-interface-contract principal .supplier-interface)

(define-read-only (is-pool-contract (contract principal))
  (is-eq contract (var-get pool-contract)))

(define-read-only (get-pool-contract)
  (var-get pool-contract))

(define-read-only (is-loan-contract (contract principal))
  (is-eq contract (var-get loan-contract)))

(define-read-only (is-supplier-interface (contract principal))
  (is-eq contract (var-get supplier-interface-contract)))

(define-read-only (get-loan-contract)
  (var-get loan-contract))

(define-read-only (is-cover-pool-contract (contract principal))
  (is-eq contract (var-get cover-pool-contract)))

(define-read-only (get-cover-pool-contract)
  (var-get cover-pool-contract))

(define-read-only (is-rewards-calc (rewards-calc principal))
  (default-to false (map-get? rewards-calcs rewards-calc)))

(define-read-only (is-swap (swap principal))
  (default-to false (map-get? swaps swap)))

(define-read-only (is-cp (cp principal))
  (default-to false (map-get? cps cp)))

(define-read-only (is-lp (lp principal))
  (default-to false (map-get? lps lp)))

(define-read-only (is-zp (zp principal))
  (default-to false (map-get? zps zp)))

(define-read-only (is-sp (sp principal))
  (default-to false (map-get? sps sp)))

(define-read-only (is-liquidity-vault (liquidity-vault principal))
  (default-to false (map-get? liquidity-vaults liquidity-vault)))

(define-read-only (is-funding-vault (funding-vault principal))
  (default-to false (map-get? funding-vaults funding-vault)))

(define-read-only (is-xbtc (xbtc principal))
  (default-to false (map-get? xbtc-contracts xbtc)))

(define-read-only (is-coll-vault (coll-vault principal))
  (default-to false (map-get? coll-vaults coll-vault)))

(define-read-only (is-cover-vault (cover-vault principal))
  (default-to false (map-get? cover-vaults cover-vault)))

(define-read-only (is-coll-contract (coll-contract principal))
  (default-to false (map-get? coll-contracts coll-contract)))

(define-read-only (is-payment (payment principal))
  (default-to false (map-get? payments payment)))

(define-read-only (is-cover-pool-token (token principal))
  (default-to false (map-get? cover-pool-tokens token)))

(define-read-only (is-cover-rewards-pool-token (token principal))
  (default-to false (map-get? cover-rewards-pool-tokens token)))

;; map setters
(define-public (set-rewards-calc (rewards-calc principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-rewads-calc", payload: rewards-calc })
    (ok (map-set rewards-calcs rewards-calc true))))

(define-public (set-swap (swap principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-swap", payload: swap })
    (ok (map-set swaps swap true))))

(define-public (set-cp (cp principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-cp", payload: cp })
    (ok (map-set cps cp true))))

(define-public (set-lp (lp principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-lp", payload: lp })
    (ok (map-set lps lp true))))

(define-public (set-zp (zp principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-zp", payload: zp })
    (ok (map-set zps zp true))))

(define-public (set-sp (sp principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-sp", payload: sp })
    (ok (map-set sps sp true))))

(define-public (set-liquidity-vault (liquidity-vault principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-liquidity-vault", payload: liquidity-vault })
    (ok (map-set liquidity-vaults liquidity-vault true))))

(define-public (set-funding-vault (funding-vault principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-funding-vault", payload: funding-vault })
    (ok (map-set funding-vaults funding-vault true))))

(define-public (set-xbtc-contract (xbtc-contract principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-xbtc-vault", payload: xbtc-contract })
    (ok (map-set xbtc-contracts xbtc-contract true))))

(define-public (set-coll-vault (coll-vault principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-coll-vault", payload: coll-vault })
    (ok (map-set coll-vaults coll-vault true))))

(define-public (set-cover-vault (cover-vault principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-cover-vault", payload: cover-vault })
    (ok (map-set cover-vaults cover-vault true))))

(define-public (set-coll-contract (coll-contract principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-coll-contract", payload: coll-contract })
    (ok (map-set coll-contracts coll-contract true))))

(define-public (set-payment (payment principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-payment", payload: payment })
    (ok (map-set payments payment true))))

(define-public (set-cover-pool-token (token principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-cover-pool-token", payload: token })
    (ok (map-set cover-pool-tokens token true))))

(define-public (set-cover-rewards-pool-token (token principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-cover-rewards-pool-token", payload: token })
    (ok (map-set cover-rewards-pool-tokens token true))))

;; global variable setters

(define-public (set-grace-period (grace-period uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { grace-period: grace-period }) })
    (ok (var-set globals (merge (var-get globals) { grace-period: grace-period })))))

(define-public (set-funding-period (funding-period uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { funding-period: funding-period }) })
    (ok (var-set globals (merge (var-get globals) { funding-period: funding-period })))))

(define-public (set-treasury-fee (treasury-fee uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { treasury-fee: treasury-fee }) })
    (ok (var-set globals (merge (var-get globals) { treasury-fee: treasury-fee })))))

(define-public (set-investor-fee (investor-fee uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { investor-fee: investor-fee }) })
    (ok (var-set globals (merge (var-get globals) { investor-fee: investor-fee })))))

(define-public (set-staker-cooldown-period (staker-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { staker-cooldown-period: staker-cooldown-period }) })
    (ok (var-set globals (merge (var-get globals) { staker-cooldown-period: staker-cooldown-period })))))

(define-public (set-lp-cooldown-period (lp-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { lp-cooldown-period: lp-cooldown-period }) })
    (ok (var-set globals (merge (var-get globals) { lp-cooldown-period: lp-cooldown-period })))))

(define-public (set-cover-cooldown-period (cover-cooldown-period uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { cover-cooldown-period: cover-cooldown-period }) })
    (ok (var-set globals (merge (var-get globals) { cover-cooldown-period: cover-cooldown-period })))))

(define-public (set-cover-unstake-window (cover-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { cover-unstake-window: cover-unstake-window }) })
    (ok (var-set globals (merge (var-get globals) { cover-unstake-window: cover-unstake-window })))))

(define-public (set-staker-unstake-window (staker-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { staker-unstake-window: staker-unstake-window }) })
    (ok (var-set globals (merge (var-get globals) { staker-unstake-window: staker-unstake-window })))))

(define-public (set-lp-unstake-window (lp-unstake-window uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { lp-unstake-window: lp-unstake-window }) })
    (ok (var-set globals (merge (var-get globals) { lp-unstake-window: lp-unstake-window })))))

(define-public (set-paused (paused bool))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { paused: paused }) })
    (ok (var-set globals (merge (var-get globals) { paused: paused })))))

(define-public (set-protocol-treasury (treasury principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { treasury: treasury }) })
    (ok (var-set globals (merge (var-get globals) { treasury: treasury })))))

(define-public (set-supplier-interface (supplier-interface principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { supplier-interface: supplier-interface }) })
    (ok (var-set globals (merge (var-get globals) { supplier-interface: supplier-interface })))))

(define-public (set-max-slippage (max-slippage uint))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { max-slippage: max-slippage }) })
    (ok (var-set globals (merge (var-get globals) { max-slippage: max-slippage })))))

(define-public (set-contingency-plan (contingency-plan bool))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-globals", payload: (merge (var-get globals) { contingency-plan: contingency-plan }) })
    (ok (var-set globals (merge (var-get globals) { contingency-plan: contingency-plan })))))

(define-read-only (get-globals)
  (var-get globals))

;; -- contract setters

(define-public (set-pool-contract (contract principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-pool-contract", payload: { contract: contract } })
    (ok (var-set pool-contract contract))))

(define-public (set-loan-contract (contract principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-loan-contract", payload: { contract: contract } })
    (ok (var-set loan-contract contract))))

(define-public (set-cover-pool-contract (contract principal))
  (begin
    (try! (is-contract-owner))
    (print { type: "set-cover-pool-contract", payload: { contract: contract } })
    (ok (var-set cover-pool-contract contract))))

;; -- ownable-trait --

(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
		(try! (is-contract-owner))
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner)
  (if (is-eq tx-sender (var-get contract-owner)) (ok true) ERR_UNAUTHORIZED))

;; -- onboarding

(define-map onboarded-address { user: principal, btc-version: (buff 1), btc-hash: (buff 20) } bool)
;; user -> number of addresses
(define-map onboarded-user principal uint)

;; @desc returns true if user has been onboarded
;; @param user: address to be queried
;; @returns boolean
(define-read-only (is-onboarded-user-read (user principal))
  (> (default-to u0 (map-get? onboarded-user user)) u0))

(define-public (is-onboarded-user (user principal))
  (ok (> (default-to u0 (map-get? onboarded-user user)) u0)))

;; @desc returns true if user and their btc address has been onboarded
;; @param user: Stacks address to be mapped to
;; @param btc-version: bitcoin transaction version
;; @param btc-hash: bitcoin address hash
;; @returns boolean
(define-read-only (is-onboarded-address-read (user principal) (btc-version (buff 1)) (btc-hash (buff 20)))
  (default-to false (map-get? onboarded-address { user: user, btc-version: btc-version, btc-hash: btc-hash })))

(define-public (is-onboarded-address (user principal) (btc-version (buff 1)) (btc-hash (buff 20)))
  (ok (default-to false (map-get? onboarded-address { user: user, btc-version: btc-version, btc-hash: btc-hash }))))

;; @desc adds btc-address to map of onboarded addresses and increases the counter by 1
;; @param user: Stacks address to be mapped to
;; @param btc-version: bitcoin transaction version
;; @param btc-hash: bitcoin address hash
;; @returns true
(define-public (onboard-user-address (user principal) (btc-version (buff 1)) (btc-hash (buff 20)))
  (let (
    (num-adds (default-to u0 (map-get? onboarded-user user)))
  )
		(try! (is-contract-owner))
    (map-set onboarded-user user (+ u1 num-adds))
    (print { type: "onboard-user", payload: { key: { user: user },  btc-version: btc-version, btc-hash: btc-hash } })
    (ok (map-set onboarded-address { user: user, btc-version: btc-version, btc-hash: btc-hash } true))))

;; @desc removes btc-address to map of onboarded addresses and reduces the counter by 1
;; @param user: Stacks address to be mapped to
;; @param btc-version: bitcoin transaction version
;; @param btc-hash: bitcoin address hash
;; @returns true
(define-public (offboard-user-address (user principal) (btc-version (buff 1)) (btc-hash (buff 20)))
  (let (
    (num-adds (default-to u0 (map-get? onboarded-user user)))
  )
		(try! (is-contract-owner))
    (asserts! (> num-adds u0) ERR_ALREADY_OFFBOARDED)
    (map-set onboarded-user user (- num-adds u1))
    (print { type: "offboard-user", payload: { key: { user: user },  btc-version: btc-version, btc-hash: btc-hash } })
    (ok (map-delete onboarded-address { user: user, btc-version: btc-version, btc-hash: btc-hash }))))

;; -- admin
(define-map admins principal bool)

;; @desc add admin
;; @param admin: principal to be added
;; @returns (response true uint)
(define-public (add-admin (admin principal))
  (begin
		(try! (is-contract-owner))
    (print { type: "add-admin", payload: { key: { admin: admin }} })
		(ok (map-set admins admin true))))

;; @desc remove admin
;; @param admin: principal to be removed
;; @returns (response true uint)
(define-public (remove-admin (admin principal))
  (begin
		(try! (is-contract-owner))
    (print { type: "remove-admin", payload: { key: { admin: admin }} })
		(ok (map-set admins admin false))))

(define-read-only (is-admin (admin principal))
  (default-to false (map-get? admins admin)))

;; -- governor
(define-map governors principal bool)

;; @desc add global governor
;; @param governor: principal to be added
;; @returns (response true uint)
(define-public (add-governor (governor principal))
  (begin
		(try! (is-contract-owner))
    (print { type: "add-governor", payload: { key: { governor: governor }} })
		(ok (map-set governors governor true))))

;; @desc remove global governor
;; @param governor: principal to be added
;; @returns (response true uint)
(define-public (remove-governor (governor principal))
  (begin
		(try! (is-contract-owner))
    (print { type: "remove-governor", payload: { key: { governor: governor }} })
		(ok (map-set governors governor false))))

(define-read-only (is-governor (governor principal))
  (default-to false (map-get? governors governor)))

(map-set rewards-calcs .rewards-calc true)
(map-set swaps .swap-router true)
(map-set swaps .swap-router-xbtc-xusd true)
(map-set cps .cp-token true)
(map-set lps .lp-token true)
(map-set lps .lp-token-0 true)
(map-set zps .zest-reward-dist true)
(map-set sps .xZest-token true)
(map-set liquidity-vaults .liquidity-vault-v1-0 true)
(map-set funding-vaults .funding-vault true)
(map-set xbtc-contracts .xbtc true)
(map-set xbtc-contracts .Wrapped-Bitcoin true)
(map-set xbtc-contracts 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin true)
(map-set coll-vaults .coll-vault true)
(map-set cover-vaults .cover-vault true)
(map-set coll-contracts .xbtc true)
(map-set coll-contracts .Wrapped-Bitcoin true)
(map-set payments .payment-fixed true)
(map-set cover-pool-tokens .zge000-governance-token true)
(map-set cover-pool-tokens .xbtc true)
(map-set cover-pool-tokens .Wrapped-Bitcoin true)
(map-set cover-pool-tokens 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin true)
(map-set cover-rewards-pool-tokens .cp-rewards-token true)

;; ERROR START 16000
(define-constant ERR_UNAUTHORIZED (err u16000))
(define-constant ERR_TOO_MANY_ADDRESSES (err u16001))
(define-constant ERR_ALREADY_OFFBOARDED (err u16002))