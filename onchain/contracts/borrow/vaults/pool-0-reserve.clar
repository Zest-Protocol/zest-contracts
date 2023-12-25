;; (impl-trait .ownable-trait.ownable-trait)
;; (impl-trait .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(define-constant a-token .lp-token-0)
;; (define-constant default-interest-rate-strategy-address .interest-rate-strategy-default)

(define-constant one-8 u100000000)

;; (define-map assets uint uint)
(define-data-var contract-owner principal tx-sender)


(define-constant seconds-in-year (* u144 u365 u10 u60))

(define-read-only (get-seconds-in-block)
  (contract-call? .math get-seconds-in-block)
)

(define-read-only (get-seconds-in-year)
  (contract-call? .math get-seconds-in-year)
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-read-only (is-odd (x uint))
  (contract-call? .math is-odd x)
)

(define-read-only (is-even (x uint))
  (contract-call? .math is-even x)
)

(define-read-only (get-e)
  (contract-call? .math get-e)
)

(define-constant one-3 u1000)

(define-read-only (fixed-to-exp (fixed uint))
  (* fixed one-3)
)

(define-read-only (exp-to-fixed (fixed uint))
  (/ one-3 fixed)
)

(define-read-only (taylor-6 (x uint))
  (contract-call? .math taylor-6 x)
)

(define-map user-reserve-data
  { user: principal, reserve: principal}
  (tuple
    (principal-borrow-balance uint)
    (last-variable-borrow-cumulative-index uint)
    (origination-fee uint)
    (stable-borrow-rate uint)
    (last-updated-block uint)
    (use-as-collateral bool)
  )
)

(define-public (set-use-as-collateral (who principal) (asset <ft>) (use-as-collateral bool))
  (let (
    (user-data (get-user-reserve-data who (contract-of asset)))
  )
    (ok (map-set user-reserve-data { user: who, reserve: (contract-of asset) } (merge user-data { use-as-collateral: use-as-collateral })))
  )
)

(define-constant default-user-reserve-data
  {
    principal-borrow-balance: u0,
    last-variable-borrow-cumulative-index: u0,
    origination-fee: u0,
    stable-borrow-rate: u0,
    last-updated-block: u0,
    use-as-collateral: false,
  }
)

(define-map user-assets
  principal
  {
    assets-supplied: (list 100 principal),
    assets-borrowed: (list 100 principal)
  }
)

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
    (interest-rate-strategy-address principal)
    (last-updated-block uint)
    (borrowing-enabled bool)
    (usage-as-collateral-enabled bool)
    (is-stable-borrow-rate-enabled bool)
    (is-active bool)
    (is-freezed bool)
  )
)


(define-map user-isolated principal (optional principal))

;; MODES:
;; 1. Stables
;; 2. STX
;; 3. BTC
;; ASSETS RELATED
;; MODE -> ASSETS RELATED
(define-map e-modes (buff 2) (list 255 principal))


(define-map isolated-assets principal bool)

;; TODO: enabled adding manually
(map-set isolated-assets .stSTX true)

;; Assets that can be borrowed using isolated assets as collateral
(define-data-var borroweable-isolated
  (list 100 principal)
  (list .xUSD)
)

(define-private (add-borroweable-isolated (who principal) (asset principal))
  (let (
    (assets-data (get-user-assets who))
  )
    (map-set
      user-assets
      who
      {
        assets-supplied: (unwrap-panic (as-max-len? (append (get assets-supplied assets-data) asset) u100)),
        assets-borrowed: (get assets-borrowed assets-data)
      }
    )
  )
)

(define-map user-index principal uint)

(define-data-var assets (list 100 principal) (list))

(define-read-only (is-in-isolation-mode (who principal))
  (let (
    (assets-supplied (get assets-supplied (get-user-assets who)))
    (split-assets (fold split-isolated assets-supplied { isolated: (list), non-isolated: (list) }))
    (enabled-isolated-n (get enabled-count (fold count-collateral-enabled (get isolated split-assets) { who: who, enabled-count: u0 })))
    (enabled-non-isolated-n  (get enabled-count (fold count-collateral-enabled (get non-isolated split-assets) { who: who, enabled-count: u0 })))
  )
    (print { split-assets: split-assets })
    (print { enabled-isolated-n: enabled-isolated-n })
    (print { enabled-non-isolated-n: enabled-non-isolated-n })

    (if (> enabled-non-isolated-n u0)
      (ok false)
      (if (> enabled-isolated-n u1)
        (ok false)
        (ok true)
      )
    )
  )
)

