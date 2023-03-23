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

(define-public (commit-funds
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (sender (buff 33))
  (recipient (buff 33))
  (expiration-buff (buff 4))
  (hash (buff 32))
  (swapper-buff (buff 4))
  (supplier-id uint)
  (min-to-receive uint)
  (token-id uint)
  (loan-id uint)
  )
  (begin
    (asserts! (is-eq DEPLOYER tx-sender) ERR_UNAUTHORIZED)
    (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds block prev-blocks tx proof output-index sender recipient expiration-buff hash swapper-buff supplier-id min-to-receive token-id loan-id))
  )
)

(define-public (send-funds-to-pool
  (txid (buff 32))
  (preimage (buff 128))
  (lp-token <sip-010>)
  (lv <lv>)
  (xbtc-ft <ft>)
  (rewards-calc <rewards-calc>)
  (sc <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage sc))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-to-pool txid lp-token lv xbtc-ft rewards-calc)
  )
)

(define-public (make-payment-loan
  (txid (buff 32))
  (preimage (buff 128))
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (sc <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage sc))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-payment txid payment lp-token lv cp-token cp-rewards-token zp-token swap-router xbtc-ft)
  )
)

(define-read-only (get-swapper-id)
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol get-swapper-id (as-contract tx-sender)))


(define-constant ERR_UNAUTHORIZED (err u1000))

(as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol initialize-swapper))