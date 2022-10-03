(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait asset .asset-trait.asset-trait)
(use-trait oracle .oracle-trait.oracle-trait)
(use-trait reserves .reserves-trait.reserves-trait)
(use-trait loan-strat .loan-strategy-trait.loan-strategy-trait)

;; ALL BLOCK HEIGHTS ARE IN STX BLOCK HEIGHT

(define-constant ERR_UNAUTHORIZED u300)
(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant ERR_LOCKED_VAULT u500)
(define-constant ERR_INVALID_AMOUNT u600)
(define-constant ERR_NOT_ENOUGH_FUNDS u601)


(define-constant ERR_LOAN u590)

(define-data-var last-vault-id uint u0)

;; Vault states
(define-constant OPEN 0x01)
(define-constant LOCKED 0x02)
(define-constant FUNDED 0x03)
(define-constant REPAYMENT_SIGNALED 0x04)
(define-constant IN_AUCTION 0x05)

;; vaults should be state machines
;; 0x01 just created
;; 0x02 locked for funding
;; 0x03 funded
;; 0x04 fully repaid, should data be deleted ?

(define-map caller-contracts principal bool)

(define-private (is-approved-caller (caller principal))
    (default-to false (map-get? caller-contracts caller))
)

;; number of blocks that the funds will be locked for
(define-constant LOCK_LENGTH u40)

(define-map vaults
    uint
    {
        amount-asset: uint,
        owner: principal,
        collateral-type: principal,
        funded-amount: uint,
        maturity-date: uint,
        start-block: uint,
        lock-time: uint,
        locked: bool,
        loan-strategy: principal,
        status: (buff 1),
        lot-size: uint,
        n-lots: uint,
        lots-reserved: uint,
        lots-filled: uint,
        payment-period: uint,
        grace-duration: uint,
        liquidated-lots: uint,
        last-paid-treasury-block: uint
    }
)

;; (vault-id, lender) -> (lender-info)
(define-map
    lenders
    { vault-id: uint, lender-id: uint }
    {
        n-lots: uint,
        filled-lots: uint,
        repaid-lots: uint,
        last-paid-interest-lots: uint,
        last-paid-interest-time: uint
    }
)

(define-data-var lender-id uint u0)
;; Governance values
;; default value set to 0.1 BTC
(define-data-var lot-size uint u10000000)
;; 5 precision digits
(define-data-var treasury-fee uint u50000)


(define-read-only (get-vault-data (vault-id uint))
    (map-get? vaults vault-id)
)

(define-read-only (get-lender-data (vault-id uint) (current-lender-id uint))
    (map-get? lenders {vault-id: vault-id, lender-id: current-lender-id })
)

(define-read-only (get-lot-size)
    (var-get lot-size)
)

(define-public (add-lender (vault-id uint) (current-lender-id uint) (n-lots uint))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (> n-lots u0) (err ERR_INVALID_AMOUNT))
        
        (map-set lenders
            { vault-id: vault-id, lender-id: current-lender-id }
            {
                n-lots: n-lots,
                filled-lots: u0,
                repaid-lots: u0,
                last-paid-interest-lots: u0,
                last-paid-interest-time: u1 })
        (ok true)
    )
)

(define-public (register-lender)
    (let (
        (lender (var-get lender-id))
    )
        (var-set lender-id (+ u1 lender))
        (ok lender)
    )
)

(define-public (update-lot-size (new-lot-size uint))
    (begin
        ;; TODO: assert it comes from DAO contract
        (asserts! true (err ERR_UNAUTHORIZED))
        (ok (var-set lot-size new-lot-size))
    )
)

