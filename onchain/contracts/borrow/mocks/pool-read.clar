(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(use-trait oracle-trait .oracle-trait.oracle-trait)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (taylor-6 (x uint))
  (contract-call? .math taylor-6 x)
)

(define-read-only (is-in-isolation-mode (who principal))
  (begin
    (contract-call? .pool-0-reserve is-in-isolation-mode who)
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

(define-constant available-assets (list .diko .sBTC .stSTX .xUSD .USDA ))

(define-read-only (get-supplieable-assets)
  (filter is-active available-assets)
)

(define-read-only (get-borroweable-assets)
  (filter is-borroweable available-assets)
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
    (contract-call? .pool-0-reserve calculate-compounded-interest
      (get current-variable-borrow-rate reserve-resp)
      (* u144 u365)
    )
  )
)

(define-read-only (get-user-assets (who principal))
  (let (
    (assets (contract-call? .pool-0-reserve get-user-assets who))
  )
    assets
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

;; (define-read-only (get-max-borroweable
;;   (useable-collateral uint)
;;   (borrowed-collateral uint)
;;   (asset-to-borrow <ft>))
;;   (let (
;;     (price (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
;;   )
;;     (if (< useable-collateral borrowed-collateral)
;;       u0
;;       (div (- useable-collateral borrowed-collateral) price)
;;     )
;;   )
;; )

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

;; (define-read-only (get-useable-collateral-usd-diko (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       (if (is-eq isolated-asset .diko)
;;         (mul
;;           (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
;;           (token-to-usd
;;             .diko
;;             .oracle
;;             (get new-user-balance
;;               (unwrap-panic (contract-call? .pool-0-reserve
;;                 get-cumulated-balance-read
;;                 who
;;                 .lp-diko
;;                 .diko
;;                 (unwrap-panic (contract-call? .lp-diko get-balance who))
;;                 ))))
;;         )
;;         u0
;;       )
;;     )
;;     (begin
;;       (mul
;;         (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
;;         (token-to-usd
;;           .diko
;;           .oracle
;;           (get new-user-balance
;;             (unwrap-panic (contract-call? .pool-0-reserve
;;               get-cumulated-balance-read
;;               who
;;               .lp-diko
;;               .diko
;;               (unwrap-panic (contract-call? .lp-diko get-balance who))
;;               ))))
;;       )
;;     )
;;   )
;; )

;; (define-read-only (get-useable-collateral-usd-sBTC (who principal))
;;   (if (is-some (contract-call? .pool-0-reserve is-in-isolation-mode who))
;;     (let (
;;       (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
;;     )
;;       (if (is-eq isolated-asset .sBTC)
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
;;                 ))))
;;         )
;;         u0
;;       )
;;     )
;;     (begin
;;       (mul
;;         (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
;;         (token-to-usd
;;           .sBTC
;;           .oracle
;;           (get new-user-balance
;;             (unwrap-panic (contract-call? .pool-0-reserve
;;               get-cumulated-balance-read
;;               who
;;               .lp-sBTC
;;               .sBTC
;;               (unwrap-panic (contract-call? .lp-sBTC get-balance who))
;;               ))))
;;       )
;;     )
;;   )
;; )

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
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance borrow-balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal borrow-balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-sBTC (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance borrow-balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal borrow-balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-stSTX (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance borrow-balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal borrow-balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-USDA (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance borrow-balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal borrow-balance) u6 unit-price),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-xUSD (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
  )
    {
      compounded-balance: (token-to-usd (get compounded-balance borrow-balance) u6 unit-price),
      principal-balance: (token-to-usd (get principal borrow-balance) u6 unit-price),
    }
  )
)


(define-read-only (get-borrowed-balance-user-diko (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))
  )
    {
      compounded-balance: (get compounded-balance borrow-balance),
      principal-balance: (get principal borrow-balance),
    }
  )
)

(define-read-only (get-borrowed-balance-user-sBTC (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))
  )
    {
      compounded-balance: (get compounded-balance borrow-balance),
      principal-balance: (get principal borrow-balance),
    }
  )
)

(define-read-only (get-borrowed-balance-user-stSTX (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))
  )
    {
      compounded-balance: (get compounded-balance borrow-balance),
      principal-balance: (get principal borrow-balance),
    }
  )
)

(define-read-only (get-borrowed-balance-user-USDA (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))
  )
    {
      compounded-balance: (get compounded-balance borrow-balance),
      principal-balance: (get principal borrow-balance),
    }
  )
)

(define-read-only (get-borrowed-balance-user-xUSD (who principal))
  (let (
    (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))
  )
    {
      compounded-balance: (get compounded-balance borrow-balance),
      principal-balance: (get principal borrow-balance),
    }
  )
)

;; (define-read-only (get-supplied-balance-user-usd (who principal) (oracle principal))
;;   (begin
;;     {
;;       diko-supplied-balance: (token-to-usd .diko .oracle (unwrap-panic (contract-call? .lp-diko get-balance who))),
;;       sBTC-supplied-balance: (token-to-usd .sBTC .oracle  (unwrap-panic (contract-call? .lp-sBTC get-balance who))),
;;       stSTX-supplied-balance: (token-to-usd .stSTX .oracle  (unwrap-panic (contract-call? .lp-stSTX get-balance who))),
;;       USDA-supplied-balance: (token-to-usd .USDA .oracle (unwrap-panic (contract-call? .lp-USDA get-balance who))),
;;       xUSD-supplied-balance: (token-to-usd .xUSD .oracle (unwrap-panic (contract-call? .lp-xUSD get-balance who))),
;;     }
;;   )
;; )

(define-read-only (get-supplied-balance-user-usd-diko (who principal) (oracle principal))
  (token-to-usd (unwrap-panic (contract-call? .lp-diko get-balance who)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
)

(define-read-only (get-supplied-balance-user-usd-sBTC (who principal) (oracle principal))
  (token-to-usd (unwrap-panic (contract-call? .lp-sBTC get-balance who)) u8 (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
)

(define-read-only (get-supplied-balance-user-usd-stSTX (who principal) (oracle principal))
  (token-to-usd (unwrap-panic (contract-call? .lp-stSTX get-balance who)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
)

(define-read-only (get-supplied-balance-user-usd-USDA (who principal) (oracle principal))
  (token-to-usd (unwrap-panic (contract-call? .lp-USDA get-balance who)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
)

(define-read-only (get-supplied-balance-user-usd-xUSD (who principal) (oracle principal))
  (token-to-usd (unwrap-panic (contract-call? .lp-xUSD get-balance who)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
)

(define-read-only (get-supplied-balance-user-diko (who principal))
  (unwrap-panic (contract-call? .lp-diko get-balance who))
)

(define-read-only (get-supplied-balance-user-sBTC (who principal))
  (unwrap-panic (contract-call? .lp-sBTC get-balance who))
)

(define-read-only (get-supplied-balance-user-stSTX (who principal))
  (unwrap-panic (contract-call? .lp-stSTX get-balance who))
)

(define-read-only (get-supplied-balance-user-USDA (who principal))
  (unwrap-panic (contract-call? .lp-USDA get-balance who))
)

(define-read-only (get-supplied-balance-user-xUSD (who principal))
  (unwrap-panic (contract-call? .lp-xUSD get-balance who))
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

