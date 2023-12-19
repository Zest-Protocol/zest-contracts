(use-trait lv 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(use-trait rewards-calc 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.rewards-calc-trait.rewards-calc-trait)

(use-trait payment 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.payment-trait.payment-trait)

;; (use-trait cp-token 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait swap 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.swap-router-trait.swap-router-trait)

(define-constant deployer tx-sender)
;; (define-constant owner owner-address)
(define-constant token-id u0)
(define-constant factor u1)

(define-public (send-funds
  (lp <ft-mint-trait>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (r-c <rewards-calc>))
  (let (
    (sats (unwrap! (contract-call? xbtc-ft get-balance (as-contract tx-sender)) ERR_UNABLE_TO_GET_BALANCE))
  )
    (as-contract (try! (contract-call? xbtc-ft transfer sats tx-sender .supplier-interface none)))
    (as-contract (try! (contract-call? .supplier-interface send-funds-xbtc factor lp token-id l-v xbtc-ft sats r-c)))
    (ok sats)
  )
)

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_UNABLE_TO_GET_BALANCE (err u1001))
