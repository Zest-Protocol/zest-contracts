(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    (try! (contract-call?
      .pool-v2-0
      create-pool
      'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ
      (list .Wrapped-Bitcoin)
      .pool-v2-0
      .lp-token-0
      .payment-fixed
      .rewards-calc
      .withdrawal-manager
      u1000
      u1000
      u10000000000
      u10000000000
      u1
      (* u144 u365 u3)
      .liquidity-vault-v1-0
      .cp-token
      .cover-vault
      .Wrapped-Bitcoin
      true
      0x00
    ))
    (ok true)
  )
)