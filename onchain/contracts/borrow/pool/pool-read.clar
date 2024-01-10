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

(define-constant available-assets (list .diko .sBTC .stSTX .xUSD .USDA ))

(define-read-only (get-supplieable-assets)
  (filter is-active available-assets)
)

(define-read-only (get-borroweable-assets)
  (filter is-borroweable available-assets)
)

(define-read-only (get-isolated-mode-assets)
  (filter is-isolated-asset available-assets)
)

(define-read-only (get-borroweable-assets-in-isolated-mode)
  (filter is-borroweable-in-isolation available-assets)
)

(define-read-only (is-borroweable-in-isolation (asset principal))
  (contract-call? .pool-0-reserve is-borroweable-isolated asset)
)

(define-read-only (is-isolated-asset (asset principal))
  (contract-call? .pool-0-reserve is-isolated-type asset)
)

(define-read-only (is-borroweable (asset principal))
  (and
    (contract-call? .pool-0-reserve is-active asset)
    (not (contract-call? .pool-0-reserve is-frozen asset))
    (contract-call? .pool-0-reserve is-borrowing-enabled asset)
  )
)

(define-public (calculate-available-borrowing-power-in-asset
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
    (contract-call? .pool-0-reserve calculate-available-borrowing-power-in-asset
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


(define-read-only (is-active (asset principal))
  (and (contract-call? .pool-0-reserve is-active asset) (not (contract-call? .pool-0-reserve is-frozen asset)))
)

(define-read-only (is-used-as-collateral (who principal) (asset principal))
  (get use-as-collateral (contract-call? .pool-0-reserve get-user-reserve-data who asset))
)

(define-read-only (get-reserve-state (reserve principal))
  (contract-call? .pool-0-reserve get-reserve-state-optional reserve)
)

(define-read-only (get-asset-supply-apy
    (reserve principal)
  )
  (let (
    (reserve-resp (get-reserve-state reserve))
  )
    (match reserve-resp
      reserve-data (begin
        (some
          (taylor-6 (get current-variable-borrow-rate reserve-data))
        )
      )
      none
    )
  )
)

(define-read-only (get-asset-borrow-apy
    (reserve principal)
  )
  (let (
    (reserve-resp (get-reserve-state reserve))
  )
    (match reserve-resp
      reserve-data (begin
        (some
          (+ u100000000 (get current-liquidity-rate reserve-data))
        )
      )
      none
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

(define-read-only (get-borrow-balance-value (who principal) (asset <ft>) (oracle principal))
  (token-to-usd
    asset
    oracle
    (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who (contract-of asset)))
  )
)

(define-private (token-to-usd-internal
  (item { asset: <ft>, amount: uint})
)
  (mul (get amount item) (contract-call? .oracle get-asset-price-read (get asset item) ))
)

;; (define-read-only (get-balance (asset <ft>) (who principal))
;;   (contract-call? asset get-balance who)
;; )

(define-read-only (token-to-usd
  (asset <ft>)
  (oracle principal)
  (amount uint)
  )
  (let (
    (unit-price (contract-call? .oracle get-asset-price-read asset))
  )
    (mul amount unit-price)
  )
)

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

(define-read-only (get-cumulated-balance-diko
  (who principal)
  (lp-token <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (lp-balance (unwrap-panic (contract-call? .diko get-balance who)))
  )
    (ok (get new-user-balance (try! (contract-call? .pool-0-reserve get-cumulated-balance-read who lp-token .diko lp-balance))))
  )
)

(define-read-only (get-cumulated-balance-sBTC
  (who principal)
  (lp-token <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (lp-balance (unwrap-panic (contract-call? .sBTC get-balance who)))
  )
    (ok (get new-user-balance (try! (contract-call? .pool-0-reserve get-cumulated-balance-read who lp-token .sBTC lp-balance))))
  )
)

(define-read-only (get-cumulated-balance-stSTX
  (who principal)
  (lp-token <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (lp-balance (unwrap-panic (contract-call? .stSTX get-balance who)))
  )
    (ok (get new-user-balance (try! (contract-call? .pool-0-reserve get-cumulated-balance-read who lp-token .stSTX lp-balance))))
  )
)

(define-read-only (get-cumulated-balance-USDA
  (who principal)
  (lp-token <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (lp-balance (unwrap-panic (contract-call? .USDA get-balance who)))
  )
    (ok (get new-user-balance (try! (contract-call? .pool-0-reserve get-cumulated-balance-read who lp-token .USDA lp-balance))))
  )
)

(define-read-only (get-cumulated-balance-xUSD
  (who principal)
  (lp-token <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (lp-balance (unwrap-panic (contract-call? .xUSD get-balance who)))
  )
    (ok (get new-user-balance (try! (contract-call? .pool-0-reserve get-cumulated-balance-read who lp-token .xUSD lp-balance))))
  )
)

;; (define-read-only (get-max-borroweable (who principal) (oracle principal) (asset <ft>))
;;   (let (
;;     (useable-collateral (get-useable-collateral-usd who))
;;     (borrowed-collateral (get-borrowed-balance-user-usd who))
;;     (total-useable-value
;;       (+ 
;;         (get diko-useable-collateral-usd useable-collateral)
;;         (get sBTC-useable-collateral-usd useable-collateral)
;;         (get stSTX-useable-collateral-usd useable-collateral)
;;         (get USDA-useable-collateral-usd useable-collateral)
;;         (get xUSD-useable-collateral-usd useable-collateral)
;;       )
;;     )
;;     (total-borrowed-value
;;       (+ 
;;         (get diko-compounded-balance borrowed-collateral)
;;         (get sBTC-compounded-balance borrowed-collateral)
;;         (get stSTX-compounded-balance borrowed-collateral)
;;         (get USDA-compounded-balance borrowed-collateral)
;;         (get xUSD-compounded-balance borrowed-collateral)
;;       )
;;     )
;;     (price (contract-call? .oracle get-asset-price-read asset))
;;   )
;;     (if (< total-useable-value total-borrowed-value)
;;       u0
;;       (div (- total-useable-value total-borrowed-value) price)
;;     )
;;   )
;; )

(define-read-only (get-max-borroweable
  (useable-collateral uint)
  (borrowed-collateral uint)
  (asset-to-borrow <ft>))
  (let (
    (price (contract-call? .oracle get-asset-price-read .xUSD))
  )
    (if (< useable-collateral borrowed-collateral)
      u0
      (div (- useable-collateral borrowed-collateral) price)
    )
  )
)

(define-read-only (get-useable-collateral-usd (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      {
        diko-useable-collateral-usd:
          (if (is-eq isolated-asset .diko)
            (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
              (token-to-usd
                .diko
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-diko
                    .diko
                    (unwrap-panic (contract-call? .lp-diko get-balance who))
                    ))))
            )
            u0
          )
          ,
        sBTC-useable-collateral-usd:
          (if (is-eq isolated-asset .sBTC)
            (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
              (token-to-usd
                .sBTC
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-sBTC
                    .sBTC
                    (unwrap-panic (contract-call? .lp-sBTC get-balance who))
                    ))))
            )
            u0
          )
          ,
        stSTX-useable-collateral-usd:
          (if (is-eq isolated-asset .stSTX)
            (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
              (token-to-usd
                .stSTX
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-stSTX
                    .stSTX
                    (unwrap-panic (contract-call? .lp-stSTX get-balance who))
                    ))))
            )
            u0
          )
          ,
        USDA-useable-collateral-usd:
          (if (is-eq isolated-asset .USDA)
            (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
              (token-to-usd
                .USDA
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-USDA
                    .USDA
                    (unwrap-panic (contract-call? .lp-USDA get-balance who))
                    ))))
            )
            u0
          )
          ,
        xUSD-useable-collateral-usd:
          (if (is-eq isolated-asset .xUSD)
            (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
              (token-to-usd
                .xUSD
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-xUSD
                    .xUSD
                    (unwrap-panic (contract-call? .lp-xUSD get-balance who))
                    ))))
            )
            u0
          )
      }
    )
  (begin
    {
      diko-useable-collateral-usd:
        (mul
              (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
              (token-to-usd
                .diko
                .oracle
                (get new-user-balance
                  (unwrap-panic (contract-call? .pool-0-reserve
                    get-cumulated-balance-read
                    who
                    .lp-diko
                    .diko
                    (unwrap-panic (contract-call? .lp-diko get-balance who))
                    ))))
            )
        ,
      sBTC-useable-collateral-usd:
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
          (token-to-usd
            .sBTC
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-sBTC
                .sBTC
                (unwrap-panic (contract-call? .lp-sBTC get-balance who))
                )
              )
            )
          )
        )
        ,
      stSTX-useable-collateral-usd:
        ;; (mul
        ;;   (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
        ;;   (token-to-usd who .stSTX .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))))
        ;; )
        ;; 0 because cannot be used unless in isolation mode
        u0
        ,
      USDA-useable-collateral-usd:
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
          (token-to-usd
            .USDA
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-USDA
                .USDA
                (unwrap-panic (contract-call? .lp-USDA get-balance who))
                )
              )
            )
          )
        )
        ,
      xUSD-useable-collateral-usd:
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
          (token-to-usd
            .xUSD
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-xUSD
                .xUSD
                (unwrap-panic (contract-call? .lp-xUSD get-balance who))
                )
              )
            )
          )
        )
        ,
    }
  )
  )
)

