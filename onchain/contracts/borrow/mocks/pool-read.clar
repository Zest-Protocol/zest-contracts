(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(use-trait oracle-trait .oracle-trait.oracle-trait)

;; How to check when user is in isolation mode
;; 1) Get assets supplied with (get-user-assets)
;; 2) Filter supplied assets by assets that are isolated
;; 3) Filter isolated supplied assets by being enabled as collateral
;; 4) 

(define-read-only (is-in-isolation-mode (who principal))
  (let (
    (assets-supplied (get assets-supplied (get-user-assets who)))
    (split-assets (fold split-isolated assets-supplied { isolated: (list), non-isolated: (list) }))
    (enabled-isolated (fold count-collateral-enabled (get isolated split-assets) { who: who, enabled-count: u0, enabled-assets: (list) }))
    (enabled-isolated-n (get enabled-count enabled-isolated))
    (enabled-non-isolated-n  (get enabled-count (fold count-collateral-enabled (get non-isolated split-assets) { who: who, enabled-count: u0, enabled-assets: (list) })))
  )
    (if (is-eq enabled-non-isolated-n u0)
      (if (is-eq enabled-isolated-n u1)
        (element-at? (get enabled-assets enabled-isolated) u0)
        none
      )
      none
    )
  )
)

(define-read-only (is-borroweable (asset principal))
  (and
    (contract-call? .pool-0-reserve is-active asset)
    (not (contract-call? .pool-0-reserve is-frozen asset))
    (contract-call? .pool-0-reserve is-borrowing-enabled asset)
  )
)

(define-read-only (is-active (asset principal))
  (and (contract-call? .pool-0-reserve is-active asset) (not (contract-call? .pool-0-reserve is-frozen asset)))
)

(define-constant available-assets (list .diko .sBTC .wstx .stSTX .xUSD .USDA ))

(define-read-only (get-supplieable-assets)
  ;; (filter is-active available-assets)
  available-assets
)

(define-read-only (get-borroweable-assets)
  ;; (filter is-borroweable available-assets)
  available-assets
)

(define-read-only (is-isolated-asset (asset principal))
  (contract-call? .pool-0-reserve is-isolated-type asset)
)

(define-read-only (get-isolated-mode-assets)
  (filter is-isolated-asset available-assets)
)

(define-read-only (is-borroweable-in-isolation (asset principal))
  (contract-call? .pool-0-reserve is-borroweable-isolated asset)
)

(define-read-only (get-borroweable-assets-in-isolated-mode)
  (filter is-borroweable-in-isolation available-assets)
)

(define-public (borrowing-power-in-asset
  (asset <ft>)
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (asset-principal (contract-of asset))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state asset-principal))
    (user-assets (contract-call? .pool-0-reserve get-user-assets user))
    (user-global-data (try! (contract-call? .pool-0-reserve calculate-user-global-data user assets)))
    (asset-price (try! (contract-call? .oracle get-asset-price asset)))
  )
    (calculate-available-borrowing-power-in-asset
      asset
      (get decimals reserve-state)
      asset-price
      (get total-collateral-balanceUSD user-global-data)
      (get total-borrow-balanceUSD user-global-data)
      (get user-total-feesUSD user-global-data)
      (get current-ltv user-global-data)
      user
    )
  )
)


;; - "({ asset: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stSTX , lp-token: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.lp-stSTX , oracle: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.oracle })"
;; calculate how much a user can borrow of a specific asset using the available collateral
(define-read-only (calculate-available-borrowing-power-in-asset
  (borrowing-asset <ft>)
  (decimals uint)
  (asset-price uint)
  (current-user-collateral-balance-USD uint)
  (current-user-borrow-balance-USD uint)
  (current-fees-USD uint)
  (current-ltv uint)
  (user principal)
  )
  (let (
    (available-borrow-power-in-base-currency
      (if (> (mul current-user-collateral-balance-USD current-ltv) (+ current-user-borrow-balance-USD current-fees-USD))
        (-
          (mul current-user-collateral-balance-USD current-ltv)
          (+ current-user-borrow-balance-USD current-fees-USD)
        )
        u0
      )
    )
    (borrow-power-in-asset-amount
      (contract-call? .math from-fixed-to-precision
        (div
          available-borrow-power-in-base-currency
          asset-price
        )
        decimals
      )
    )
    (borrow-fee (try! (contract-call? .fees-calculator calculate-origination-fee user (contract-of borrowing-asset) borrow-power-in-asset-amount decimals)))
  )
    (ok (- borrow-power-in-asset-amount borrow-fee))
  )
)


