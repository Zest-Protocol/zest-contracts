(use-trait ft .sip-010-trait.sip-010-trait)

(define-map pools uint {
    btc-token: principal,
    staking-token: principal,
    delegate-fee: uint,
    staker-fee: uint
})

(define-public (create-pool (btc-token <ft>) (staking-token <ft>) (delegate-fee uint) (staker-fee uint))
    (begin
        (map-insert pools u0
            {
                btc-token: (contract-of btc-token),
                staking-token: (contract-of staking-token),
                delegate-fee: delegate-fee,
                staker-fee: staker-fee })
        (ok true)
    )
)