;; (define-read-only (split-isolated-test (who principal) (assets-supplied (list 100 principal)))
;;   (fold split-isolated assets-supplied { non-isolated: (list), isolated: (list) })
;;   ;; (fold count-collateral-enabled assets-supplied { who: who, enabled-count: u0 })
;; )

(define-read-only (split-isolated (asset principal) (ret { isolated: (list 100 principal), non-isolated: (list 100 principal) }))
  (if (asset-is-isolated-type asset)
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

(define-read-only (count-collateral-enabled (asset principal) (ret { who: principal, enabled-count: uint }))
  (if (get use-as-collateral (get-user-reserve-data (get who ret) asset))
    (merge ret { enabled-count: (+ (get enabled-count ret) u1) })
    (merge ret { enabled-count: (get enabled-count ret) })
  )
)

(define-read-only (asset-is-isolated-type (asset principal))
  (default-to false (map-get? isolated-assets asset))
)

(define-private (add-supplied-asset (who principal) (asset principal))
  (let (
    (assets-data (get-user-assets who))
  )
    (map-set
      user-assets
      who
      {
        assets-supplied: (unwrap-panic (as-max-len? (append (get assets-supplied assets-data) asset) u100)),
        assets-borrowed: (get assets-borrowed assets-data)
      }
    )
  )
)

(define-private (remove-supplied-asset (who principal) (asset principal))
  (let (
    (assets-data (get-user-assets who))
  )
    (map-set
      user-assets
      who
      {
        assets-supplied: (get agg (fold filter-asset (get assets-supplied assets-data) { filter-by: asset, agg: (list) })),
        assets-borrowed: (get assets-borrowed assets-data)
      }
    )
  )
)


(define-private (add-borrowed-asset (who principal) (asset principal))
  (let (
    (assets-data (get-user-assets who))
  )
    (map-set
      user-assets
      who
      {
        assets-supplied: (get assets-supplied assets-data),
        assets-borrowed: (unwrap-panic (as-max-len? (append (get assets-borrowed assets-data) asset) u100)),
      }
    )
  )
)

(define-private (remove-borrowed-asset (who principal) (asset principal))
  (let (
    (assets-data (get-user-assets who))
  )
    (map-set
      user-assets
      who
      {
        assets-supplied: (get assets-supplied assets-data),
        assets-borrowed: (get agg (fold filter-asset (get assets-borrowed assets-data) { filter-by: asset, agg: (list) }))
      }
    )
  )
)

(define-read-only (filter-asset (asset principal) (ret { filter-by: principal, agg: (list 100 principal) }))
  (if (is-eq asset (get filter-by ret))
    ;; ignore, do not add
    ret
    ;; add back to list
    { filter-by: (get filter-by ret), agg: (unwrap-panic (as-max-len? (append (get agg ret) asset) u100)) }
  )
)

(define-read-only (get-user-assets (who principal))
  (default-to { assets-supplied: (list), assets-borrowed: (list) } (map-get? user-assets who))
)

(define-read-only (get-user-reserve-data
  (who principal)
  (reserve principal)
  )
  (default-to default-user-reserve-data (map-get? user-reserve-data { user: who, reserve: reserve }))
)


(define-read-only (get-user-state-c
  (user principal)
  (asset principal)
  )
  (map-get? user-reserve-data { user: user, reserve: asset })
)

(define-read-only (get-user-current-borrow-rate
  (who principal)
  (asset <ft>)
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (user-data (get-user-reserve-data who (contract-of asset)))
  )
    (get current-variable-borrow-rate reserve-data)
  )
)

(define-read-only (get-reserve-liquidation-bonus (asset <ft>))
  (get liquidation-bonus (get-reserve-state (contract-of asset)))
)

(define-read-only (get-user-origination-fee
  (who principal)
  (asset <ft>)
  )
  (let (
    (user-data (get-user-reserve-data who (contract-of asset)))
  )
    (get origination-fee user-data)
  )
)

(define-public (get-reserve-available-liquidity
  (asset <ft>)
)
  (contract-call? asset get-balance (as-contract tx-sender))
)

(define-read-only (get-user-index (who principal) (asset principal))
  (default-to (get last-liquidity-cumulative-index (get-reserve-state asset)) (map-get? user-index who))
)

(define-read-only (get-reserve-state (asset principal))
  (unwrap-panic (map-get? reserve-state asset))
)

(define-read-only (get-reserve-state-optional (asset principal))
  (map-get? reserve-state asset)
)

(define-read-only (get-user-isolated (who principal))
  (default-to none (map-get? user-isolated who))
)

(define-read-only (get-assets)
  (var-get assets)
)

(define-public (init
  (a-token-address principal)
  (asset principal)
  (decimals uint)
  (interest-rate-strategy-address principal)
)
  (begin
    (asserts! true (err u1))
    
    (var-set assets (unwrap-panic (as-max-len? (append (var-get assets) asset) u100)))
    (ok
      (map-set
        reserve-state
        asset
        {
          last-liquidity-cumulative-index: one-8,
          current-liquidity-rate: u0,
          total-borrows-stable: u0,
          total-borrows-variable: u0,
          current-variable-borrow-rate: u0,
          current-stable-borrow-rate: u0,
          current-average-stable-borrow-rate: u0,
          last-variable-borrow-cumulative-index: one-8,
          base-ltv-as-collateral: u0,
          liquidation-threshold: u0,
          liquidation-bonus: u0,
          decimals: decimals,
          a-token-address: a-token-address,
          interest-rate-strategy-address: interest-rate-strategy-address,
          last-updated-block: u0,
          borrowing-enabled: false,
          usage-as-collateral-enabled: false,
          is-stable-borrow-rate-enabled: false,
          is-active: true,
          is-freezed: false
        }
        ;; (merge
        ;;   (var-get reserve-state)
        ;;   {
        ;;     last-liquidity-cumulative-index: one-8,
        ;;     last-variable-borrow-cumulative-index: one-8,
        ;;     a-token-address: a-token-address,
        ;;     decimals: decimals,
        ;;     interest-rate-strategy-address: interest-rate-strategy-address,
        ;;     is-active: true,
        ;;     is-freezed: false
        ;;   }
        ;; )
      )
    )
  )
)

;; -- ownable-trait --
;; (define-public (get-contract-owner)
;;   (ok (var-get contract-owner)))

;; (define-read-only (is-contract-owner (caller principal))
;;   (is-eq caller (var-get contract-owner)))

;; (define-public (set-contract-owner (owner principal))
;;   (begin
;;     (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
;;     (print { type: "set-contract-owner-liquidity-vault-v1-0", payload: owner })
;;     (ok (var-set contract-owner owner))))

(define-public (update-state-on-deposit
  (asset <ft>)
  (who principal)
  (amount-deposited uint)
  (is-first-deposit bool)
  )
  (begin
    (asserts! true (err u0))

    (try! (update-cumulative-indexes (contract-of asset)))
    (try! (update-reserve-interest-rates-and-timestamp asset amount-deposited u0))
    
    ;; (print { deposited-state: (get-reserve-state (contract-of asset)) })

    (if is-first-deposit
      (begin
        (add-supplied-asset who (contract-of asset))
        (set-user-reserve-as-collateral who asset true)
      )
      (ok true)
    )
  )
)

(define-public (update-state-on-repay
  (asset <ft>)
  (who principal)
  (payback-amount-minus-fees uint)
  (origination-fee-repaid uint)
  (balance-increase uint)
  (repaid-whole-loan bool)
  )
  (begin
    (asserts! true (err u0))

    (try! (update-reserve-state-on-repay who payback-amount-minus-fees balance-increase asset))
    (try! (update-user-state-on-repay asset who payback-amount-minus-fees origination-fee-repaid balance-increase repaid-whole-loan))

    (try! (update-reserve-interest-rates-and-timestamp asset payback-amount-minus-fees u0))

    (ok u0)
  )
)

(define-public (update-state-on-redeem
  (asset <ft>)
  (who principal)
  (amount-deposited uint)
  (user-redeemed-everything bool)
  )
  (begin
    (try! (update-cumulative-indexes (contract-of asset)))
    (try! (update-reserve-interest-rates-and-timestamp asset amount-deposited u0))

    (if user-redeemed-everything
      (begin
        (remove-supplied-asset who (contract-of asset))
        (set-user-reserve-as-collateral who asset user-redeemed-everything)
      )
      (ok true)
    )
  )
)

(define-public (update-state-on-borrow
  (asset <ft>)
  (who principal)
  (amount-borrowed uint)
  (borrow-fee uint)
  )
  (let (
    (ret (try! (get-user-borrow-balance who asset)))
  )
    (try!
      (update-reserve-state-on-borrow
        (get principal ret)
        (get balance-increase ret)
        amount-borrowed
        (contract-of asset)
      )
    )
    (try!
      (update-user-state-on-borrow
        who
        asset
        amount-borrowed
        (get balance-increase ret)
        borrow-fee
      )
    )
    (try! (update-reserve-interest-rates-and-timestamp asset u0 amount-borrowed))


    (add-borrowed-asset who (contract-of asset))

    (ok {
      user-current-borrow-rate: (get-user-current-borrow-rate who asset),
      balance-increase: (get balance-increase ret)
    })
  )
)

(define-read-only (value-to-collateral
  (value uint)
  )
  (/ value u2)
)


(define-public (update-user-state-on-repay
  (asset <ft>)
  (who principal)
  (payback-amount-minus-fees uint)
  (origination-fee-repaid uint)
  (balance-increase uint)
  (repaid-whole-loan bool)
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (user-data (get-user-reserve-data who (contract-of asset)))
    (principal-borrow-balance
      (-
        (+
          (get principal-borrow-balance user-data)
          balance-increase
        )
        payback-amount-minus-fees
      )
    )
    (last-variable-borrow-cumulative-index
      (if repaid-whole-loan
        u0
        (get last-variable-borrow-cumulative-index reserve-data)
      )
    )
    (stable-borrow-rate
      (if repaid-whole-loan
        u0
        (get stable-borrow-rate user-data)
      )
    )
    (origination-fee (- (get origination-fee user-data) origination-fee-repaid))
    (last-updated-block block-height)
  )
  (asserts! true (err u0))
  ;; (print { last-variable-borrow-cumulative-index: last-variable-borrow-cumulative-index })
  (map-set
    user-reserve-data
    { user: who, reserve: (contract-of asset) }
    (merge
      user-data
      {
        principal-borrow-balance: principal-borrow-balance,
        last-variable-borrow-cumulative-index: last-variable-borrow-cumulative-index,
        stable-borrow-rate: stable-borrow-rate,
        origination-fee: origination-fee,
        last-updated-block: last-updated-block
      }
    )
  )
  (if repaid-whole-loan
    (add-borrowed-asset who (contract-of asset))
    false
  )
  (ok u0)
  )
)

(define-public (update-reserve-state-on-repay
  (who principal)
  (payback-amount-minus-fees uint)
  (balance-increase uint)
  (asset <ft>)
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (user-data (get-user-reserve-data who (contract-of asset)))
  )
    (try! (update-cumulative-indexes (contract-of asset)))
    (map-set
      reserve-state
      (contract-of asset)
      (merge
        reserve-data
        {
          total-borrows-variable: (- (+ (get total-borrows-variable reserve-data) balance-increase) payback-amount-minus-fees)
        }
      )
    )
    (ok u0)
  )
)

