
(define-public (claim)
    (let (
        (before (unwrap-panic (contract-call? .xbtc get-balance (as-contract tx-sender))))
        (temp (try! (contract-call? .loan withdraw-funds)))
        (claimable-funds (- (unwrap-panic (contract-call? .xbtc get-balance (as-contract tx-sender))) before))
    )
        (try! (as-contract (contract-call? .xbtc transfer claimable-funds tx-sender .pool none)))
        (ok claimable-funds)
    )
)