(define-read-only (is-used-as-collateral (who principal) (asset principal))
  (get use-as-collateral (contract-call? .pool-0-reserve get-user-reserve-data who asset))
)

(define-read-only (get-user-reserve-data (who principal) (asset principal))
  (contract-call? .pool-0-reserve get-user-reserve-data who asset)
)

(define-read-only (get-reserve-state (reserve principal))
  (contract-call? .pool-0-reserve get-reserve-state-optional reserve)
)

(define-read-only (get-asset-supply-apy (reserve principal))
  (let (
    (reserve-resp (unwrap-panic (get-reserve-state reserve)))
  )
    (contract-call? .pool-0-reserve calculate-linear-interest
      (get current-liquidity-rate reserve-resp)
      (* u144 u365)
    )
  )
)

(define-read-only (get-asset-borrow-apy (reserve principal))
  (let (
    (reserve-resp (unwrap-panic (get-reserve-state reserve)))
  )
    (calculate-compounded-interest
      (get current-variable-borrow-rate reserve-resp)
      (* u144 u365)
    )
  )
)

(define-read-only (get-collateral-available
  (assets (list 100 { asset: principal, amount: uint}))
  (oracle principal)
  )
  (begin
    ;; (map token-to-available-collateral assets)
    u0
    ;; (mul (get amount item) (contract-call? .oracle get-unit-price (get asset item) ))
    ;; (contract-call? .pool-0-reserve get-collateral-available assets oracle)
  )
)

(define-read-only (get-borrow-balance-amount (who principal) (asset <ft>))
  (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who (contract-of asset)))
)

(define-read-only (token-to-usd (amount uint) (decimals uint) (unit-price uint))
  (contract-call? .math mul-to-fixed-precision amount decimals unit-price)
)

;; (define-read-only (get-borrow-balance-value (who principal) (asset <ft>) (oracle principal))
;;   (let (
;;     (borrow-balance (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who (contract-of asset))))
;;   )
;;     (token-to-usd
;;       borrow-balance
;;       ;; (unwrap-panic (contract-call? asset get-decimals))
;;       ;; u6
;;       (unwrap-panic (contract-call? .oracle get-asset-price asset))
;;     )
;;   )
;; )


;; (define-private (token-to-usd-internal
;;   (item { asset: <ft>, amount: uint})
;; )
;;   (mul (get amount item) (unwrap-panic (contract-call? .oracle get-asset-price (get asset item) )))
;; )

;; (define-read-only (get-balance (asset <ft>) (who principal))
;;   (contract-call? asset get-balance who)
;; )


;; Define a helper function to get reserve data
(define-read-only (get-reserve-data (asset principal))
  (contract-call? .pool-0-reserve get-reserve-state asset)
)

;; Getter for each field in the tuple

(define-read-only (get-last-liquidity-cumulative-index (asset principal))
  (get last-liquidity-cumulative-index (get-reserve-data asset))
)

(define-read-only (get-current-liquidity-rate (asset principal))
  (get current-liquidity-rate (contract-call? .pool-0-reserve get-reserve-state asset))
)

(define-read-only (get-total-borrows-stable (asset principal))
  (get total-borrows-stable (contract-call? .pool-0-reserve get-reserve-state asset))
)

(define-read-only (get-total-borrows-variable (asset principal))
  (get total-borrows-variable (get-reserve-data asset))
)

(define-read-only (get-current-variable-borrow-rate (asset principal))
  (get current-variable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-current-stable-borrow-rate (asset principal))
  (get current-stable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-current-average-stable-borrow-rate (asset principal))
  (get current-average-stable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-last-variable-borrow-cumulative-index (asset principal))
  (get last-variable-borrow-cumulative-index (get-reserve-data asset))
)

(define-read-only (get-base-ltv-as-collateral (asset principal))
  (get base-ltv-as-collateral (get-reserve-data asset))
)

(define-read-only (get-liquidation-threshold (asset principal))
  (get liquidation-threshold (get-reserve-data asset))
)

(define-read-only (get-liquidation-bonus (asset principal))
  (get liquidation-bonus (get-reserve-data asset))
)