(define-public (liquidate (vault-id uint) (asset <asset>))
    (let (
        (vault (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        ;; assert that vault can be liquidated
        ;; late interest payment or maturity date passed

        (map-set vaults vault-id (merge vault { status: IN_AUCTION }))
        (ok true)
    )
)

(define-public (create-vault
    (amount uint)
    (asset <asset>)
    (loan-strat <loan-strat>)
    (n-lots uint)
    (scriptPubKey (buff 42))
    (maturity-date uint))
    (let (
        (vault-id (var-get last-vault-id))
        )
        ;; require guards for:
        ;; repeat vaults
        ;; minimum number of lots or btc amount

        (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))

        (map-set vaults
            vault-id
            {
                amount-asset: amount,
                owner: tx-sender,
                collateral-type: (contract-of asset),
                funded-amount: u0,
                maturity-date: maturity-date,
                start-block: u0,
                lock-time: u1,
                locked: false,
                loan-strategy: (contract-of loan-strat),
                status: OPEN,
                lot-size: (var-get lot-size),
                n-lots: n-lots,
                lots-reserved: u0,
                lots-filled: u0,
                payment-period: u4320, ;; (~30 days) to be determined in advance by pool delegate
                grace-duration: u576,
                liquidated-lots: u0,
                last-paid-treasury-block: u0
            }
        )
        (try! (contract-call? asset transfer amount tx-sender .reserves none))
        (var-set last-vault-id (+ vault-id u1))
        (ok vault-id)
    )
)

(define-public (lock-funds (vault-id uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (vault-state (get status vault-data))
        )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (or (is-eq vault-state OPEN)
                    (and
                        (is-eq LOCKED vault-state)
                        (> (- block-height (get lock-time vault-data)) LOCK_LENGTH))) (err ERR_LOCKED_VAULT))
        
        (map-set vaults vault-id (merge vault-data { locked: true, lock-time: block-height, status: LOCKED }))
        (ok true)
    )
)

;; can withdraw funds when the vault is unlocked
(define-public (close-vault (asset <asset>) (vault-id uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (vault-state (get status vault-data))
        )
        ;; add auth guards
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (or (is-eq vault-state OPEN)
                    (and
                        (is-eq LOCKED vault-state)
                        (> (- block-height (get lock-time vault-data)) LOCK_LENGTH)))  (err ERR_LOCKED_VAULT))
        
        (asserts! (is-eq (get collateral-type vault-data) (contract-of asset)) (err ERR_VAULT_NOT_FOUND))
        (asserts! (is-eq (get owner vault-data) tx-sender) (err ERR_UNAUTHORIZED))
        (try! (contract-call? .reserves withdraw asset (get amount-asset vault-data) tx-sender))
        (ok true)
    )
)

;; with a part of the collateral
(define-public (withdraw-collateral (asset <asset>) (vault-id uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (vault-state (get status vault-data))
        )
        ;; add maximum amount to remove before emptying the vault
        (asserts! (and (is-eq LOCKED vault-state)
                    (> (- block-height (get lock-time vault-data)) LOCK_LENGTH))  (err ERR_LOCKED_VAULT))
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        
        (try! (contract-call? .reserves withdraw asset (get amount-asset vault-data) tx-sender))
        (map-delete vaults vault-id)
        (ok true)
    )
)

;; add btc to amount paid
;; TODO: reduce map-get? calls
(define-public (buy-lots (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (lender-data (unwrap! (map-get? lenders { vault-id: vault-id, lender-id: current-lender-id }) (err ERR_VAULT_NOT_FOUND)))
        (new-lots (/ amount (get lot-size vault-data)))
        )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (if (<= (get n-lots lender-data) (+ new-lots (get filled-lots lender-data)))
            ;; reached lender's max lots
            (let (
                (trimmed-lots (- (get n-lots lender-data) (get filled-lots lender-data)))
            )
                (map-set
                    lenders
                    { vault-id: vault-id, lender-id: current-lender-id }
                    (merge lender-data { filled-lots: (get n-lots lender-data) }))
                (if (is-eq (get n-lots vault-data) (+ (get lots-filled vault-data) trimmed-lots))
                    (map-set
                        vaults
                        vault-id
                        (merge vault-data
                            { 
                                lots-filled: (+ (get lots-filled vault-data) trimmed-lots),
                                start-block: height,
                                status: FUNDED,
                                lots-reserved: u0 }))
                    (map-set
                        vaults
                        vault-id
                        (merge vault-data
                            {
                                lots-filled: (+ (get lots-filled vault-data) trimmed-lots),
                                lots-reserved: u0 }))
                )
            )
            (begin
                (map-set
                    vaults
                    vault-id
                    (merge vault-data {
                        lots-filled: (+ (get lots-filled vault-data) new-lots),
                        lots-reserved: (- (get lots-reserved vault-data) new-lots) }))
                (map-set
                    lenders { vault-id: vault-id, lender-id: current-lender-id }
                    (merge lender-data { filled-lots: (+ new-lots (get filled-lots lender-data)) } ))    
            )
        )
        (ok true)
    )
)

