(use-trait ft .ft-trait.ft-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)

(define-public (signal-redeem (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint) (owner principal))
  (let (
    (current-exit-at (get-exit-at token-id owner))
    (current-cycle (get-current-cycle token-id))
    (locked-shares (get-cycle-shares-by-principal token-id owner))
    (current-exit-cycle-shares (get-cycle-shares token-id current-exit-at))
    (next-exit-cycle (+ u2 current-cycle))
    (next-exit-cycle-shares-principal (+ shares locked-shares))
    (next-exit-cycle-shares (+ (get-cycle-shares token-id next-exit-cycle) shares))
    (contract-addr (as-contract tx-sender))
  )
    ;; check contract-caller is pool
    (try! (contract-call? lp transfer shares owner contract-addr none))

    (map-set shares-principal { token-id: token-id, user: owner } next-exit-cycle-shares-principal)
    (map-set cycles-shares { token-id: token-id, cycle: next-exit-cycle } next-exit-cycle-shares)
    (map-set exit-at-cycle { token-id: token-id, user: owner } next-exit-cycle)

    (ok true)
  )
)

;; @desc removing locked shares from the cycle
(define-public (remove-shares (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint) (owner principal))
  (let (
    (current-exit-at (get-exit-at token-id owner))
    (current-cycle (get-current-cycle token-id))
    (locked-shares (get-cycle-shares-by-principal token-id owner))
    (current-exit-cycle-shares (get-cycle-shares token-id current-exit-at))
    (next-exit-cycle (+ u2 current-cycle))
    ;; if underflow, then owner is trying to remove more shares than they own
    (remaining-shares (- locked-shares shares))
    (next-exit-cycle-shares (get-cycle-shares token-id next-exit-cycle))
    (contract-addr (as-contract tx-sender))
  )
    (if (> remaining-shares u0)
      ;; move over to next cycle
      (begin
        (map-set shares-principal { token-id: token-id, user: owner } remaining-shares)
        (map-set exit-at-cycle { token-id: token-id, user: owner } next-exit-cycle)
        (map-set cycles-shares { token-id: token-id, cycle: current-cycle } (- current-exit-cycle-shares locked-shares))
        (map-set cycles-shares { token-id: token-id, cycle: next-exit-cycle } (+ next-exit-cycle-shares remaining-shares))
      )
      ;; empty locked shares
      (begin
        (map-delete shares-principal { token-id: token-id, user: owner })
        (map-delete exit-at-cycle { token-id: token-id, user: owner })
        (map-set cycles-shares { token-id: token-id, cycle: current-cycle } (- current-exit-cycle-shares shares))
      )
    )

    (try! (as-contract (contract-call? lp transfer shares tx-sender owner none)))

    (ok true)
  )
)

