(use-trait lp-token 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.lp-token-trait.lp-token-trait)
(use-trait lv 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-trait.liquidity-vault-trait)
(use-trait ft 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ft-trait.ft-trait)
(use-trait sip-010 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait.sip-010-trait)
(use-trait rewards-calc 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.rewards-calc-trait.rewards-calc-trait)
(use-trait sc 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-controller-trait.supplier-controller-trait)

(use-trait payment 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.payment-trait.payment-trait)

(use-trait cp-token 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.distribution-token-trait.distribution-token-trait)
(use-trait dtc 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait swap 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.swap-router-trait.swap-router-trait)

(define-constant DEPLOYER tx-sender)

(define-public (send-funds-to-pool
  (txid (buff 32))
  (sats uint)
  (lp <lp-token>)
  (zp <dtc>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (r-c <rewards-calc>)
  (s-c <sc>)
  )
  (begin
    ;; TODO: add auth
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-to-pool txid lp zp l-v xbtc-ft r-c)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))) (asset <ft>))
  (begin
    (asserts! (is-eq tx-sender DEPLOYER) ERR_UNAUTHORIZED)
    (as-contract (contract-call? asset transfer amount sender recipient memo))
  )
)

(define-read-only (get-swapper-id)
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol get-swapper-id (as-contract tx-sender)))

(define-constant ERR_UNAUTHORIZED (err u1000))

(as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol initialize-swapper))