(define-public (reserve-lots (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        )
        (asserts! (>= (get n-lots vault-data) amount) (err ERR_INVALID_AMOUNT))
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        
        (if (<= (get n-lots vault-data) (+ amount (get lots-filled vault-data)))
            ;; reached lender's max lots
            (let (
                (trimmed-lots (- (get n-lots vault-data) (get lots-filled vault-data)))
            )
                (map-set
                    vaults
                    vault-id
                    (merge vault-data { lots-reserved: trimmed-lots, lock-time: height }))
            )
            (map-set
                vaults
                vault-id
                (merge vault-data { lots-reserved: amount, lock-time: height }))
        )

        (ok true)
    )
)

(define-public (pay-to-lender (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (lender-data (unwrap! (map-get? lenders { vault-id: vault-id, lender-id: current-lender-id }) (err ERR_VAULT_NOT_FOUND)))
        (n-periods (div-ceil (get payment-period vault-data) (- height (get start-block vault-data))))
        (block-delta (* n-periods (get payment-period vault-data)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts!
            (is-interest-payment height (get payment-period vault-data) (get start-block vault-data) (get grace-duration vault-data))
            (err ERR_UNAUTHORIZED))
        (pay-lot-interest amount vault-id current-lender-id height)
    )
)

(define-public (repay-lot (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (lender-data (unwrap! (map-get? lenders { vault-id: vault-id, lender-id: current-lender-id }) (err ERR_VAULT_NOT_FOUND)))
        (n-periods (div-ceil (get payment-period vault-data) (- height (get start-block vault-data))))
        (block-delta (* n-periods (get payment-period vault-data)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts!
            (not (is-interest-payment height (get payment-period vault-data) (get start-block vault-data) (get grace-duration vault-data)))
            (err ERR_UNAUTHORIZED))
        (repay-lots amount vault-id current-lender-id height)
    )
)

(define-read-only (is-interest-payment (height uint) (cycle-length uint) (start uint) (grace-period uint))
    (let (
        (cycle-block (get-loan-cycle-block height start cycle-length))
    )
        (and (>= height cycle-block) (<= height (+ cycle-block grace-period)))
    )
)

(define-read-only (get-loan-cycle-block (height uint) (start uint) (period uint))
    (+ start (* period (/ (- height start) period)))
)

(define-public (pay-to-treasury (amount uint) (vault-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (n-periods (div-ceil (get payment-period vault-data) (- height (get start-block vault-data))))
        (block-delta (* n-periods (get payment-period vault-data)))
        (loan-interest
            (unwrap!
                (get-loan-interest
                    (* (get lot-size vault-data) (get lots-filled vault-data))
                    (get payment-period vault-data)) (err ERR_LOAN)))
        (treasury-fees (/ (* (var-get treasury-fee) loan-interest) u1000000))
        (cycle-block (get-loan-cycle-block height (get start-block vault-data) (get payment-period vault-data)))
    )
        ;; if it's not enough, return
        (asserts! (>= amount treasury-fees) (ok true))
        (map-set vaults vault-id (merge vault-data { last-paid-treasury-block: cycle-block }))
        (ok true)
    )
)

;; TODO: reduce repeat code
(define-public (pay-lot-interest (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (lender-data (unwrap! (map-get? lenders { vault-id: vault-id, lender-id: current-lender-id }) (err ERR_VAULT_NOT_FOUND)))
        ;; get ceiling value of time-difference / payment-period
        (n-periods (div-ceil (get payment-period vault-data) (- height (get start-block vault-data))))
        (block-delta (* n-periods (get payment-period vault-data)))
        (loan-interest
            (unwrap!
                (get-loan-interest
                    (get lot-size vault-data)
                    (get payment-period vault-data)) (err ERR_LOAN)))
        (paid-lots-interest (/ amount loan-interest))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (>= amount loan-interest) (err ERR_NOT_ENOUGH_FUNDS))

        (if
            (and
                (not (is-eq (get-loan-cycle-block height (get start-block vault-data) (get payment-period vault-data)) (get last-paid-interest-time lender-data)))
                (>= (get last-paid-interest-lots lender-data) (get filled-lots lender-data)))
            (if (>= paid-lots-interest (get filled-lots lender-data))
                (map-set
                    lenders
                    { vault-id: vault-id, lender-id: current-lender-id }
                    (merge
                        lender-data
                        {
                            last-paid-interest-lots: (get filled-lots lender-data),
                            last-paid-interest-time: (get-loan-cycle-block height (get start-block vault-data) (get payment-period vault-data)) }))
                (map-set
                    lenders
                    { vault-id: vault-id, lender-id: current-lender-id }
                    (merge
                        lender-data
                        { last-paid-interest-lots: paid-lots-interest }))    
            )
            (if (>= (+ paid-lots-interest (get last-paid-interest-lots lender-data)) (get filled-lots lender-data))
                (map-set
                    lenders
                    { vault-id: vault-id, lender-id: current-lender-id }
                    (merge
                        lender-data
                        {
                            last-paid-interest-lots: (get filled-lots lender-data),
                            last-paid-interest-time: (get-loan-cycle-block height (get start-block vault-data) (get payment-period vault-data)) }))
                (map-set
                    lenders
                    { vault-id: vault-id, lender-id: current-lender-id }
                    (merge
                        lender-data
                        { last-paid-interest-lots: (+ paid-lots-interest (get last-paid-interest-lots lender-data)) }))    
            )
        )


        (ok true)
    )
)

(define-public (repay-lots (amount uint) (vault-id uint) (current-lender-id uint) (height uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (lender-data (unwrap! (map-get? lenders { vault-id: vault-id, lender-id: current-lender-id }) (err ERR_VAULT_NOT_FOUND)))
        (repaid-lots (/ amount (get lot-size vault-data)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (>= amount repaid-lots) (err ERR_NOT_ENOUGH_FUNDS))

        (if (>= repaid-lots (get filled-lots lender-data))
            (map-set
                lenders
                { vault-id : vault-id, lender-id: current-lender-id }
                (merge lender-data { filled-lots: u0 }))
            (map-set
                lenders
                { vault-id : vault-id, lender-id: current-lender-id }
                (merge lender-data { filled-lots: (- (get filled-lots lender-data) repaid-lots) }))
        )

        (ok true)
    )
)

(define-public (set-lender-data
    (vault-id uint)
    (prev-lender-id uint)
    (data { n-lots: uint, filled-lots: uint, repaid-lots: uint, last-paid-interest-lots: uint, last-paid-interest-time: uint }))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (map-set lenders { vault-id : vault-id, lender-id: prev-lender-id } data)
        (ok true)
    )
)


(define-public (set-vault-data
    (vault-id uint)
    (data { amount-asset: uint,
        owner: principal,
        collateral-type: principal,
        funded-amount: uint,
        maturity-date: uint,
        start-block: uint,
        lock-time: uint,
        locked: bool,
        loan-strategy: principal,
        status: (buff 1),
        lot-size: uint,
        n-lots: uint,
        lots-reserved: uint,
        lots-filled: uint,
        payment-period: uint,
        grace-duration: uint,
        liquidated-lots: uint,
        last-paid-treasury-block: uint }))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (map-set vaults vault-id data)
        (ok true)
    )
)

(define-public (set-vault-state
    (vault-id uint)
    (state (buff 1)))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (map-set vaults vault-id (merge vault-data { status: state }))
        (ok true)
    )
)

(define-public (get-loan-interest (amount uint) (delta uint))
    (contract-call? .loan-fixed-return get-yield amount delta)
)

;; originally for when borrower would signal a repayment to lenders
;; to be deleted
(define-public (signal-repayment (vault-id uint))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (vault-state (get status vault-data))
    )

        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        ;; if repayment_signaled but after grace period then pass
        (asserts! (is-eq vault-state FUNDED) (err ERR_LOCKED_VAULT))
        (map-set vaults vault-id (merge vault-data { lock-time: block-height, status: REPAYMENT_SIGNALED }))
        (ok true)
    )
)

(define-public (get-collateral-debt-ratio (vault-id uint) (collateral <asset>) (asset <asset>) (oracle <oracle>))
    (let (
        (vault-data (unwrap! (map-get? vaults vault-id) (err ERR_VAULT_NOT_FOUND)))
        (collateral-data (try! (contract-call? oracle get-asset (contract-of collateral))))
        (asset-data (try! (contract-call? oracle get-asset (contract-of asset))))
    )
        (asserts! (is-eq (contract-of collateral) (get collateral-type vault-data)) (err ERR_UNAUTHORIZED))
        (ok
            (/ 
                (/  (* (get amount-asset vault-data) (get price collateral-data))
                    ;; TODO: Replace btc-amount logic with lots instead
                    ;; (/ (* (get btc-amount vault-data) (get price asset-data)) u100000000)
                    u1
                )
                u10000)

        )
    )
)

(define-read-only (div-ceil (num uint) (den uint))
    (/ (- (+ den num) u1) den)
)

(map-set caller-contracts .tx-verification true)
(map-set caller-contracts .vault true)
(map-set caller-contracts .native true)
