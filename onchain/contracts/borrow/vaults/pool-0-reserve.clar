;; (impl-trait .ownable-trait.ownable-trait)
;; (impl-trait .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(define-constant a-token .lp-token-0)
;; (define-constant default-interest-rate-strategy-address .interest-rate-strategy-default)

(define-constant one-8 u100000000)

(define-map assets uint uint)
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


(define-map
  user-reserve-data
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

(define-constant
  default-user-reserve-data
  {
    principal-borrow-balance: u0,
    last-variable-borrow-cumulative-index: u0,
    origination-fee: u0,
    stable-borrow-rate: u0,
    last-updated-block: u0,
    use-as-collateral: false
  }
)

(define-data-var reserve-state
  (tuple
    (last-liquidity-cumulative-index uint)
    (current-liquidity-rate uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-stable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
    (last-variable-borrow-cumulative-index uint)
    (base-ltvas-collateral uint)
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
  {
    last-liquidity-cumulative-index: u0,
    current-liquidity-rate: u0,
    total-borrows-stable: u0,
    total-borrows-variable: u0,
    current-variable-borrow-rate: u0,
    current-stable-borrow-rate: u0,
    current-average-stable-borrow-rate: u0,
    last-variable-borrow-cumulative-index: u0,
    base-ltvas-collateral: u0,
    liquidation-threshold: u0,
    liquidation-bonus: u0,
    decimals: u0,
    a-token-address: tx-sender,
    interest-rate-strategy-address: tx-sender,
    last-updated-block: u0,
    borrowing-enabled: false,
    usage-as-collateral-enabled: false,
    is-stable-borrow-rate-enabled: false,
    is-active: false,
    is-freezed: false
  }
)

(define-map user-index principal uint)

(define-public (init
  (a-token-address principal)
  (decimals uint)
  (interest-rate-strategy-address principal)
)
  (ok
    (var-set reserve-state
      (merge
        (var-get reserve-state)
        {
          last-liquidity-cumulative-index: one-8,
          last-variable-borrow-cumulative-index: one-8,
          a-token-address: a-token-address,
          decimals: decimals,
          interest-rate-strategy-address: interest-rate-strategy-address,
          is-active: true,
          is-freezed: false
        }
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

    (try! (update-cumulative-indexes))
    (try! (update-reserve-interest-rates-and-timestamp asset amount-deposited u0))

    (if is-first-deposit
      (set-user-reserve-as-collateral who asset true)
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

(define-public (update-user-state-on-repay
  (asset <ft>)
  (who principal)
  (payback-amount-minus-fees uint)
  (origination-fee-repaid uint)
  (balance-increase uint)
  (repaid-whole-loan bool)
  )
  (let (
    (reserve-data (var-get reserve-state))
    (user-data (get-user-reserve-data who asset))
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
    (reserve-data (var-get reserve-state))
    (user-data (get-user-reserve-data who asset))
  )
    (try! (update-cumulative-indexes))
    (var-set
      reserve-state
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

(define-read-only (get-user-reserve-data
  (who principal)
  (reserve <ft>)
  )
  (default-to default-user-reserve-data (map-get? user-reserve-data { user: who, reserve: (contract-of reserve) }))
)


(define-public (update-state-on-redeem
  (asset <ft>)
  (who principal)
  (amount-deposited uint)
  (user-redeemed-everything bool)
  )
  (begin
    (try! (update-cumulative-indexes))
    (try! (update-reserve-interest-rates-and-timestamp asset amount-deposited u0))

    (if user-redeemed-everything
      (set-user-reserve-as-collateral who asset user-redeemed-everything)
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

    (ok {
      user-current-borrow-rate: (get-user-current-borrow-rate who asset),
      balance-increase: (get balance-increase ret)
    })
  )
)

(define-read-only (get-user-current-borrow-rate
  (who principal)
  (asset <ft>)
  )
  (let (
    (reserve-data (var-get reserve-state))
    (user-data (get-user-reserve-data who asset))
  )
    (get current-variable-borrow-rate reserve-data)
  )
)

(define-read-only (get-user-origination-fee
  (who principal)
  (asset <ft>)
  )
  (let (
    (user-data (get-user-reserve-data who asset))
  )
    (get origination-fee user-data)
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
    (reserve-data (var-get reserve-state))
    (user-data (get-user-reserve-data who asset))
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
    (ok u0)
  )
)

(define-public (update-reserve-state-on-borrow
  (principal-borrow-balance uint)
  (balance-increase uint)
  (amount-borrowed uint)
  )
  (begin
    (try! (update-cumulative-indexes))
    (try! (update-reserve-total-borrows-by-rate-mode
      principal-borrow-balance
      balance-increase
      amount-borrowed
    ))
    (ok u0)
  )
)

(define-public (update-reserve-total-borrows-by-rate-mode
  (principal-balance uint)
  (balance-increase uint)
  (amount-borrowed uint)
  )
  (let (
    (reserve-data (var-get reserve-state))
    (new-principal-amount (+ principal-balance balance-increase amount-borrowed))
  )
    ;; TODO: increase borrow amount
    (asserts! true (err u0))
    (var-set
      reserve-state
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

(define-public (get-user-borrow-balance
  (who principal)
  (asset <ft>)
)
  (let (
    (user-data (get-user-reserve-data who asset))
    (reserve-data (var-get reserve-state))
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
                last-updated-block-reserve
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
    (user-data (get-user-reserve-data user asset))
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
    (reserve-data (var-get reserve-state))
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
          ret
          {
            last-updated-block: block-height
          }
        )
      )
    )
  )
    (asserts! true (err u0))

    (var-set reserve-state new-reserve-state)
    (ok u0)
  )
)

(define-public (mint-on-deposit (who principal) (amount uint) (lp <ft-mint-trait>))
  (let (
    (ret (try! (cumulate-balance who lp)))
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

(define-public (cumulate-balance (who principal) (lp <ft-mint-trait>))
  (let (
    (previous-balance (try! (contract-call? lp get-balance who)))
    (balance-increase (- (try! (get-balance lp who)) previous-balance))
    (reserve-data (var-get reserve-state))
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

    (ok {
      previous-user-balance: previous-balance,
      new-user-balance: (+ previous-balance balance-increase),
      balance-increase: balance-increase,
      index: new-user-index
      }
    )
  )
)

(define-public (get-reserve-available-liquidity
  (asset <ft>)
)
  (contract-call? asset get-balance (as-contract tx-sender))
)

(define-public (update-cumulative-indexes)
  (let (
    (reserve-data (var-get reserve-state))
    (total-borrows (get-total-borrows))
  )
    ;; TODO: add permissions
    (asserts! true (err u0))

    (if (> total-borrows u0)
      (let (
        (cumulated-liquidity-interest
          (calculate-linear-interest
            (get current-liquidity-rate reserve-data)
            (get last-updated-block reserve-data)
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
            (get last-updated-block reserve-data)
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
          (var-set
            reserve-state
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

(define-read-only (get-total-borrows)
  (let (
    (reserve-data (var-get reserve-state))
  )
    (+ (get total-borrows-stable reserve-data) (get total-borrows-variable reserve-data))
  )
)


(define-public (get-balance (lp-token <ft>) (who principal))
  (let (
    (balance (try! (contract-call? lp-token get-balance who)))
  )
    (if (is-eq balance u0)
      (ok u0)
      (let (
        (cumulated-balance (try! (get-cumulated-balance who balance)))
      )
        (ok cumulated-balance)
      )
    )
  )
)

(define-public (get-cumulated-balance
  (who principal)
  (balance uint))
  (let (
    (current-user-index (get-user-index who))
    (reserve-data (var-get reserve-state))
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

(define-read-only (get-user-index (who principal))
  (default-to (get last-liquidity-cumulative-index (var-get reserve-state)) (map-get? user-index who))
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
        last-updated-block))
  )
    (mul cumulated last-liquidity-cumulative-index)
  )
)


(define-read-only (calculate-compounded-interest
  (current-liquidity-rate uint)
  (last-updated-block uint)
  )
  (let (
    (delta (- block-height last-updated-block))
    (rate-per-second (div (fixed-to-exp current-liquidity-rate) (get-seconds-in-year)))
    (time (* delta (get-seconds-in-block)))
  )
    (taylor-6 (mul rate-per-second time))
  )
)

(define-read-only (calculate-linear-interest
  (current-liquidity-rate uint)
  (last-updated-block uint)
  )
  (let (
    (delta (- block-height last-updated-block))
    (years-elapsed (div (* delta (get-seconds-in-block)) (get-seconds-in-year)))
  )
    (+ one-8 (mul years-elapsed current-liquidity-rate))
  )
)


(define-public (add-asset (asset <ft>) (amount uint) (token-id uint) (sender principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id) )))
    ;; (try! (is-approved-contract contract-caller))
    (try! (contract-call? asset transfer amount sender (as-contract tx-sender) none))
    (print {sender: sender, amount: amount})
    (map-set assets token-id (+ asset-amount amount))

    (print { type: "add-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
    (ok (+ asset-amount amount))
  )
)

(define-public (remove-asset (asset <ft>) (amount uint) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id)))
    )
    ;; (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer amount tx-sender recipient none)))
    (if (>= amount asset-amount)
      (begin
        (map-set assets token-id u0)
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: amount }} })
        (ok u0)
      )
      (begin
        (map-set assets token-id (- asset-amount amount))
        (print { type: "remove-asset-liquidity-vault-v1-0", payload: { key: token-id, data: { amount:  amount } } })
        (ok (- asset-amount amount))
      )
    )
  )
)

(define-public (draw (asset <ft>) (token-id uint) (recipient principal))
  (let (
    (asset-amount (default-to u0 (map-get? assets token-id)))
    )
    ;; (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? asset transfer asset-amount tx-sender recipient none)))
    (map-delete assets token-id)

    (print { type: "draw-liquidity-vault-v1-0", payload: { key: token-id, data: { amount: asset-amount }} })
    (ok asset-amount)
  )
)

(define-public (transfer (amount uint) (recipient principal) (f-t <ft>))
  (begin
    ;; (try! (is-approved-contract contract-caller))
    (print { type: "transfer-liquidity-vault-v1-0", payload: { amount: amount, recipient: recipient, asset: f-t } })
    (as-contract (contract-call? f-t transfer amount tx-sender recipient none))
  )
)

(define-public (get-asset (token-id uint))
  (ok (map-get? assets token-id)))

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_INVALID_TOKEN_ID (err u7001))