;; @desc redeem assets by claiming locked funds
(define-public (redeem (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (requested-shares uint) (owner principal) (recipient principal))
  (let (
    (pool (unwrap-panic (get-pool token-id)))
    (redeemeables (unwrap-panic (get-redeemeable-amounts lp token-id l-v asset requested-shares owner)))
    (redeemeable-shares (get redeemeable-shares redeemeables))
    (current-exit-at (get-exit-at token-id owner))
    (current-cycle (get-current-cycle token-id))
    (next-exit-cycle (+ current-cycle (if (get partial-liquidity redeemeables) u1 u2)))
    (current-exit-cycle-shares (get-cycle-shares token-id current-exit-at))
    (locked-shares (get-cycle-shares-by-principal token-id owner))
    (globals (contract-call? .globals get-globals))
    (max-window-time (+ (get-height-of-cycle token-id current-exit-at) (get withdrawal-window pool)))
    ;; get previously signaled shares
    (exit-cycle-shares (get-cycle-shares token-id next-exit-cycle))
  )
    ;; TODO: verify correct amount of shares
    (asserts! (>= locked-shares requested-shares) ERR_TOO_MANY_SHARES)
    (asserts! (>= current-cycle current-exit-at) ERR_FUNDS_LOCKED)
    (asserts! (>= max-window-time block-height) ERR_WINDOW_EXPIRED)

    (if (> locked-shares redeemeable-shares)
      ;; If there are remaining shares
      (begin
        ;; remove from current exit
        (map-delete cycles-shares { token-id: token-id, cycle: current-exit-at })
        ;; add to next cycle
        (map-set cycles-shares { token-id: token-id, cycle: next-exit-cycle } (+ exit-cycle-shares (- current-exit-cycle-shares redeemeable-shares)))
        (map-set exit-at-cycle { token-id: token-id, user: owner } next-exit-cycle)
        (map-set shares-principal { token-id: token-id, user: owner } (- locked-shares redeemeable-shares))
      )
      (begin
        (map-set cycles-shares { token-id: token-id, cycle: current-exit-at } (- current-exit-cycle-shares redeemeable-shares))
        (map-delete exit-at-cycle { token-id: token-id, user: owner })
        (map-delete shares-principal { token-id: token-id, user: owner })
      )
    )

    (try! (as-contract (contract-call? lp transfer redeemeable-shares tx-sender recipient none)))
    (ok redeemeables)
  )
)

;; get redeemeable amount based on available liquidity
(define-public (get-redeemeable-amounts (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (requested-shares uint) (owner principal))
  (let (
    (pool (unwrap-panic (get-pool token-id)))
    (liquidity (default-to u0 (try! (contract-call? l-v get-asset token-id))))
    (total-supply (unwrap-panic (contract-call? lp get-total-supply)))
    (losses (get losses pool))
    (assets (unwrap-panic (total-assets lp l-v token-id asset)))
    (assets-wo-losses (- assets losses))
    (exit-at (get-exit-at token-id owner))
    (cycle-shares (get-cycle-shares token-id exit-at))
    (cycle-shares-principal (get-cycle-shares-by-principal token-id owner))
    (needed-assets (/ (* assets-wo-losses cycle-shares) total-supply))
    (total-reedemeable-assets (/ (* assets-wo-losses cycle-shares-principal) total-supply))
    (redeemeable-assets (/ (* liquidity requested-shares) cycle-shares))
  )
    (begin
      (if (< liquidity needed-assets)
        ;; if not enough liquidity for all shares
        (ok {
          redeemeable-assets: redeemeable-assets,
          redeemeable-shares: (/ (* requested-shares redeemeable-assets) total-reedemeable-assets),
          partial-liquidity: true })
        ;; if enough liquidity for all shares
        (ok {
          redeemeable-assets: (/ (* requested-shares assets-wo-losses) total-supply),
          redeemeable-shares: requested-shares,
          partial-liquidity: false })
      )
    )
  )
)

(define-public (update-withdrawal-data (pool-id uint))
  (let (
    (withdrawal (try! (contract-call? .withdrawal-data get-withdrawal-data pool-id)))
    )
    (ok true)
  )
)

(define-public (total-assets (lp <ft-mint-trait>) (l-v <lv>) (token-id uint) (asset <ft>))
  (let 
    ((pool (try! (get-pool token-id))))
    (ok (+ (get principal-out pool) (default-to u0 (try! (contract-call? l-v get-asset token-id)))) )
  )
)

(define-map exit-at-cycle { token-id: uint, user: principal } uint)
(define-map cycles-shares { token-id: uint, cycle: uint } uint )
(define-map shares-principal { token-id: uint, user: principal } uint)

(define-private (set-shares (token-id uint) (cycle uint) (total-cycle-shares uint) (shares uint) (caller principal))
  (begin
    (map-set cycles-shares { token-id: token-id, cycle: cycle } shares)
    (map-set shares-principal { token-id: token-id, user: caller } total-cycle-shares) )
)

(define-private (clear-shares (token-id uint) (cycle uint) (caller principal))
  (begin
    (map-delete cycles-shares { token-id: token-id, cycle: cycle })
    (map-delete shares-principal { token-id: token-id, user: caller })
    (map-delete exit-at-cycle { token-id: token-id, user: caller }) ))

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id))

(define-public (get-funds-sent (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent owner token-id))

(define-read-only (get-cycle-shares (token-id uint) (cycle uint))
  (default-to u0 (map-get? cycles-shares { token-id: token-id, cycle: cycle })))

(define-read-only (get-cycle-shares-by-principal (token-id uint) (user principal))
  (default-to u0 (map-get? shares-principal { token-id: token-id, user: user })))

(define-read-only (get-exit-at (token-id uint) (user principal))
  (default-to u0 (map-get? exit-at-cycle { token-id: token-id, user: user })))

(define-read-only (get-funds-unlocked-at (token-id uint) (owner principal))
  (get-height-of-cycle token-id (get-exit-at token-id owner)))

(define-read-only (get-next-exit-cycle (token-id uint))
  (+ u2 (get-current-cycle token-id)))

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (contract-call? .pool-data get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height))
    (/ (- stacks-height first-block) cycle-length)))

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id)))
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none)))

(define-read-only (get-height-of-cycle (token-id uint) (cycle uint))
  (let (
    (pool (get-pool-read token-id))
    (pool-start (get pool-stx-start pool))
    (cycle-length (get cycle-length pool))
    (cycle-height (+ pool-start (* cycle-length cycle))))
    cycle-height))

(define-read-only (get-pool-read (token-id uint))
  (contract-call? .pool-data get-pool-read token-id))

(define-read-only (get-cycle-start (token-id uint))
  (get pool-stx-start (get-pool-read token-id)))

(define-constant ERR_UNAUTHORIZED (err u16000))
(define-constant ERR_NO_COMMITMENT (err u16001))
(define-constant ERR_TOO_MANY_SHARES (err u16002))
(define-constant ERR_WINDOW_EXPIRED (err u16003))
(define-constant ERR_FUNDS_LOCKED (err u16004))