(define-read-only (get-decimals (asset principal))
  (get decimals (get-reserve-data asset))
)

(define-read-only (get-a-token-address (asset principal))
  (get a-token-address (get-reserve-data asset))
)

(define-read-only (get-interest-rate-strategy-address (asset principal))
  (get interest-rate-strategy-address (get-reserve-data asset))
)

(define-read-only (get-last-updated-block (asset principal))
  (get last-updated-block (get-reserve-data asset))
)

(define-read-only (get-borrowing-enabled (asset principal))
  (get borrowing-enabled (get-reserve-data asset))
)

(define-read-only (get-usage-as-collateral-enabled (asset principal))
  (get usage-as-collateral-enabled (get-reserve-data asset))
)

(define-read-only (get-is-stable-borrow-rate-enabled (asset principal))
  (get is-stable-borrow-rate-enabled (get-reserve-data asset))
)

(define-read-only (get-is-active (asset principal))
  (get is-active (get-reserve-data asset))
)

(define-read-only (get-is-frozen (asset principal))
  (get is-frozen (get-reserve-data asset))
)

(define-read-only (get-user-borrow-balance-diko (who principal))
  (ok (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko))))
)

(define-read-only (get-user-borrow-balance-sBTC (who principal))
  (ok (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC))))
)

(define-read-only (get-user-borrow-balance-stSTX (who principal))
  (ok (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))))
)

(define-read-only (get-user-borrow-balance-USDA (who principal))
  (ok (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA))))
)

(define-read-only (get-user-borrow-balance-xUSD (who principal))
  (ok (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD))))
)

(define-read-only (get-cumulated-balance-stSTX (who principal) (lp-token <ft-mint-trait>) (asset principal))
  (unwrap-panic (contract-call? .lp-stSTX get-balance who))
)

(define-read-only (get-cumulated-balance-sBTC (who principal) (lp-token <ft-mint-trait>) (asset principal))
  (unwrap-panic (contract-call? .lp-sBTC get-balance who))
)

(define-read-only (get-cumulated-balance-diko (who principal) (lp-token <ft-mint-trait>) (asset principal))
  (unwrap-panic (contract-call? .lp-diko get-balance who))
)

(define-read-only (get-cumulated-balance-USDA (who principal) (lp-token <ft-mint-trait>) (asset principal))
  (unwrap-panic (contract-call? .lp-USDA get-balance who))
)

(define-read-only (get-cumulated-balance-xUSD (who principal) (lp-token <ft-mint-trait>) (asset principal))
  (unwrap-panic (contract-call? .lp-xUSD get-balance who))
)

(define-read-only (get-max-borroweable
  (useable-collateral uint)
  (borrowed-collateral uint)
  (decimals uint)
  (asset-to-borrow <ft>))
  (let ((price (unwrap-panic (contract-call? .oracle get-asset-price asset-to-borrow))))
    (contract-call? .math mul-to-fixed-precision (- useable-collateral borrowed-collateral) decimals price)
  )
)