(define-read-only (get-useable-collateral-usd-diko (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      (if (is-eq isolated-asset .diko)
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
          (token-to-usd
            .diko
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-diko
                .diko
                (unwrap-panic (contract-call? .lp-diko get-balance who))
                ))))
        )
        u0
      )
    )
    (begin
      (mul
        (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .diko))
        (token-to-usd
          .diko
          .oracle
          (get new-user-balance
            (unwrap-panic (contract-call? .pool-0-reserve
              get-cumulated-balance-read
              who
              .lp-diko
              .diko
              (unwrap-panic (contract-call? .lp-diko get-balance who))
              ))))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-sBTC (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      (if (is-eq isolated-asset .sBTC)
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
          (token-to-usd
            .sBTC
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-sBTC
                .sBTC
                (unwrap-panic (contract-call? .lp-sBTC get-balance who))
                ))))
        )
        u0
      )
    )
    (begin
      (mul
        (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .sBTC))
        (token-to-usd
          .sBTC
          .oracle
          (get new-user-balance
            (unwrap-panic (contract-call? .pool-0-reserve
              get-cumulated-balance-read
              who
              .lp-sBTC
              .sBTC
              (unwrap-panic (contract-call? .lp-sBTC get-balance who))
              ))))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-stSTX (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      (if (is-eq isolated-asset .stSTX)
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .stSTX))
          (token-to-usd
            .stSTX
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-stSTX
                .stSTX
                (unwrap-panic (contract-call? .lp-stSTX get-balance who))
                ))))
        )
        u0
      )
    )
    (begin
      u0
    )
  )
)