(define-public (update-user-state-on-borrow
  (who principal)
  (asset <ft>)
  (amount-borrowed uint)
  (balance-increase uint)
  (fee uint)
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (user-data (get-user-reserve-data who (contract-of asset)))
    (new-user-data {
      stable-borrow-rate: u0,
      last-variable-borrow-cumulative-index: (get last-variable-borrow-cumulative-index reserve-data),
      principal-borrow-balance: (+ (get principal-borrow-balance user-data) amount-borrowed balance-increase),
      origination-fee: (+ (get origination-fee user-data) fee),
      last-updated-block: block-height
    })
  )
    (asserts! true (err u0))
    
    (map-set
      user-reserve-data
      { user: who, reserve: (contract-of asset) }
      (merge
        user-data
        new-user-data
      )
    )
    ;; (print {HEY1: { user: who, reserve: (contract-of asset) } })
    (ok u0)
  )
)

(define-public (update-reserve-state-on-borrow
  (principal-borrow-balance uint)
  (balance-increase uint)
  (amount-borrowed uint)
  (asset principal)
  )
  (begin
    (try! (update-cumulative-indexes asset))
    (try! (update-reserve-total-borrows-by-rate-mode
      principal-borrow-balance
      balance-increase
      amount-borrowed
      asset
    ))
    (ok u0)
  )
)

