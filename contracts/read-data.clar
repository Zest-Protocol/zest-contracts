(impl-trait .ownable-trait.ownable-trait)

(define-map pool-balance uint uint)

(define-read-only (get-pool-balance (token-id uint))
  (default-to u0 (map-get? pool-balance token-id))
)

(define-public (add-pool-cash (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set pool-balance token-id (+ (get-pool-balance token-id) amount)))
  )
)

(define-public (remove-pool-cash (token-id uint) (amount uint))
  (let (
    (cash (get-pool-balance token-id))
  )
    (try! (is-approved-contract contract-caller))
    (ok (if (> amount cash)
      (map-set pool-balance token-id u0)
      (map-set pool-balance token-id (- cash amount))))
  )
)


(define-map cover-pool-balance uint uint)

(define-read-only (get-cover-pool-balance (token-id uint))
  (default-to u0 (map-get? cover-pool-balance token-id))
)

(define-public (add-cover-pool-balance (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set cover-pool-balance token-id (+ (get-cover-pool-balance token-id) amount)))
  )
)

(define-public (remove-cover-pool-balance (token-id uint) (amount uint))
  (let (
    (cash (get-cover-pool-balance token-id))
  )
    (try! (is-approved-contract contract-caller))
    (ok (if (> amount cash)
      (map-set cover-pool-balance token-id u0)
      (map-set cover-pool-balance token-id (- cash amount))))
  )
)

(define-map active-loan-amount uint uint)

(define-read-only (get-active-loan-amount (token-id uint))
  (default-to u0 (map-get? active-loan-amount token-id))
)

(define-public (add-active-loan-amount (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set active-loan-amount token-id (+ (get-active-loan-amount token-id) amount)))
  )
)

(define-public (remove-active-loan-amount (token-id uint) (amount uint))
  (let (
    (cash (get-active-loan-amount token-id))
  )
    (try! (is-approved-contract contract-caller))
    (ok (if (> amount cash)
      (map-set active-loan-amount token-id u0)
      (map-set active-loan-amount token-id (- cash amount))))
  )
)

;; Total xBTC rewards earned
(define-map pool-btc-rewards-earned uint uint)
(define-map cover-pool-btc-rewards-earned uint uint)

(define-read-only (get-pool-btc-rewards-earned (token-id uint))
  (default-to u0 (map-get? pool-btc-rewards-earned token-id))
)

(define-public (add-pool-btc-rewards-earned (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set pool-btc-rewards-earned token-id (+ amount (get-pool-btc-rewards-earned token-id))))
  )
)

(define-read-only (get-cover-pool-btc-rewards-earned (token-id uint))
  (default-to u0 (map-get? cover-pool-btc-rewards-earned token-id))
)

(define-public (add-cover-pool-btc-rewards-earned (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set cover-pool-btc-rewards-earned token-id (+ amount (get-cover-pool-btc-rewards-earned token-id))))
  )
)

(define-data-var active-loans uint u0)

(define-read-only (get-active-loans)
  (var-get active-loans)
)

(define-public (active-loans-plus)
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set active-loans (+ u1 (var-get active-loans))))
  )
)

(define-public (active-loans-minus)
  (let (
    (active-l (var-get active-loans))
  )
    (try! (is-approved-contract contract-caller))
    (ok (if
      (is-eq u0 active-l)
      true
      (var-set active-loans (- active-l u1))))
  )
)


(define-map delegate-btc-rewards-earned principal uint)

(define-read-only (get-delegate-btc-rewards-earned (delegate principal))
  (default-to u0 (map-get? delegate-btc-rewards-earned delegate))
)

(define-public (add-delegate-btc-rewards-earned (delegate principal) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set delegate-btc-rewards-earned delegate (+ amount (get-delegate-btc-rewards-earned delegate))))
  )
)

;; -- Zest rewards earned
(define-map pool-zest-rewards-earned uint uint)
(define-map cover-pool-zest-rewards-earned uint uint)

(define-read-only (get-pool-zest-rewards-earned (token-id uint))
  (default-to u0 (map-get? pool-zest-rewards-earned token-id))
)

(define-public (add-pool-zest-rewards-earned (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set pool-zest-rewards-earned token-id (+ amount (get-pool-zest-rewards-earned token-id))))
  )
)

(define-read-only (get-cover-pool-zest-rewards-earned (token-id uint))
  (default-to u0 (map-get? cover-pool-zest-rewards-earned token-id))
)

(define-public (add-cover-pool-zest-rewards-earned (token-id uint) (amount uint))
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (map-set cover-pool-zest-rewards-earned token-id (+ amount (get-cover-pool-zest-rewards-earned token-id))))
  )
)

(define-data-var loans-funded uint u0)

(define-public (loans-funded-plus)
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set loans-funded (+ u1 (var-get loans-funded))))
  )
)

(define-public (loans-funded-minus)
  (begin
    (try! (is-approved-contract contract-caller))
    (ok (var-set loans-funded (- (var-get loans-funded) u1)))
  )
)

(define-read-only (get-loans-funded)
  (var-get loans-funded)
)

(define-read-only (get-claimable-rewards (token-id uint) (sender principal))
  (contract-call? .lp-token withdrawable-funds-of token-id sender)
)

(define-data-var contract-owner principal tx-sender)

;; -- ownable-trait --
(define-public (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

;; --- approved contracts

(define-map approved-contracts principal bool)

(define-public (add-contract (contract principal))
  (begin
		(asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public (remove-contract (contract principal))
  (begin
		(asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract false))
	)
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)


;; ERROR START 18000
(define-constant ERR_UNAUTHORIZED (err u18000))

(map-set approved-contracts .lp-token true)
(map-set approved-contracts .loan-v1-0 true)
(map-set approved-contracts .pool-v1-0 true)
(map-set approved-contracts .cover-pool-v1-0 true)
(map-set approved-contracts .payment-fixed true)