(define-read-only (get-useable-collateral-usd-USDA (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      (if (is-eq isolated-asset .USDA)
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
          (token-to-usd
            .USDA
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-USDA
                .USDA
                (unwrap-panic (contract-call? .lp-USDA get-balance who))
                ))))
        )
        u0
      )
    )
    (begin
      (mul
        (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .USDA))
        (token-to-usd
          .USDA
          .oracle
          (get new-user-balance
            (unwrap-panic (contract-call? .pool-0-reserve
              get-cumulated-balance-read
              who
              .lp-USDA
              .USDA
              (unwrap-panic (contract-call? .lp-USDA get-balance who))
              ))))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-xUSD (who principal))
  (if (contract-call? .pool-0-reserve is-in-isolation-mode who)
    (let (
      (isolated-asset (contract-call? .pool-0-reserve get-isolated-asset who))
    )
      (if (is-eq isolated-asset .xUSD)
        (mul
          (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
          (token-to-usd
            .xUSD
            .oracle
            (get new-user-balance
              (unwrap-panic (contract-call? .pool-0-reserve
                get-cumulated-balance-read
                who
                .lp-xUSD
                .xUSD
                (unwrap-panic (contract-call? .lp-xUSD get-balance who))
                ))))
        )
        u0
      )
    )
    (begin
      (mul
        (get base-ltv-as-collateral (contract-call? .pool-0-reserve get-reserve-state .xUSD))
        (token-to-usd
          .xUSD
          .oracle
          (get new-user-balance
            (unwrap-panic (contract-call? .pool-0-reserve
              get-cumulated-balance-read
              who
              .lp-xUSD
              .xUSD
              (unwrap-panic (contract-call? .lp-xUSD get-balance who))
              ))))
      )
    )
  )
)