;; (define-read-only (get-useable-collateral-usd (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       {
;;         diko-useable-collateral-usd:
;;           (if (is-eq isolated-asset .diko)
;;             (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
;;               (token-to-usd
;;                 .diko
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-diko
;;                     .diko
;;                     (unwrap-panic (contract-call? .lp-diko get-balance who))
;;                     ))))
;;             )
;;             u0
;;           )
;;           ,
;;         sBTC-useable-collateral-usd:
;;           (if (is-eq isolated-asset .sBTC)
;;             (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
;;               (token-to-usd
;;                 .sBTC
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-sBTC
;;                     .sBTC
;;                     (unwrap-panic (contract-call? .lp-sBTC get-balance who))
;;                     ))))
;;             )
;;             u0
;;           )
;;           ,
;;         stSTX-useable-collateral-usd:
;;           (if (is-eq isolated-asset .stSTX)
;;             (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
;;               (token-to-usd
;;                 .stSTX
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-stSTX
;;                     .stSTX
;;                     (unwrap-panic (contract-call? .lp-stSTX get-balance who))
;;                     ))))
;;             )
;;             u0
;;           )
;;           ,
;;         USDA-useable-collateral-usd:
;;           (if (is-eq isolated-asset .USDA)
;;             (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
;;               (token-to-usd
;;                 .USDA
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-USDA
;;                     .USDA
;;                     (unwrap-panic (contract-call? .lp-USDA get-balance who))
;;                     ))))
;;             )
;;             u0
;;           )
;;           ,
;;         xUSD-useable-collateral-usd:
;;           (if (is-eq isolated-asset .xUSD)
;;             (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
;;               (token-to-usd
;;                 .xUSD
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-xUSD
;;                     .xUSD
;;                     (unwrap-panic (contract-call? .lp-xUSD get-balance who))
;;                     ))))
;;             )
;;             u0
;;           )
;;       }
;;     )
;;   (begin
;;     {
;;       diko-useable-collateral-usd:
;;         (mul
;;               (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
;;               (token-to-usd
;;                 .diko
;;                 .oracle
;;                 (get new-user-balance
;;                   (unwrap-panic (contract-call? .pool-0-reserve
;;                     get-cumulated-balance-read
;;                     who
;;                     .lp-diko
;;                     .diko
;;                     (unwrap-panic (contract-call? .lp-diko get-balance who))
;;                     ))))
;;             )
;;         ,
;;       sBTC-useable-collateral-usd:
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
;;           (token-to-usd
;;             .sBTC
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-sBTC
;;                 .sBTC
;;                 (unwrap-panic (contract-call? .lp-sBTC get-balance who))
;;                 )
;;               )
;;             )
;;           )
;;         )
;;         ,
;;       stSTX-useable-collateral-usd:
;;         ;; (mul
;;         ;;   (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
;;         ;;   (token-to-usd who .stSTX .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))))
;;         ;; )
;;         ;; 0 because cannot be used unless in isolation mode
;;         u0
;;         ,
;;       USDA-useable-collateral-usd:
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
;;           (token-to-usd
;;             .USDA
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-USDA
;;                 .USDA
;;                 (unwrap-panic (contract-call? .lp-USDA get-balance who))
;;                 )
;;               )
;;             )
;;           )
;;         )
;;         ,
;;       xUSD-useable-collateral-usd:
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
;;           (token-to-usd
;;             .xUSD
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-xUSD
;;                 .xUSD
;;                 (unwrap-panic (contract-call? .lp-xUSD get-balance who))
;;                 )
;;               )
;;             )
;;           )
;;         )
;;         ,
;;     }
;;   )
;;   )
;; )

;; (define-read-only (get-useable-collateral-usd-diko (collateral-amount uint) (who principal))
;;   (begin
;;     (mul
;;       u80000000
;;       (token-to-usd
;;         collateral-amount
;;         u6
;;         (unwrap-panic (contract-call? .oracle get-asset-price .diko))
;;       )
;;     )
;;   )
;; )

;; only functions property if user is in isolated mode
(define-read-only (get-isolated-asset (who principal))
  (let (
    (assets-supplied (get assets-supplied (get-user-assets who)))
    (split-assets (fold split-isolated assets-supplied { isolated: (list), non-isolated: (list) }))
  )
    (unwrap-panic (element-at (get enabled-assets (fold count-collateral-enabled (get isolated split-assets) { who: who, enabled-count: u0, enabled-assets: (list) })) u0))
  )
)

(define-read-only (get-user-assets (who principal))
  (default-to
    { assets-supplied: (list), assets-borrowed: (list) }
    (contract-call? .pool-reserve-data get-user-assets-read who)))

;; util function
(define-read-only (split-isolated (asset principal) (ret { isolated: (list 100 principal), non-isolated: (list 100 principal) }))
  (if (is-isolated-type asset)
    {
      isolated: (unwrap-panic (as-max-len? (append (get isolated ret) asset) u100)) ,
      non-isolated: (get non-isolated ret)
    }
    {
      isolated: (get isolated ret),
      non-isolated: (unwrap-panic (as-max-len? (append (get non-isolated ret) asset) u100))
    }
  )
)

;; util function
(define-read-only (count-collateral-enabled (asset principal) (ret { who: principal, enabled-count: uint, enabled-assets: (list 100 principal) }))
  (if (get use-as-collateral (get-user-reserve-data (get who ret) asset))
    (merge ret {
        enabled-count: (+ (get enabled-count ret) u1),
        enabled-assets: (unwrap-panic (as-max-len? (append (get enabled-assets ret) asset) u100))
      })
    ret
  )
)


