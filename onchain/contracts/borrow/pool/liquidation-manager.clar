(use-trait ft .ft-trait.ft-trait)


(define-data-var health-factor-liquidation-treshold uint u90000000)
;; 50%
(define-data-var liquidation-close-factor-percent uint u50000000)


(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft> }))
)
  (let (
    (reserves (contract-call? .pool-0-reserve get-assets))
    (aggregate (try!
        (fold
          aggregate-user-data
          assets
          (ok
            {
              total-liquidity-balanceSTX: u0,
              total-collateral-balanceSTX: u0,
              total-borrow-balanceSTX: u0,
              total-feesSTX: u0,
              current-ltv: u0,
              current-liquidation-threshold: u0,
              user: user
            }
          )
        )
      )
    )
    (total-collateral-balanceSTX (get total-collateral-balanceSTX aggregate))
    (current-ltv
      (if (> total-collateral-balanceSTX u0)
        (div (get current-ltv aggregate) total-collateral-balanceSTX)
        u0
      )
    )
    (current-liquidation-threshold
      (if (> total-collateral-balanceSTX u0)
        (div (get current-liquidation-threshold aggregate) total-collateral-balanceSTX)
        u0
      )
    )
    (health-factor
      (calculate-health-factor-from-balances
        (get total-collateral-balanceSTX aggregate)
        (get total-borrow-balanceSTX aggregate)
        (get total-feesSTX aggregate)
        (get current-liquidation-threshold aggregate)
      )
    )
    (is-health-factor-below-treshold (< health-factor (var-get health-factor-liquidation-treshold)))
  )
    
    (ok {
      total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate),
      total-collateral-balanceSTX: total-collateral-balanceSTX,
      total-borrow-balanceSTX: (get total-borrow-balanceSTX aggregate),
      total-feesSTX: (get total-feesSTX aggregate),
      current-ltv: current-ltv,
      current-liquidation-threshold: current-liquidation-threshold,
      health-factor: health-factor,
      is-health-factor-below-treshold: is-health-factor-below-treshold
    })
  )
)

(define-read-only (calculate-health-factor-from-balances
  (total-collateral-balanceSTX uint)
  (total-borrow-balanceSTX uint)
  (total-feesSTX uint)
  (current-liquidation-threshold uint)
  )
  u0
)

(define-private (aggregate-user-data
  (reserve
    {
      asset: <ft>,
      lp-token: <ft>
    }
  )
  (total
    (response
      (tuple
        (total-liquidity-balanceSTX uint)
        (total-collateral-balanceSTX uint)
        (total-borrow-balanceSTX uint)
        (total-feesSTX uint)
        (user principal)
        (current-ltv uint)
        (current-liquidation-threshold uint)
      )
      uint
    )
  ))
  (let (
    (result (unwrap-panic total))
  )
    (asserts! true (err u1))
    (try!
      (get-user-basic-reserve-data
        (get lp-token reserve)
        (get asset reserve)
        result
      )
    )
    total
  )
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (aggregate {
    total-liquidity-balanceSTX: uint,
    total-collateral-balanceSTX: uint,
    total-borrow-balanceSTX: uint,
    total-feesSTX: uint,
    current-ltv: uint,
    current-liquidation-threshold: uint,
    user: principal
  })
  )
  (let (
    (user (get user aggregate))
    (user-reserve-data (try! (contract-call? .pool-0-reserve get-user-basic-reserve-data lp-token asset user)))
  )
    (if (is-eq (+ (get compounded-borrow-balance user-reserve-data) (get compounded-borrow-balance user-reserve-data)) u0)
      ;; do nothing this loop
      (begin
        (ok 
          {
            total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate),
            total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
            total-borrow-balanceSTX: (get total-borrow-balanceSTX aggregate),
            total-feesSTX: (get total-feesSTX aggregate),
            current-ltv: (get current-ltv aggregate),
            current-liquidation-threshold: (get current-liquidation-threshold aggregate),
            user: user
          }
        )
      )
      (let (
        (reserve-data (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
        (token-unit (* u10 (get decimals reserve-data)))
        ;; TODO: Correct for fixed-point arithemetic
        (reserve-unit-price u100000000)
        ;; liquidity and collateral balance
        (liquidity-balanceSTX (/ (* reserve-unit-price (get underlying-balance user-reserve-data)) token-unit))
        (ret-1
          (let (
            (total-liquidity-balance (+ (get total-liquidity-balanceSTX aggregate) liquidity-balanceSTX))
          )
            (if (> (get underlying-balance user-reserve-data) u0)
              (if (and (get usage-as-collateral-enabled reserve-data) (get use-as-collateral user-reserve-data))
                {
                  total-liquidity-balanceSTX:  total-liquidity-balance,
                  total-collateral-balanceSTX: (+ (get total-collateral-balanceSTX aggregate) liquidity-balanceSTX),
                  current-ltv: (+ (get current-ltv aggregate) ),
                  current-liquidation-threshold:
                    (+
                      (get current-liquidation-threshold aggregate)
                      (/ (* (get origination-fee user-reserve-data) reserve-unit-price) token-unit)
                    )
                }
                {
                  total-liquidity-balanceSTX: total-liquidity-balance,
                  total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
                  current-ltv: (get current-ltv aggregate),
                  current-liquidation-threshold: (get current-liquidation-threshold aggregate)
                }
              )
              {
                total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate),
                total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
                current-ltv: (get current-ltv aggregate),
                current-liquidation-threshold: (get current-liquidation-threshold aggregate)
              }
            )
          )
        )
        (ret-2
          (if (> (get compounded-borrow-balance user-reserve-data) u0)
            {
              total-borrow-balanceSTX:
                (+ 
                  (get total-borrow-balanceSTX aggregate)
                  (/ (* reserve-unit-price (get compounded-borrow-balance user-reserve-data)) token-unit)
                ),
              total-feesSTX:
                (+
                  (get total-feesSTX aggregate)
                  (/ (* (get origination-fee user-reserve-data) reserve-unit-price) token-unit)
                )
            }
            {
              total-borrow-balanceSTX: (get total-borrow-balanceSTX aggregate),
              total-feesSTX: (get total-feesSTX aggregate)
            }
          )
        )
      )
        (ok
          (merge
            (merge
              ret-1
              ret-2
            )
            { user: user }
          )
        )
      )
    )
  )
)


