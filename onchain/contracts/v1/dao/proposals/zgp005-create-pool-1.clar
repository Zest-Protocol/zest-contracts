(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    (try! (contract-call?
      .pool-v1-0
      create-pool
      'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ
      .lp-token
      .zest-reward-dist
      .payment-fixed
      .rewards-calc
      u1000
      u1000
      u10000000000
      u10000000000
      u1
      (* u144 u365 u3)
      .liquidity-vault-v1-0
      .cp-token
      .cover-vault
      .cp-rewards-token
      .Wrapped-Bitcoin
      true
    ))
    (ok true)
  )
)