(define-read-only (is-isolated-type (asset principal))
  (default-to false (contract-call? .pool-reserve-data get-isolated-assets-read asset)))

(define-read-only (get-useable-collateral-usd-diko (who principal))
  (begin
    (mul
      (get base-ltv-as-collateral (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .diko)))
      (token-to-usd (get-cumulated-balance-user-diko who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
    )
  )
)

(define-read-only (get-useable-collateral-usd-sBTC (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-USDA get-principal-balance who)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .sBTC)))
    (asset-decimals u8)
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .sBTC)))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)))
        )
      (mul
        base-ltv-as-collateral
        (mul
        (mul-to-fixed-precision
          asset-balance
          asset-decimals
          (div reserve-normalized-income user-index))
        (unwrap-panic (contract-call? .oracle get-asset-price .sBTC))
        )
      )
  )
)

(define-read-only (get-useable-collateral-usd-wstx (who principal))
  (begin
    (mul
      (get base-ltv-as-collateral (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .wstx)))
      (token-to-usd (get-cumulated-balance-user-wstx who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
    )
  )
)

(define-read-only (get-useable-collateral-usd-stSTX (who principal))
  (begin
    (mul
      (get base-ltv-as-collateral (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .stSTX)))
      (token-to-usd (get-cumulated-balance-user-stSTX who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
    )
  )
)

(define-read-only (get-useable-collateral-usd-xUSD (who principal))
  (begin
    (mul
      (get base-ltv-as-collateral (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .xUSD)))
      (token-to-usd (get-cumulated-balance-user-xUSD who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
    )
  )
)

(define-read-only (get-useable-collateral-usd-USDA (who principal))
  (begin
    (mul
      (get base-ltv-as-collateral (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .USDA)))
      (token-to-usd (get-cumulated-balance-user-USDA who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
    )
  )
)

;; (define-read-only (get-useable-collateral-usd-stSTX (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       (if (is-eq isolated-asset .stSTX)
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
;;           (token-to-usd
;;             .stSTX
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-stSTX
;;                 .stSTX
;;                 (unwrap-panic (contract-call? .lp-stSTX get-balance who))
;;                 ))))
;;         )
;;         u0
;;       )
;;     )
;;     (begin
;;       u0
;;     )
;;   )
;; )


;; (define-read-only (get-useable-collateral-usd-USDA (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       (if (is-eq isolated-asset .USDA)
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
;;           (token-to-usd
;;             .USDA
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-USDA
;;                 .USDA
;;                 (unwrap-panic (contract-call? .lp-USDA get-balance who))
;;                 ))))
;;         )
;;         u0
;;       )
;;     )
;;     (begin
;;       (mul
;;         (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
;;         (token-to-usd
;;           .USDA
;;           .oracle
;;           (get new-user-balance
;;             (unwrap-panic (contract-call? .pool-0-reserve
;;               get-cumulated-balance-read
;;               who
;;               .lp-USDA
;;               .USDA
;;               (unwrap-panic (contract-call? .lp-USDA get-balance who))
;;               ))))
;;       )
;;     )
;;   )
;; )

;; (define-read-only (get-useable-collateral-usd-xUSD (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       (if (is-eq isolated-asset .xUSD)
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
;;           (token-to-usd
;;             .xUSD
;;             .oracle
;;             (get new-user-balance (contract-call? .lp-xUSD get-balance who)))
;;         )
;;         u0
;;       )
;;     )
;;     (begin
;;       (mul
;;         (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
;;         (token-to-usd
;;           .xUSD
;;           .oracle
;;           (get new-user-balance
;;             (unwrap-panic (contract-call? .pool-0-reserve
;;               get-cumulated-balance-read
;;               who
;;               .lp-xUSD
;;               .xUSD
;;               (unwrap-panic (contract-call? .lp-xUSD get-balance who))
;;               ))))
;;       )
;;     )
;;   )
;; )