;; liquidates 1 collateral asset
(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft> }))
  (lp-token <ft>)
  (collateral-to-liquidate <ft>)
  (purchasing-asset <ft>)
  (oracle principal)
  (user principal)
  (purchase-amount uint)
  (to-receive-underlying bool)
  )
  (let (
    (ret (try! (calculate-user-global-data user assets)))
    (user-collateral-balance (try! (get-user-underlying-asset-balance lp-token collateral-to-liquidate user)))
  )
    ;; health factor below treshold
    (asserts! (get is-health-factor-below-treshold ret) (err u1))
    ;; has deposited collateral
    (asserts! (> user-collateral-balance u0) (err u2))
    ;; collateral is enabled in asset reserve and by user
    (asserts! (
      and
        (is-reserve-collateral-enabled-as-collateral user)
        (is-user-collateral-enabled-as-collateral user collateral-to-liquidate)
      ) (err u3)
    )

    ;; if liquidator wants underlying asset, check there is enough collateral
    (if (not to-receive-underlying)
      true
      false
    )

    (let (
      (borrowed-ret (try! (get-user-borrow-balance user purchasing-asset)))
      (compounded-borrow-balance (get compounded-balance borrowed-ret))
    )
      ;; not borrowing anything
      (asserts! (> (get compounded-balance borrowed-ret) u0) (err u4))

      (let (
        (max-principal-amount-to-liquidate 
          (mul
            compounded-borrow-balance
            (var-get liquidation-close-factor-percent)
          )
        )
        (amount-to-liquidate
          (if (> purchase-amount max-principal-amount-to-liquidate)
            max-principal-amount-to-liquidate
            purchase-amount
          )
        )
        (collateral-ret
          (try! 
            (calculate-available-collateral-to-liquidate
              collateral-to-liquidate
              purchasing-asset
              oracle
              amount-to-liquidate
              user-collateral-balance
            )
          )
        )
        (origination-fee (get-user-origination-fee user purchasing-asset))
        (collateral-fees
          (if (> origination-fee u0)
            ;; if fees, take into account when calcualting available collateral
            (try!
              (calculate-available-collateral-to-liquidate
                collateral-to-liquidate
                purchasing-asset
                oracle
                amount-to-liquidate
                (- user-collateral-balance origination-fee)
              )
            )
            collateral-ret
          )
        )
        (actual-amount-to-liquidate
          (if (< (get principal-amount-needed collateral-ret) amount-to-liquidate)
            (get principal-amount-needed collateral-ret)
            amount-to-liquidate
          )
        )

      )
        u0
      )

      u0
    )

    (ok u0)
  )

)

(define-public (calculate-available-collateral-to-liquidate
  (collateral <ft>)
  (asset-borrowed <ft>)
  (oracle principal)
  (purchase-amount uint)
  (user-collateral-balance uint)
  )
  (let (
    (collateral-price (try! (contract-call? .oracle get-asset-price collateral)))
    (principal-current-price (try! (contract-call? .oracle get-asset-price asset-borrowed)))
    (liquidation-bonus (get-liquidation-bonus collateral))
    (max-amount-collateral-to-liquidate
      (div
        (mul
          principal-current-price
          collateral-price
        )
        liquidation-bonus
      )
    )
    (amounts-ret
      (if (> max-amount-collateral-to-liquidate  user-collateral-balance)
        {
          collateral-amount: user-collateral-balance,
          principal-amount-needed:
            (div
              (div
                (mul
                  collateral-price
                  user-collateral-balance
                )
                principal-current-price
              )
              liquidation-bonus
            )
        }
        {
          collateral-amount: max-amount-collateral-to-liquidate,
          principal-amount-needed: purchase-amount
        }
      )
    )
  )
    (ok amounts-ret)
  )
)

(define-read-only (get-user-origination-fee (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve get-user-origination-fee who asset)
)

(define-read-only (get-liquidation-bonus (asset <ft>))
  (contract-call? .pool-0-reserve get-reserve-liquidation-bonus asset)
)

(define-public (get-user-borrow-balance (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve get-user-borrow-balance who asset)
)

(define-public (get-user-underlying-asset-balance
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (contract-call? .pool-0-reserve get-user-underlying-asset-balance lp-token asset user)
)

(define-read-only (is-reserve-collateral-enabled-as-collateral (user principal))
  (contract-call? .pool-0-reserve is-reserve-collateral-enabled-as-collateral user)
)

(define-read-only (is-user-collateral-enabled-as-collateral (user principal) (asset <ft>))
  (contract-call? .pool-0-reserve is-user-collateral-enabled-as-collateral user asset)
)