(define-public (update-reserve-total-borrows-by-rate-mode
  (principal-balance uint)
  (balance-increase uint)
  (amount-borrowed uint)
  (asset principal)
  )
  (let (
    (reserve-data (get-reserve-state asset))
    (new-principal-amount (+ principal-balance balance-increase amount-borrowed))
  )
    ;; TODO: increase borrow amount
    (asserts! true (err u0))
    (map-set
      reserve-state
      asset
      (merge
        reserve-data
        {
          total-borrows-variable: (+ (get total-borrows-variable reserve-data) balance-increase amount-borrowed)
        }
      )
    )
    (ok u0)
  )
)

(define-read-only (get-user-borrow-balance
  (who principal)
  (asset <ft>)
)
  (let (
    (user-data (get-user-reserve-data who (contract-of asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
  )
    (asserts! true (err u0))
    (if (is-eq (get principal-borrow-balance user-data) u0)
      (ok {
          principal: u0,
          compounded-balance: u0,
          balance-increase: u0,
        })
      (let (
        (principal (get principal-borrow-balance user-data))
        (compounded-balance 
          (get-compounded-borrow-balance
            (get principal-borrow-balance user-data)
            (get stable-borrow-rate user-data)
            (get last-updated-block user-data)
            (get last-variable-borrow-cumulative-index user-data)

            (get current-variable-borrow-rate reserve-data)
            (get last-variable-borrow-cumulative-index reserve-data)
            (get last-updated-block reserve-data)
          )
        )
      )
        ;; (print {
        ;;   compounded-balance: compounded-balance,
        ;;   principal-borrow-balance: (get principal-borrow-balance user-data),
        ;;   current-variable-borrow-rate: (get current-variable-borrow-rate reserve-data),
        ;;   last-updated-block-reserve: (get last-updated-block reserve-data),
        ;;   last-variable-borrow-cumulative-index-reserve: (get last-variable-borrow-cumulative-index reserve-data),
        ;;   last-variable-borrow-cumulative-index: (get last-variable-borrow-cumulative-index user-data)
        ;; })
        ;; (print {
        ;;     principal: principal,
        ;;     compounded-balance: compounded-balance,
        ;;     balance-increase: (- compounded-balance principal),
        ;;   })
        (ok {
            principal: principal,
            compounded-balance: compounded-balance,
            balance-increase: (- compounded-balance principal),
          })
      )
    )
  )
)

(define-public (transfer-fee-to-collection
  (asset <ft>)
  (who principal)
  (amount uint)
  (destination principal)
  )
  (begin
    (try! (contract-call? asset transfer amount who destination none))
    (ok u0)
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
    (cumulated-interest
      (if (> stable-borrow-rate u0)
        ;; TODO: stable borrow enable
        u0
        (begin
          (div
            (mul
              (calculate-compounded-interest
                current-variable-borrow-rate
                (- block-height last-updated-block)
              )
              last-variable-borrow-cumulative-index-reserve
            )
            last-variable-borrow-cumulative-index
          )
        )
      )
    )
    (compounded-balance (mul principal-borrow-balance cumulated-interest))
  )
    (if (is-eq compounded-balance principal-borrow-balance)
      (if (is-eq last-updated-block block-height)
        (+ principal-borrow-balance u1)
        compounded-balance
      )
      compounded-balance
    )
  )
)

(define-public (transfer-to-user
  (asset <ft>)
  (who principal)
  (amount uint)
  )
  (begin
    (try! (as-contract (contract-call? asset transfer amount (as-contract tx-sender) who none)))
    (ok u0)
  )
)

(define-public (set-user-reserve-as-collateral (user principal) (asset <ft>) (use-as-collateral bool))
  (let (
    (user-data (get-user-reserve-data user (contract-of asset)))
    (data u0)
  )
    (asserts! true (err u0))
    (map-set
      user-reserve-data
      { user: user, reserve: (contract-of asset)}
      (merge user-data { use-as-collateral: use-as-collateral })
    )
    (ok true)
  )
)

(define-public (update-reserve-interest-rates-and-timestamp
  (asset <ft>)
  (liquidity-added uint)
  (liquidity-taken uint)
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (ret
      (try!
        (contract-call? .interest-rate-strategy-default
          calculate-interest-rates
          (- (+ (try! (get-reserve-available-liquidity asset)) liquidity-added) liquidity-taken)
          (get total-borrows-stable reserve-data)
          (get total-borrows-variable reserve-data)
          (get current-average-stable-borrow-rate reserve-data)
        )
      )
    )
    (new-reserve-state
      (merge
        reserve-data
        (merge
          {
            last-updated-block: block-height
          }
          ret
        )
      )
    )
  )
    (asserts! true (err u0))

    (map-set reserve-state (contract-of asset) new-reserve-state)
    (ok u0)
  )
)

(define-public (mint-on-deposit
  (who principal)
  (amount uint)
  (lp <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (ret (try! (cumulate-balance who lp asset)))
  )
    (asserts! true (err u0))

    (try! (contract-call? lp mint (+ (get balance-increase ret) amount) who))
    
    (ok u0)
  )
)

(define-public (transfer-to-reserve
  (asset <ft>)
  (who principal)
  (amount uint)
  )
  (begin
    (try! (contract-call? asset transfer amount who (as-contract tx-sender) none))
    (ok u0)
  )
)

(define-public (cumulate-balance
  (who principal)
  (lp <ft-mint-trait>)
  (asset principal)
  )
  (let (
    (previous-balance (try! (contract-call? lp get-balance who)))
    (balance-increase (- (try! (get-balance lp asset who)) previous-balance))
    (reserve-data (get-reserve-state asset))
    (new-user-index
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )
  )
    ;; TOOD: update user index
    (map-set user-index who new-user-index)
    ;; (print { cumulated-balance: (try! (get-balance lp asset who)) })

    (ok {
      previous-user-balance: previous-balance,
      new-user-balance: (+ previous-balance balance-increase),
      balance-increase: balance-increase,
      index: new-user-index
      }
    )
  )
)

(define-public (update-cumulative-indexes (asset principal))
  (let (
    (reserve-data (get-reserve-state asset))
    (total-borrows (get-total-borrows asset))
  )
    ;; TODO: add permissions
    (asserts! true (err u0))

    (if (> total-borrows u0)
      (let (
        (cumulated-liquidity-interest
          (calculate-linear-interest
            (get current-liquidity-rate reserve-data)
            (- block-height (get last-updated-block reserve-data))
          )
        )
        (current-liquidity-cumulative-index
          (mul
            cumulated-liquidity-interest
            (get last-liquidity-cumulative-index reserve-data)
          )
        )
        (cumulated-variable-borrow-interest
          (calculate-compounded-interest
            (get current-variable-borrow-rate reserve-data)
            (- block-height (get last-updated-block reserve-data))
          )
        )
        (current-variable-borrow-liquidity-cumulative-index
          (mul
            cumulated-liquidity-interest
            (get last-variable-borrow-cumulative-index reserve-data)
          )
        )
      )
        (ok
          (map-set
            reserve-state
            asset
            (merge
              reserve-data
              {
                last-liquidity-cumulative-index: current-liquidity-cumulative-index,
                last-variable-borrow-cumulative-index: current-variable-borrow-liquidity-cumulative-index
              }
            )
          )
        )
      )
      (ok false)
    )
  )
)

(define-read-only (get-total-borrows (asset principal))
  (let (
    (reserve-data (get-reserve-state asset))
  )
    (+ (get total-borrows-stable reserve-data) (get total-borrows-variable reserve-data))
  )
)

(define-public (get-balance (lp-token <ft>) (asset principal) (who principal))
  (let (
    (balance (try! (contract-call? lp-token get-balance who)))
  )
    (if (is-eq balance u0)
      (ok u0)
      (let (
        (cumulated-balance (try! (get-cumulated-balance who balance asset)))
      )
        (ok cumulated-balance)
      )
    )
  )
)

(define-read-only (get-cumulated-balance
  (who principal)
  (balance uint)
  (asset principal)
  )
  (let (
    (current-user-index (get-user-index who asset))
    (reserve-data (get-reserve-state asset))
    (normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)))
    )
    (asserts! true (err u0))
    ;; TODO: update user index
    (ok
      (div
        (mul
          balance
          normalized-income)
        current-user-index
      )
    )
  )
)

