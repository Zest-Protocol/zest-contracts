(use-trait ft .ft-trait.ft-trait)
(use-trait sip-010 .sip-010-trait.sip-010-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)

;; (define-public (signal-withdrawal (lp-token <lp-token>) (token-id uint) (amount uint) (caller principal))
;;   (let (
;;     (pool (try! (get-pool token-id)))
;;     (funds-sent-data (try! (get-funds-sent caller token-id)))
;;     (new-funds-sent (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
;;     (current-cycle (get-current-cycle token-id))
;;     (previous-exit-at (get-exit-at-cycle token-id caller))
;;     (cycle-shares (get-cycle-shares token-id current-cycle)))
;;     ;; permissions
;;     (asserts! (is-eq caller tx-sender) ERR_UNAUTHORIZED)

;;     ;; TODO: recover shares from previously signaled withdrawal

;;     (set-shares token-id (+ u2 current-cycle) amount caller)
;;     (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))

;;     (ok true)))

(define-public (withdraw (lp-token <lp-token>) (token-id uint) (amount uint) (caller principal))
  (let (
    (current-exit-at (get-exit-at-cycle token-id caller))
    (cycle-shares (get-cycle-shares token-id current-exit-at))
    (cycle-shares-principal (get-cycle-shares-by-principal token-id current-exit-at caller))
    (shares-returned u0)
    )
    (ok shares-returned)
  )
)

(define-public (signal-redeem (lp-token <sip-010>) (token-id uint) (asset <ft>) (shares uint) (owner principal))
  (let (
    (current-exit-at (get-exit-at-cycle token-id owner))
    (current-cycle (get-current-cycle token-id))
    (current-exit-cycle-shares (get-cycle-shares token-id current-exit-at))
    (current-exit-cycle-shares-principal (get-cycle-shares-by-principal token-id current-exit-at owner))
    (next-exit-cycle (+ u2 current-cycle ))
    (next-exit-cycle-shares (get-cycle-shares token-id next-exit-cycle))
    (next-exit-cycle-shares-principal (get-cycle-shares-by-principal token-id next-exit-cycle owner))
    ;; TODO: consider when signaling again without having redeemed shares
    (shares-returned u0)
  )
    (try! (contract-call? lp-token transfer shares owner (as-contract tx-sender) none))
    (set-shares token-id next-exit-cycle (+ next-exit-cycle-shares next-exit-cycle-shares-principal) next-exit-cycle-shares-principal owner)
    (ok true)
  )
)

(define-public (redeem (lp-token <sip-010>) (asset <ft>) (shares uint) (owner principal) (sender principal))
  (begin
    (ok true)
  )
)

(define-map exit-at-cycle { token-id: uint, user: principal } uint)
(define-map cycles-shares { token-id: uint, cycle: uint } uint )
(define-map cycles-shares-principal { token-id: uint, cycle: uint, user: principal } uint)

(define-private (set-shares (token-id uint) (cycle uint) (total-cycle-shares uint) (shares uint) (caller principal))
  (begin
    (map-set cycles-shares { token-id: token-id, cycle: cycle } shares)
    (map-set cycles-shares-principal { token-id: token-id, cycle: cycle, user: caller } total-cycle-shares)
    (map-set exit-at-cycle { token-id: token-id, user: caller } cycle)
  ))

(define-private (remove-shares (token-id uint) (cycle uint) (shares uint) (caller principal))
  (let (
    (cycle-shares (get-cycle-shares token-id cycle)))

    (map-set cycles-shares { token-id: token-id, cycle: cycle } (- cycle-shares shares))
    (map-set cycles-shares-principal { token-id: token-id, cycle: cycle, user: caller } (- cycle-shares shares))
  ))

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id))

(define-public (get-funds-sent (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent owner token-id))

(define-read-only (get-cycle-shares (token-id uint) (cycle uint))
  (default-to u0 (map-get? cycles-shares { token-id: token-id, cycle: cycle })))

(define-read-only (get-cycle-shares-by-principal (token-id uint) (cycle uint) (user principal))
  (default-to u0 (map-get? cycles-shares-principal { token-id: token-id, cycle: cycle, user: user })))

(define-read-only (get-exit-at-cycle (token-id uint) (user principal))
  (default-to u0 (map-get? exit-at-cycle { token-id: token-id, user: user })))

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

(define-read-only (get-pool-read (token-id uint))
  (contract-call? .pool-data get-pool-read token-id))

(define-read-only (get-cycle-start (token-id uint))
  (get pool-stx-start (get-pool-read token-id)))

(define-constant ERR_UNAUTHORIZED (err u16000))
(define-constant ERR_NO_COMMITMENT (err u16001))