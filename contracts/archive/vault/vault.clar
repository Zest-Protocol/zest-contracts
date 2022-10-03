(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait asset .asset-trait.asset-trait)
(use-trait oracle .oracle-trait.oracle-trait)
(use-trait reserves .reserves-trait.reserves-trait)
(use-trait loan-strat .loan-strategy-trait.loan-strategy-trait)

(define-constant ERR_CONVERSION u500)
(define-constant ERR_VERIFICATION u501)
(define-constant ERR_TX_NOT_MINED u502)

(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant INVALID_OUT_IDX u401)

(define-constant ERR-OUT-OF-BOUNDS u300)

;; output markers
(define-constant SPEND_OUT 0x00)
(define-constant CHANGE_OUT 0x01)
(define-constant DATA_OUT 0x02)

;; scriptPubKey is the btc address where the funds will be sent
;; scriptPubKeys are valid scripts that consist of a 1-byte push opcode
;; and a data push between 2 and 40 bytes
;; This covers P2PKH, P2SH, P2WPKH, P2WSH, P2TR

;; expected BTC loan amount is the one at time of the execution of the transaction
;; scriptPubKey
(define-public (create-vault (amount uint) (asset <asset>) (loan-strat <loan-strat>) (n-lots uint) (scriptPubKey (buff 42)) (maturity-date uint))
    (let (
            ;; (asset-usda-value (unwrap! (get-asset-usda-value amount asset) (err ERR_CONVERSION)))
            ;; (btc-usda-value (unwrap! (get-asset-usda-value btc-amount .btc) (err ERR_CONVERSION)))
            (vault-id (try! (contract-call? .vault-accounting create-vault amount asset loan-strat n-lots scriptPubKey maturity-date)))
        )
        ;; use the dynamic payment-processor trait
        ;; (print { vault: vault-id, asset-value: asset-usda-value, btc-value: btc-usda-value, scriptPubKey: scriptPubKey })
        (contract-call? .native map-vault vault-id scriptPubKey tx-sender)
    )
)

(define-public (close-vault (asset <asset>) (vault-id uint))
    (begin
        (try! (contract-call? .vault-accounting close-vault asset vault-id))
        (print { vault: vault-id })
        (contract-call? .native remove-vault vault-id tx-sender)
    )
)

(define-public (get-asset-usda-value (amount uint) (asset <asset>))
    (let (
        (asset-data (try! (contract-call? .oracle get-asset (contract-of asset))))
    )
        (ok (/ (* (get price asset-data)
                    amount)
                    (get decimals asset-data)))
    )
)

;; simple conversion but needs to consider when decimal position varies
;; on the value of the asset
(define-public (get-borrowing-asset-value (collateral <asset>) (amount uint) (asset <asset>))
    (let (
        ;; fixed to temporary oracle
        (collateral-data (try! (contract-call? .oracle get-asset (contract-of collateral))))
        (asset-data (try! (contract-call? .oracle get-asset (contract-of asset))))
        )
        (ok
            (/ (* amount
                (get price collateral-data))
                (get price asset-data)))
    )
)

;; Signal an incoming payment so that interest stops being accrued on the loan
(define-public (signal-payment (vault-id uint))
    (begin
        (print { payment-signaled-to: vault-id })
        (contract-call? .vault-accounting signal-repayment vault-id)
    )
)