(define-read-only (get-borrowed-balance-user-usd (who principal))
  (begin
    {
      diko-compounded-balance:
        (token-to-usd .diko .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))),
      diko-principal-balance:
        (token-to-usd .diko .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))),
      sBTC-compounded-balance:
        (token-to-usd .sBTC .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))),
      sBTC-principal-balance:
        (token-to-usd .sBTC .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))),
      stSTX-compounded-balance:
        (token-to-usd .stSTX .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))),
      stSTX-principal-balance:
        (token-to-usd .stSTX .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))),
      USDA-compounded-balance:
        (token-to-usd .USDA .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))),
      USDA-principal-balance:
        (token-to-usd .USDA .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))),
      xUSD-compounded-balance: 
        (token-to-usd .xUSD .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))),
      xUSD-principal-balance: 
        (token-to-usd .xUSD .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-diko (who principal))
  (begin
    {
      compounded-balance: (token-to-usd .diko .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))),
      principal-balance: (token-to-usd .diko .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-sBTC (who principal))
  (begin
    {
      compounded-balance: (token-to-usd .sBTC .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))),
      principal-balance: (token-to-usd .sBTC .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-stSTX (who principal))
  (begin
    {
      compounded-balance: (token-to-usd .stSTX .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))),
      principal-balance: (token-to-usd .stSTX .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-USDA (who principal))
  (begin
    {
      compounded-balance: (token-to-usd .USDA .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))),
      principal-balance: (token-to-usd .USDA .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-usd-xUSD (who principal))
  (begin
    {
      compounded-balance: (token-to-usd .xUSD .oracle (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))),
      principal-balance: (token-to-usd .xUSD .oracle (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD)))),
    }
  )
)

(define-read-only (get-borrowed-balance-user (who principal))
  (begin
    {
      diko-borrowed-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko))),
      diko-principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko))),
      sBTC-borrowed-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC))),
      sBTC-principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC))),
      stSTX-borrowed-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))),
      stSTX-principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))),
      USDA-borrowed-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA))),
      USDA-principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA))),
      xUSD-borrowed-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD))),
      xUSD-principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-diko (who principal))
  (begin
    {
      compounded-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko))),
      principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .diko))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-sBTC (who principal))
  (begin
    {
      compounded-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC))),
      principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .sBTC))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-stSTX (who principal))
  (begin
    {
      compounded-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))),
      principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .stSTX))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-USDA (who principal))
  (begin
    {
      compounded-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA))),
      principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .USDA))),
    }
  )
)

(define-read-only (get-borrowed-balance-user-xUSD (who principal))
  (begin
    {
      compounded-balance: (get compounded-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD))),
      principal-balance: (get principal (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance who .xUSD))),
    }
  )
)

(define-read-only (get-supplied-balance-user-usd (who principal) (oracle principal))
  (begin
    {
      diko-supplied-balance: (token-to-usd .diko .oracle (unwrap-panic (contract-call? .lp-diko get-balance who))),
      sBTC-supplied-balance: (token-to-usd .sBTC .oracle  (unwrap-panic (contract-call? .lp-sBTC get-balance who))),
      stSTX-supplied-balance: (token-to-usd .stSTX .oracle  (unwrap-panic (contract-call? .lp-stSTX get-balance who))),
      USDA-supplied-balance: (token-to-usd .USDA .oracle (unwrap-panic (contract-call? .lp-USDA get-balance who))),
      xUSD-supplied-balance: (token-to-usd .xUSD .oracle (unwrap-panic (contract-call? .lp-xUSD get-balance who))),
    }
  )
)

(define-read-only (get-supplied-balance-user-usd-diko (who principal) (oracle principal))
  (token-to-usd .diko .oracle (unwrap-panic (contract-call? .lp-diko get-balance who)))
)

(define-read-only (get-supplied-balance-user-usd-sBTC (who principal) (oracle principal))
  (token-to-usd .sBTC .oracle (unwrap-panic (contract-call? .lp-sBTC get-balance who)))
)

(define-read-only (get-supplied-balance-user-usd-stSTX (who principal) (oracle principal))
  (token-to-usd .stSTX .oracle (unwrap-panic (contract-call? .lp-stSTX get-balance who)))
)

(define-read-only (get-supplied-balance-user-usd-USDA (who principal) (oracle principal))
  (token-to-usd .USDA .oracle (unwrap-panic (contract-call? .lp-USDA get-balance who)))
)

(define-read-only (get-supplied-balance-user-usd-xUSD (who principal) (oracle principal))
  (token-to-usd .xUSD .oracle (unwrap-panic (contract-call? .lp-xUSD get-balance who)))
)