(define-read-only (get-normalized-income
  (current-liquidity-rate uint)
  (last-updated-block uint)
  (last-liquidity-cumulative-index uint)
)
  (let (
    (cumulated 
      (calculate-linear-interest
        current-liquidity-rate
        (- block-height last-updated-block)
      )
    )
  )
    (mul cumulated last-liquidity-cumulative-index)
  )
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (let (
    (user-data (get-user-reserve-data user (contract-of asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (get-user-underlying-asset-balance lp-token asset user)))
    (compounded-borrow-balance (get-compounded-borrow-balance
      (get principal-borrow-balance user-data)
      (get stable-borrow-rate user-data)
      (get last-updated-block user-data)
      (get last-variable-borrow-cumulative-index user-data)

      (get current-variable-borrow-rate reserve-data)
      (get last-variable-borrow-cumulative-index reserve-data)
      (get last-updated-block reserve-data)
    ))
  )
    (if (is-eq (get principal-borrow-balance user-data) u0)
      (ok {
        underlying-balance: underlying-balance,
        compounded-borrow-balance: u0,
        origination-fee: u0,
        use-as-collateral: (get use-as-collateral user-data)
      })
      (ok {
        underlying-balance: underlying-balance,
        compounded-borrow-balance: compounded-borrow-balance,
        origination-fee: (get origination-fee user-data),
        use-as-collateral: (get use-as-collateral user-data)
      })
    )
  )
)

(define-public (get-user-underlying-asset-balance
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (let (
    (user-data (get-user-reserve-data user (contract-of asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (get-balance lp-token (contract-of asset) user)))
  )
    (ok underlying-balance)
  )
)

(define-read-only (is-reserve-collateral-enabled-as-collateral (asset principal))
  (get usage-as-collateral-enabled (get-reserve-state asset))
)

(define-read-only (is-user-collateral-enabled-as-collateral (who principal) (asset <ft>))
  (get use-as-collateral (get-user-reserve-data who (contract-of asset)))
)

(define-read-only (calculate-compounded-interest
  (current-liquidity-rate uint)
  (delta uint)
  )
  (let (
    ;; (delta (- block-height last-updated-block))
    (rate-per-second (div (fixed-to-exp current-liquidity-rate) (get-seconds-in-year)))
    (time (* delta (get-seconds-in-block)))
  )
    (taylor-6 (mul rate-per-second time))
  )
)

(define-read-only (calculate-linear-interest
  (current-liquidity-rate uint)
  (delta uint)
  )
  (let (
    ;; (delta (- block-height last-updated-block))
    (years-elapsed (div (* delta (get-seconds-in-block)) (get-seconds-in-year)))
  )
    (+ one-8 (mul years-elapsed current-liquidity-rate))
  )
)


;; (define-public (add-asset (asset <ft>) (amount uint) (token-id uint) (sender principal))
;;   (let (
;;     (asset-amount (default-to u0 (map-get? assets token-id) )))
;;     ;; (try! (is-approved-contract contract-caller))
;;     (try! (contract-call? asset transfer amount sender (as-contract tx-sender) none))
;;     (print {sender: sender, amount: amount})
;;     (map-set assets token-id (+ asset-amount amount))

;;     (print { type: "add-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
;;     (ok (+ asset-amount amount))
;;   )
;; )

;; (define-public (remove-asset (asset <ft>) (amount uint) (token-id uint) (recipient principal))
;;   (let (
;;     (asset-amount (default-to u0 (map-get? assets token-id)))
;;     )
;;     ;; (try! (is-approved-contract contract-caller))
;;     (try! (as-contract (contract-call? asset transfer amount tx-sender recipient none)))
;;     (if (>= amount asset-amount)
;;       (begin
;;         (map-set assets token-id u0)
;;         (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
;;         (ok u0)
;;       )
;;       (begin
;;         (map-set assets token-id (- asset-amount amount))
;;         (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount:  amount } } })
;;         (ok (- asset-amount amount))
;;       )
;;     )
;;   )
;; )

;; (define-public (draw (asset <ft>) (token-id uint) (recipient principal))
;;   (let (
;;     (asset-amount (default-to u0 (map-get? assets token-id)))
;;     )
;;     ;; (try! (is-approved-contract contract-caller))
;;     (try! (as-contract (contract-call? asset transfer asset-amount tx-sender recipient none)))
;;     (map-delete assets token-id)

;;     (print { type: "draw-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: asset-amount }} })
;;     (ok asset-amount)
;;   )
;; )

(define-public (transfer (amount uint) (recipient principal) (f-t <ft>))
  (begin
    ;; (try! (is-approved-contract contract-caller))
    (print { type: "transfer-liquidity-vault-v1-0", payload: { amount: amount, recipient: recipient, asset: f-t } })
    (as-contract (contract-call? f-t transfer amount tx-sender recipient none))
  )
)

;; (define-public (get-asset (token-id uint))
;;   (ok (map-get? assets token-id)))

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_INVALID_TOKEN_ID (err u7001))