;; get amount that user can decrease based on asset that user wishes to borrow
(define-public (get-decrease-balance-allowed
  (asset <ft>)
  (oracle <oracle-trait>)
  (user principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (reserve-data (unwrap-panic (get-reserve-state (contract-of asset))))
    (user-data (get-user-reserve-data user (contract-of asset)))
    (user-global-data (unwrap-panic (contract-call? .pool-0-reserve calculate-user-global-data user assets-to-calculate)))
    (asset-price (unwrap-panic (contract-call? oracle get-asset-price asset)))
    (useable-collateral-in-base-currency
      (mul
        (- (get total-collateral-balanceUSD user-global-data) (+ (get total-borrow-balanceUSD user-global-data) (get user-total-feesUSD user-global-data)))
        (get current-liquidation-threshold user-global-data)))
    (amount-to-decrease
      (contract-call? .math from-fixed-to-precision
        (div
          useable-collateral-in-base-currency
          asset-price
        )
        (get decimals reserve-data)
      ))
  )
    (ok { amount-to-decrease: amount-to-decrease, useable-collateral-in-base-currency: useable-collateral-in-base-currency })
  )
)

(define-read-only (get-borrowed-balance-user-usd-diko (who principal))
  (let (
    (balance (get-borrowed-balance-user-diko who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-sBTC (who principal))
  (let (
    (balance (get-borrowed-balance-user-sBTC who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-wstx (who principal))
  (let (
    (balance (get-borrowed-balance-user-wstx who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-stSTX (who principal))
  (let (
    (balance (get-borrowed-balance-user-stSTX who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-USDA (who principal))
  (let (
    (balance (get-borrowed-balance-user-USDA who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-xUSD (who principal))
  (let (
    (balance (get-borrowed-balance-user-xUSD who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal-balance balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-diko (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .diko)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .diko)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-borrowed-balance-user-sBTC (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .sBTC)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .sBTC)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-borrowed-balance-user-wstx (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .wstx)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .wstx)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-borrowed-balance-user-stSTX (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .stSTX)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .stSTX)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-borrowed-balance-user-xUSD (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .xUSD)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .xUSD)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-borrowed-balance-user-USDA (who principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who .USDA)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .USDA)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: (- cumulated-balance principal),
    }
  )
)

(define-read-only (get-compounded-borrow-balance
  ;; user-data
  (principal-borrow-balance uint)
  (stable-borrow-rate uint)
  (last-updated-block uint)
  (last-variable-borrow-cumulative-index uint)
  ;; reserve-data
  (current-variable-borrow-rate uint)
  (last-variable-borrow-cumulative-index-reserve uint)
  (last-updated-block-reserve uint)
  )
  (let (
    (user-cumulative-index
      (if (is-eq last-variable-borrow-cumulative-index u0)
        last-variable-borrow-cumulative-index-reserve
        last-variable-borrow-cumulative-index
      )
    )
    (cumulated-interest
      (if (> stable-borrow-rate u0)
        u0
        (div
          (mul
            (calculate-compounded-interest
              current-variable-borrow-rate
              (- burn-block-height last-updated-block))
            last-variable-borrow-cumulative-index-reserve)
          user-cumulative-index)
      ))
    (compounded-balance (mul principal-borrow-balance cumulated-interest)))
    (if (is-eq compounded-balance principal-borrow-balance)
      (if (is-eq last-updated-block burn-block-height)
        (+ principal-borrow-balance u1)
        compounded-balance
      )
      compounded-balance
    )
  )
)

(define-read-only (get-amount-in-usd (who principal) (amount uint) (oracle principal) (asset <ft>))
  (token-to-usd amount u6 (unwrap-panic (contract-call? .oracle get-asset-price asset)))
)

(define-read-only (get-supplied-balance-user-usd-diko (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-diko who) u8 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
)

(define-read-only (get-supplied-balance-user-usd-sBTC (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-sBTC who) u8 (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
)

(define-read-only (get-supplied-balance-user-usd-wstx (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-wstx who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
)

(define-read-only (get-supplied-balance-user-usd-stSTX (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-stSTX who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
)

(define-read-only (get-supplied-balance-user-usd-USDA (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-USDA who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
)

(define-read-only (get-supplied-balance-user-usd-xUSD (who principal) (oracle principal))
  (token-to-usd (get-cumulated-balance-user-xUSD who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
)

(define-read-only (get-principal-balance-user-diko (who principal))
  (unwrap-panic (contract-call? .lp-diko get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-diko (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-diko get-principal-balance who))))
    (calculate-cumulated-balance who u6 .diko principal u6)
  )
)

(define-read-only (get-principal-balance-user-sBTC (who principal))
  (unwrap-panic (contract-call? .lp-sBTC get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-sBTC (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-sBTC get-principal-balance who))))
    (calculate-cumulated-balance who u8 .sBTC principal u8)
  )
)

(define-read-only (get-principal-balance-user-wstx (who principal))
  (unwrap-panic (contract-call? .lp-wstx get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-wstx (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-wstx get-principal-balance who))))
    (calculate-cumulated-balance who u6 .wstx principal u6)
  )
)

(define-read-only (get-principal-balance-user-stSTX (who principal))
  (unwrap-panic (contract-call? .lp-stSTX get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-stSTX (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-stSTX get-principal-balance who))))
    (calculate-cumulated-balance who u6 .stSTX principal u6)
  )
)

(define-read-only (get-principal-balance-user-xUSD (who principal))
  (unwrap-panic (contract-call? .lp-xUSD get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-xUSD (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-xUSD get-principal-balance who))))
    (calculate-cumulated-balance who u6 .xUSD principal u6)
  )
)

(define-read-only (get-principal-balance-user-USDA (who principal))
  (unwrap-panic (contract-call? .lp-USDA get-principal-balance who))
)

(define-read-only (get-cumulated-balance-user-USDA (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-USDA get-principal-balance who))))
    (calculate-cumulated-balance who u6 .USDA principal u6)
  )
)

(define-read-only (calculate-cumulated-balance
  (who principal)
  (lp-decimals uint)
  (asset <ft>)
  (asset-balance uint)
  (asset-decimals uint))
  (let (
    (asset-principal (contract-of asset))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset-principal)))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who (contract-of asset))))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)))
        )
      (from-fixed-to-precision
        (mul-to-fixed-precision
          asset-balance
          asset-decimals
          (div reserve-normalized-income user-index)
        )
        asset-decimals
      )
  )
)

