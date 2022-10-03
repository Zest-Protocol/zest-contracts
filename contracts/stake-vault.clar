;; TEMPORARY PLACEHOLDER OF THE SWAPPED xBTC
(use-trait ft .sip-010-trait.sip-010-trait)

(define-public (draw (coll-type <ft>))
    (let (
        (sender (as-contract tx-sender))
        (recipient contract-caller)
        (funds (unwrap-panic (contract-call? coll-type get-balance sender)))
    )
        (as-contract (contract-call? coll-type transfer funds sender recipient none))
    )
)