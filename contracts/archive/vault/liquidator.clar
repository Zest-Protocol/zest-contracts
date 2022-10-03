(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait asset .asset-trait.asset-trait)
(use-trait loan-strat .loan-strategy-trait.loan-strategy-trait)
(use-trait oracle .oracle-trait.oracle-trait)

(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant ERR_UNAUTHORIZED u300)


(define-public (liquidate (vault-id uint) (asset <asset>))
    (let (
        (vault-data (unwrap! (contract-call? .vault-accounting get-vault-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (try! (contract-call? .vault-auction start-auction vault-id asset))
        (ok true)
    )
)