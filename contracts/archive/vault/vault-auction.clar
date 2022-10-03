(use-trait asset .asset-trait.asset-trait)

(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant ERR_LENDER_NOT_FOUND u400)
(define-constant ERR_LENDER_ALREADY_EXISTS u400)

;; Vault states
(define-constant IN_AUCTION 0x05)

(define-map auctioned-vaults uint
    {
        reserved-lots: uint,
        reserved-lender-id: uint,
        bought-lots: uint
    }
)

(define-public (start-auction (vault-id uint) (asset <asset>))
    (begin
        (try! (contract-call? .vault-accounting liquidate vault-id asset))
        (map-insert
            auctioned-vaults
            vault-id
            {
                reserved-lots: u0,
                reserved-lender-id: u18446744073709551615,
                bought-lots: u0 })
        (ok true)
    )
)

;; new lender is created
(define-public (reserve-auction-lots (amount uint) (vault-id uint) (prev-lender-id uint) (lender-id uint) (height uint))
    (let (
        (vault (unwrap! (contract-call? .vault-accounting get-vault-data vault-id) (err ERR_VAULT_NOT_FOUND)))
        (prev-lender (unwrap! (contract-call? .vault-accounting get-lender-data vault-id prev-lender-id) (err ERR_LENDER_NOT_FOUND)))
    )
        (asserts! (is-some (map-get? auctioned-vaults vault-id)) (err ERR_VAULT_NOT_FOUND))
        (asserts! (is-none (contract-call? .vault-accounting get-lender-data vault-id lender-id)) (err ERR_LENDER_ALREADY_EXISTS))

        ;; TODO: if we already have an auctioned lot that is reserved

        (try! (contract-call? .vault-accounting add-lender vault-id lender-id amount))
        (try! (contract-call? .vault-accounting reserve-lots amount vault-id lender-id height))

        (if (>= amount (get filled-lots prev-lender))
            (begin
                (map-set
                    auctioned-vaults
                    vault-id 
                    {
                        reserved-lots: (get filled-lots prev-lender),
                        reserved-lender-id: prev-lender-id,
                        bought-lots: u0 })
            )
            (begin
                (map-set
                    auctioned-vaults
                    vault-id 
                    {
                        reserved-lots: amount,
                        reserved-lender-id: prev-lender-id,
                        bought-lots: u0 })
            )
        )

        (ok true)
    )
)

;; assumes lender was already added before in the payment processor
(define-public (buy-auction-lots (amount uint) (vault-id uint) (lender-id uint) (height uint))
    (let (
        (vault (unwrap! (contract-call? .vault-accounting get-vault-data vault-id) (err ERR_VAULT_NOT_FOUND)))
        (auctioned-vault (unwrap! (map-get? auctioned-vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (prev-lender (unwrap! (contract-call? .vault-accounting get-lender-data vault-id (get reserved-lender-id auctioned-vault)) (err ERR_VAULT_NOT_FOUND)))
        (curr-lender (unwrap! (contract-call? .vault-accounting get-lender-data vault-id lender-id) (err ERR_VAULT_NOT_FOUND)))
        ;; reduce lot-size cost in accordance with the discount
        (bought-lots (/ amount (get lot-size vault)))

    )
        (if (<= (get n-lots prev-lender) (+ bought-lots (get bought-lots auctioned-vault)))
            (let (
                (trimmed-lots (- (get reserved-lots auctioned-vault) (get bought-lots auctioned-vault)))
            )
                (map-set auctioned-vaults vault-id (merge auctioned-vault { bought-lots: (get n-lots prev-lender) }))
                ;; update previous lender
                (try! (contract-call?
                    .vault-accounting
                    set-lender-data
                    vault-id
                    (get reserved-lender-id auctioned-vault)
                    (merge
                        prev-lender
                        {
                            filled-lots: u0,
                            n-lots: u0 })))
                ;; update current lender
                (try! (contract-call?
                    .vault-accounting
                    set-lender-data
                    vault-id
                    lender-id
                    (merge curr-lender { filled-lots: (get n-lots prev-lender) })))

                (try! (contract-call?
                    .vault-accounting
                    set-vault-data
                    vault-id
                    (merge vault { liquidated-lots: (+ trimmed-lots (get liquidated-lots vault)) })))
            )
            (begin
                (map-set auctioned-vaults vault-id (merge auctioned-vault { bought-lots: (+ (get bought-lots auctioned-vault) bought-lots) }))
                ;; update previous lender
                (try! (contract-call?
                    .vault-accounting
                    set-lender-data
                    vault-id
                    (get reserved-lender-id auctioned-vault)
                    (merge
                        prev-lender
                        {
                            filled-lots: (- (get filled-lots prev-lender) bought-lots),
                            n-lots: (- (get filled-lots prev-lender) bought-lots) })))
                ;; update current lender
                (try! (contract-call?
                    .vault-accounting
                    set-lender-data
                    vault-id
                    lender-id
                    (merge curr-lender { filled-lots: (+ bought-lots (get filled-lots curr-lender)) })))

                (try! (contract-call?
                    .vault-accounting
                    set-vault-data
                    vault-id
                    (merge vault { liquidated-lots: (+ bought-lots (get liquidated-lots vault)) })))
            )
        )
        (ok true)
    )
)

;; PERMISSIONS MAP
(define-map caller-contracts principal bool)

(define-private (is-approved-caller (caller principal))
    (default-to false (map-get? caller-contracts caller))
)

(map-set caller-contracts .vault-accounting true)
(map-set caller-contracts .liquidator true)