(define-constant sb-by-sy u1903)

(define-read-only (get-normalized-income
  (current-liquidity-rate uint)
  (last-updated-block uint)
  (last-liquidity-cumulative-index uint))
  (let (
    (cumulated 
      (calculate-linear-interest
        current-liquidity-rate
        (- burn-block-height last-updated-block))))
    (mul cumulated last-liquidity-cumulative-index)
  )
)

(define-read-only (calculate-linear-interest
  (current-liquidity-rate uint)
  (delta uint))
  (let (
    (years-elapsed (* delta u1903))
  )
    (+ one-8 (mul years-elapsed current-liquidity-rate))
  )
)

(define-read-only (get-supplied-balance-usd-diko)
  (token-to-usd (unwrap-panic (contract-call? .diko get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
)

(define-read-only (get-supplied-balance-usd-sBTC)
  (token-to-usd (unwrap-panic (contract-call? .sBTC get-balance .pool-vault)) u8 (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
)

(define-read-only (get-supplied-balance-usd-stSTX)
  (token-to-usd (unwrap-panic (contract-call? .stSTX get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
)

(define-read-only (get-supplied-balance-usd-USDA)
  (token-to-usd (unwrap-panic (contract-call? .USDA get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
)

(define-read-only (get-supplied-balance-usd-xUSD)
  (token-to-usd (unwrap-panic (contract-call? .xUSD get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
)

(define-read-only (get-supplied-balance-diko)
  (unwrap-panic (contract-call? .diko get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-sBTC)
  (unwrap-panic (contract-call? .sBTC get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-stSTX)
  (unwrap-panic (contract-call? .stSTX get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-USDA)
  (unwrap-panic (contract-call? .USDA get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-xUSD)
  (unwrap-panic (contract-call? .xUSD get-balance .pool-vault))
)

(define-read-only (filter-asset (asset principal) (ret (list 100 principal)))
  (let (
    (asset-state (contract-call? .pool-0-reserve get-reserve-state asset))
  )
    (if (get borrowing-enabled asset-state)
      ;; add back to list
      (unwrap-panic (as-max-len? (append ret asset) u100))
      ;; ignore, do not add
      ret
    )
  )
)


(define-constant one-8 u100000000)
(define-constant one-12 u1000000000000)
(define-constant fixed-precision u8)

(define-constant max-value u340282366920938463463374607431768211455)

(define-read-only (get-max-value)
  max-value
)

(define-read-only (calculate-compounded-interest
  (current-liquidity-rate uint)
  (delta uint))
  (begin
    (taylor-6 (get-rt-by-block current-liquidity-rate delta))
  )
)

(define-read-only (mul (x uint) (y uint))
  (/ (+ (* x y) (/ one-8 u2)) one-8))

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y))

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (mul (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (mul (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (div-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (div (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (div (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

;; assumes assets used do not have more than 12 decimals
(define-read-only (div-precision-to-fixed (a uint) (b uint) (decimals uint))
  (let (
    (adjustment-difference (- one-12 decimals))
    (result (/ (* a (pow u10 decimals)) b)))
    (to-fixed result decimals)
  )
)

(define-read-only (div-reduced-loss (a uint) (b uint))
  (begin
    (/ (* a one-8) b)
  )
)

(define-read-only (mul-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (from-fixed-to-precision (mul-to-fixed-precision a decimals-a b-fixed) decimals-a)
)

(define-read-only (add-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (+ (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (+ (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (sub-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (- (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (- (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (to-fixed (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (/ a (pow u10 (- decimals-a fixed-precision)))
    (* a (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (mul-perc (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (begin
      (*
        (mul (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
        (pow u10 (- decimals-a fixed-precision))
      )
    )
    (begin
      (/
        (mul (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
        (pow u10 (- fixed-precision decimals-a))
      )
    )
  )
)

(define-read-only (fix-precision (a uint) (decimals-a uint) (b uint) (decimals-b uint))
  (let (
    (a-standard
      (if (> decimals-a fixed-precision)
        (/ a (pow u10 (- decimals-a fixed-precision)))
        (* a (pow u10 (- fixed-precision decimals-a)))
      ))
    (b-standard
      (if (> decimals-b fixed-precision)
        (/ b (pow u10 (- decimals-b fixed-precision)))
        (* b (pow u10 (- fixed-precision decimals-b)))
      ))
  )
    {
      a: a-standard,
      decimals-a: decimals-a,
      b: b-standard,
      decimals-b: decimals-b,
    }
  )
)

(define-read-only (from-fixed-to-precision (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (* a (pow u10 (- decimals-a fixed-precision)))
    (/ a (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (from-fixed-to-precision
    (mul-to-fixed-precision x x-decimals (div x-price y-price))
    y-decimals
  )
)

(define-read-only (is-odd (x uint))
  (not (is-even x))
)

(define-read-only (is-even (x uint))
  (is-eq (mod x u2) u0)
)

;; rate in 8-fixed
;; time passed in seconds
;; u31536000
(define-read-only (get-rt (rate uint) (t uint))
  (begin
    (/ (* (/ (* rate one-12) seconds-in-year) t) u100000)
  )
)

;; rate in 8-fixed
;; n-blocks
(define-read-only (get-rt-by-block (rate uint) (blocks uint))
  (begin
    (mul rate (* blocks sb-by-sy))
  )
)

;; block-seconds/year-seconds in fixed precision

(define-read-only (get-sb-by-sy)
  sb-by-sy
)

(define-read-only (get-e) e)
(define-read-only (get-one) one-8)

(define-constant e 271828182)
(define-constant seconds-in-year u31536000
  ;; (* u144 u365 u10 u60)
)
(define-constant seconds-in-block u600
  ;; (* 10 60)
)

(define-read-only (get-seconds-in-year)
  seconds-in-year
)

(define-read-only (get-seconds-in-block)
  seconds-in-block
)

(define-constant fact_2 u200000000)
(define-constant fact_3 (mul u300000000 u200000000))
(define-constant fact_4 (mul u400000000 (mul u300000000 u200000000)))
(define-constant fact_5 (mul u500000000 (mul u400000000 (mul u300000000 u200000000))))
(define-constant fact_6 (mul u600000000 (mul u500000000 (mul u400000000 (mul u300000000 u200000000)))))

(define-read-only (x_2 (x uint)) (mul x x))
(define-read-only (x_3 (x uint)) (mul x (mul x x)))
(define-read-only (x_4 (x uint)) (mul x (mul x (mul x x))))
(define-read-only (x_5 (x uint)) (mul x (mul x (mul x (mul x x)))))
(define-read-only (x_6 (x uint)) (mul x (mul x (mul x (mul x (mul x x))))))

(define-read-only (taylor-6 (x uint))
  (+
    one-8 x
    (div (x_2 x) fact_2)
    (div (x_3 x) fact_3)
    (div (x_4 x) fact_4)
    (div (x_5 x) fact_5)
    (div (x_6 x) fact_6)
  )
)
