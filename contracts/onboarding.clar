(impl-trait .ownable-trait.ownable-trait)


(define-map onboarded principal bool)

(define-read-only (is-onboarded (user principal))
  (default-to false (map-get? onboarded user))
)

(define-public (is-onboarded-user (user principal))
  (ok (default-to false (map-get? onboarded user)))
)

(define-public (onboard-user (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set onboarded user true))
  )
)

(define-public (offboard-user (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set onboarded user false))
  )
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


(define-constant ERR_UNAUTHORIZED (err u1000))
