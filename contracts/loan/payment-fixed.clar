(impl-trait .payment-trait.payment-trait)
(impl-trait .ownable-trait.ownable-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant BLOCKS_PER_YEAR u52560)
(define-constant PRECISION (pow u10 u9))
(define-constant DEN u10000)

;; --- ownable trait

(define-data-var contract-owner principal tx-sender)
(define-data-var late-fee uint u10) ;; late fee in Basis Points
(define-data-var early-repayment-fee uint u10) ;; late fee in Basis Points

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)



(define-public (set-late-fee (fee uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set late-fee fee))
  )
)

(define-public (set-early-repayment-fee (fee uint))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set early-repayment-fee fee))
  )
)

;; @desc expects the funds to be sent into this contract
(define-public (make-next-payment (lp-token <lp-token>) (sp-token <lp-token>) (height uint) (loan-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool lp-contract)))
    (delegate (get pool-delegate pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; amount * delta * (APR / blocks_per_year)
    (payment (get-payment amount (get payment-period loan) apr height (get next-payment loan)))
    (staker-portion (get-prc payment (get staking-fee pool)))
    (delegate-portion (get-prc payment (get delegate-fee pool)))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_VALUES)
    (try! (distribute-xbtc .treasury lp-token (- payment staker-portion delegate-portion) .staking-pool staker-portion delegate-portion))
    (try! (distribute-zest lp-token sp-token (- payment staker-portion delegate-portion) .staking-pool staker-portion delegate delegate-portion))
    (if (is-eq u1 (get remaining-payments loan))
      (begin
        (try! (as-contract (contract-call? .xbtc transfer amount tx-sender (get liquidity-vault pool) none)))
        (ok { reward: payment, repayment: true })
      )
        (ok { reward: payment, repayment: false })
    )
  )
)

;; @desc expects the funds to be sent into this contract. make interest payment and full payment
(define-public (make-full-payment (lp-token <lp-token>) (sp-token <lp-token>) (height uint) (loan-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (contract-call? .pool-v1-0 get-pool lp-contract)))
    (delegate (get pool-delegate pool))
    (apr (get apr loan))
    (amount (get loan-amount loan))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; amount * delta * (APR / blocks_per_year)
    (payment (get-payment amount (get payment-period loan) apr height (get next-payment loan)))
    (early-payment (+ payment (get-prc payment (var-get early-repayment-fee))))
    (staker-portion (get-prc early-payment (get staking-fee pool)))
    (delegate-portion (get-prc early-payment (get delegate-fee pool)))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (is-eq (as-contract tx-sender) (get payment pool)) ERR_INVALID_VALUES)
    (try! (distribute-xbtc .treasury lp-token (- early-payment staker-portion delegate-portion) .staking-pool staker-portion delegate-portion))
    (try! (distribute-zest lp-token sp-token (- early-payment staker-portion delegate-portion) .staking-pool staker-portion delegate delegate-portion))
    
    (try! (as-contract (contract-call? .xbtc transfer amount tx-sender (get liquidity-vault pool) none)))

    (ok { reward: early-payment, full-payment: amount })
  )
)

(define-read-only (get-prc (amount uint) (bp uint))
  (/ (* bp amount) DEN)
)

(define-read-only (get-payment (amount uint) (payment-period uint) (apr uint) (height uint) (next-payment uint))
  (let (
    (payment (/ (/ (* amount payment-period apr PRECISION) BLOCKS_PER_YEAR) PRECISION DEN))
  )
    (if (> height next-payment)
      (+ payment (/ (* payment (var-get late-fee)) DEN))
      payment
    )
  )
)

(define-private (distribute-xbtc
  (treasury principal)
  (lp-token <lp-token>)
  (lp-portion uint)
  (staking-pool principal)
  (staker-portion uint)
  (delegate-portion uint)
  )
  (begin
    (try! (as-contract (contract-call? .xbtc transfer (+ delegate-portion staker-portion) tx-sender treasury none)))
    (try! (as-contract (contract-call? .xbtc transfer lp-portion tx-sender (contract-of lp-token) none)))
    (try! (contract-call? lp-token deposit-rewards (to-int lp-portion)))
    (ok true)
  )
)

(define-private (distribute-zest
  (lp-token <lp-token>)
  (sp-token <lp-token>)
  (lp-portion uint)
  (staking-pool principal)
  (staker-portion uint)
  (delegate principal)
  (delegate-portion uint)
  )
  (begin
    (try! (contract-call? .zge000-governance-token edg-mint-many
      (list 
        { amount: lp-portion, recipient: .zest-reward-dist }
        { amount: staker-portion, recipient: (contract-of sp-token) }
        { amount: delegate-portion, recipient: delegate }
      )))
    (try! (contract-call? .zest-reward-dist deposit-rewards (to-int lp-portion)))
    (try! (contract-call? sp-token deposit-rewards (to-int lp-portion)))
    (ok true)
  )
)

;; --- approved

(define-map approved-contracts principal bool)

(define-public (add-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public (remove-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract false))
	)
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_INVALID_VALUES (err u6001))