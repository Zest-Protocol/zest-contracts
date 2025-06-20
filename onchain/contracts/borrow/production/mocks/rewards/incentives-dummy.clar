(use-trait ft .ft-trait.ft-trait)
(impl-trait .incentives-trait-v2-0.incentives-trait)

;; can only claim 1 type of reward
(define-public (claim-rewards
    (lp-supplied-asset <ft>)
    (supplied-asset <ft>)
    (who principal)
)
    (begin
        (asserts! true (err u123456789))
        (ok u0)
    )
)

(define-public (claim-rewards-to-vault
    (lp-supplied-asset <ft>)
    (supplied-asset <ft>)
    (who principal)
)
    (begin
        (asserts! true (err u123456789))
        (ok u0)
    )
)