(define-read-only (get-supplied-balance-user (who principal))
  (begin
    {
      diko-supplied-balance: (unwrap-panic (contract-call? .lp-diko get-balance who)),
      sBTC-supplied-balance: (unwrap-panic (contract-call? .lp-sBTC get-balance who)),
      stSTX-supplied-balance: (unwrap-panic (contract-call? .lp-stSTX get-balance who)),
      USDA-supplied-balance: (unwrap-panic (contract-call? .lp-USDA get-balance who)),
      xUSD-supplied-balance: (unwrap-panic (contract-call? .lp-xUSD get-balance who)),
    }
  )
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

(define-read-only (get-supplied-balance-usd)
  (begin
    {
      diko-supplied-balance: (token-to-usd .diko .oracle (unwrap-panic (contract-call? .diko get-balance .pool-0-reserve))),
      sBTC-supplied-balance: (token-to-usd .sBTC .oracle (unwrap-panic (contract-call? .sBTC get-balance .pool-0-reserve))),
      stSTX-supplied-balance: (token-to-usd .stSTX .oracle (unwrap-panic (contract-call? .stSTX get-balance .pool-0-reserve))),
      USDA-supplied-balance: (token-to-usd .USDA .oracle (unwrap-panic (contract-call? .USDA get-balance .pool-0-reserve))),
      xUSD-supplied-balance: (token-to-usd .xUSD .oracle (unwrap-panic (contract-call? .xUSD get-balance .pool-0-reserve))),
    }
  )
)

(define-read-only (get-supplied-balance-usd-diko)
  (token-to-usd .diko .oracle (unwrap-panic (contract-call? .diko get-balance .pool-0-reserve)))
)

(define-read-only (get-supplied-balance-usd-sBTC)
  (token-to-usd .sBTC .oracle (unwrap-panic (contract-call? .sBTC get-balance .pool-0-reserve)))
)

(define-read-only (get-supplied-balance-usd-stSTX)
  (token-to-usd .stSTX .oracle (unwrap-panic (contract-call? .stSTX get-balance .pool-0-reserve)))
)

(define-read-only (get-supplied-balance-usd-USDA)
  (token-to-usd .USDA .oracle (unwrap-panic (contract-call? .USDA get-balance .pool-0-reserve)))
)

(define-read-only (get-supplied-balance-usd-xUSD)
  (token-to-usd .xUSD .oracle (unwrap-panic (contract-call? .xUSD get-balance .pool-0-reserve)))
)

(define-read-only (get-supplied-balance)
  (begin
    {
      diko-supplied-balance: (unwrap-panic (contract-call? .diko get-balance .pool-0-reserve)),
      sBTC-supplied-balance: (unwrap-panic (contract-call? .sBTC get-balance .pool-0-reserve)),
      stSTX-supplied-balance: (unwrap-panic (contract-call? .stSTX get-balance .pool-0-reserve)),
      USDA-supplied-balance: (unwrap-panic (contract-call? .USDA get-balance .pool-0-reserve)),
      xUSD-supplied-balance: (unwrap-panic (contract-call? .xUSD get-balance .pool-0-reserve)),
    }
  )
)

(define-read-only (get-supplied-balance-diko)
  (unwrap-panic (contract-call? .diko get-balance .pool-0-reserve))
)

(define-read-only (get-supplied-balance-sBTC)
  (unwrap-panic (contract-call? .sBTC get-balance .pool-0-reserve))
)

(define-read-only (get-supplied-balance-stSTX)
  (unwrap-panic (contract-call? .stSTX get-balance .pool-0-reserve))
)

(define-read-only (get-supplied-balance-USDA)
  (unwrap-panic (contract-call? .USDA get-balance .pool-0-reserve))
)

(define-read-only (get-supplied-balance-xUSD)
  (unwrap-panic (contract-call? .xUSD get-balance .pool-0-reserve))
)

;; (define-read-only (get-borroweable-assets)
;;   (let (
;;     (all-assets (contract-call? .pool-0-reserve get-assets))
;;     (borroweable-assets (fold filter-asset all-assets (list)))
;;   )
;;     borroweable-assets
;;   )
;; )

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

(define-read-only (stSTX-supply-balance (who principal))
  (begin
    (contract-call? .stSTX get-balance who)
  )
)


