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
  (factor uint)
  (action (buff 1))
  )
  (begin
    (asserts! (is-eq DEPLOYER tx-sender) ERR_UNAUTHORIZED)
    (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds block prev-blocks tx proof output-index sender recipient expiration-buff hash swapper-buff supplier-id min-to-receive token-id loan-id factor action DEPLOYER))
  )
)

(define-public (send-funds-to-pool
  (txid (buff 32))
  (preimage (buff 128))
  (lp <lp-token>)
  (zp <dtc>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (r-c <rewards-calc>)
  (s-c <sc>)
  )
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage s-c))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-to-pool txid lp zp l-v xbtc-ft r-c)
  )
)

(define-public (send-funds-to-pool-completed
  (txid (buff 32))
  (lp <lp-token>)
  (zp <dtc>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (r-c <rewards-calc>)
  (s-c <sc>))
  (let (
    (swap-ret (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-controller-0 finalize-swap-completed txid)))
    (sats (get sats swap-ret))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize-completed txid lp zp l-v xbtc-ft r-c s-c))
  )
)

(define-public (make-payment-loan
  (txid (buff 32))
  (preimage (buff 128))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage s-c))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-payment txid pay lp l-v cp cp-rt zp swap-router xbtc-ft)
  )
)

(define-public (make-payment-loan-completed
  (txid (buff 32))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (swap-ret (try! (contract-call? s-c finalize-swap-completed txid)))
    (sats (get sats swap-ret))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-payment-completed txid pay lp l-v cp cp-rt zp swap-router xbtc-ft s-c))
  )
)

(define-public (make-full-payment
  (txid (buff 32))
  (preimage (buff 128))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage s-c))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-full-payment txid pay lp l-v cp cp-rt zp swap-router xbtc-ft)
  )
)

(define-public (make-full-payment-completed
  (txid (buff 32))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (swap-ret (try! (contract-call? s-c finalize-swap-completed txid)))
    (sats (get sats swap-ret))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-full-payment-completed txid pay lp l-v cp cp-rt zp swap-router xbtc-ft)
  )
)

(define-public (make-payment-verify
  (txid (buff 32))
  (preimage (buff 128))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage s-c))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-payment-verify txid pay lp l-v cp cp-rt zp swap-router xbtc-ft)
  )
)

(define-public (make-payment-verify-completed
  (txid (buff 32))
  (pay <payment>)
  (lp <lp-token>)
  (l-v <lv>)
  (cp <cp-token>)
  (cp-rt <dt>)
  (zp <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (swap-ret (try! (contract-call? s-c finalize-swap-completed txid)))
    (sats (get sats swap-ret))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-payment-verify-completed txid pay lp l-v cp cp-rt zp swap-router xbtc-ft)
  )
)

(define-public (make-residual-payment
  (txid (buff 32))
  (preimage (buff 128))
  (lp <lp-token>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (sats (as-contract (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface send-funds-finalize txid preimage s-c))))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-residual-payment txid lp l-v xbtc-ft)
  )
)

(define-public (make-residual-payment-completed
  (txid (buff 32))
  (lp <lp-token>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (s-c <sc>))
  (let (
    (swap-ret (try! (contract-call? s-c finalize-swap-completed txid)))
    (sats (get sats swap-ret))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface none)))
    (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.supplier-interface make-residual-payment-completed txid lp l-v xbtc-ft)
  )
)

(define-read-only (get-swapper-id)
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol get-swapper-id (as-contract tx-sender)))

(define-constant ERR_UNAUTHORIZED (err u1000))

(as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol initialize-swapper))