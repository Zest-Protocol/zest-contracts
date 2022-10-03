(impl-trait .payment-processor-trait.payment-processor-trait)


(define-constant ERR_UNAUTHORIZED u300)
(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant ERR_LENDER_NOT_FOUND u401)
(define-constant ERR_VAULT_EXISTS u403)
(define-constant ERR_AMOUNT_TOO_LOW u404)
(define-constant ERR_REFUSED u405)

(define-map caller-contracts principal bool)

(define-private (is-approved-caller (caller principal))
    (default-to false (map-get? caller-contracts caller))
)

(define-map lenders-spk { vault-id: uint, lender-id: uint } (buff 42))
(define-map spk-lender (buff 42) { vault-id: uint, lender-id: uint })
;; the scriptsig is a multisig and it might be necessary if P2TR is not used
(define-map treasury-multisig (buff 42) bool)

(define-map vault-dest
    uint
    {
        dest: (buff 1024),
        owner: principal,
        start-block: uint,
        lender-id: uint,
        reserved-lots: uint,
        last-verified-height: uint
    })


(define-read-only (get-spk (lender { vault-id: uint, lender-id: uint }))
    (unwrap-panic (map-get? lenders-spk lender))
)

(define-public (map-vault (vault-id uint) (dest (buff 1024)) (owner principal))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (is-none (map-get? vault-dest vault-id)) (err ERR_VAULT_EXISTS))
        (map-set vault-dest vault-id
            {
                dest: dest,
                owner: owner,
                start-block: u0,
                lender-id: u0,
                reserved-lots: u0,
                last-verified-height: u18446744073709551615, ;; arbitrarily large number
            })
        (ok u1)
    )
)

(define-public (remove-vault (vault-id uint) (owner principal))
    (let (
        (vault (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (asserts! (or
            (is-approved-caller contract-caller)
            (is-eq (get owner vault) owner)) (err ERR_UNAUTHORIZED))

        (map-delete vault-dest vault-id)
        (ok vault-id)
    )
)

(define-public (reserve-lots (amount uint) (vault-id uint) (lender-id uint) (height uint))
    (let (
        (data (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND)))
        )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (unwrap-panic (contract-call? .vault-accounting add-lender vault-id lender-id amount))
        ;; TODO: set block-height to the first reserved tx

        (if (is-eq height (get last-verified-height data))
            (begin
                (asserts! (> amount (get reserved-lots data)) (err ERR_AMOUNT_TOO_LOW))
                ;; add random selection if same
                (asserts!
                    (is-even (buff-to-u8 (unwrap-panic (element-at (unwrap-panic (get-block-info? vrf-seed height)) u0))))
                    (err ERR_REFUSED))
            )
            ;; if it came before, accept it
            (begin
                (asserts!
                    (and
                        (< height (get last-verified-height data))
                        (or (is-eq (get start-block data) u0) (>= height (get start-block data)))) (err ERR_INVALID_TX))
            )
        )

        (map-set vault-dest vault-id (merge data { lender-id: lender-id, last-verified-height: height, reserved-lots: amount }))
        (contract-call? .vault-accounting reserve-lots amount vault-id lender-id height)
    )
)

(define-public (reserve-auction-lots (amount uint) (vault-id uint) (prev-lender-spk (buff 1024)) (lender-id uint) (height uint))
    (let (
        (data (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND)))
        (prev-lender (unwrap! (map-get? spk-lender (unwrap-panic (as-max-len? prev-lender-spk u42))) (err ERR_LENDER_NOT_FOUND)))
        )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (unwrap-panic (contract-call? .vault-accounting add-lender vault-id lender-id amount))
        ;; TODO: set block-height to the first reserved tx

        (if (is-eq height (get last-verified-height data))
            (begin
                (asserts! (> amount (get reserved-lots data)) (err ERR_AMOUNT_TOO_LOW))
                ;; add random selection if same
                (asserts!
                    (is-even (buff-to-u8 (unwrap-panic (element-at (unwrap-panic (get-block-info? vrf-seed height)) u0))))
                    (err ERR_REFUSED))
            )
            ;; if it came before, accept it
            (begin
                (asserts!
                    (and
                        (< height (get last-verified-height data))
                        (or (is-eq (get start-block data) u0) (>= height (get start-block data)))) (err ERR_INVALID_TX))
            )
        )

        (map-set vault-dest vault-id (merge data { lender-id: lender-id, last-verified-height: height, reserved-lots: amount }))
        (contract-call? .vault-auction reserve-auction-lots amount vault-id (get lender-id prev-lender) lender-id height)
    )
)

(define-public (store-spk (vault-id uint) (lender-id uint) (spk (buff 42)))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        
        (map-set lenders-spk { vault-id: vault-id,  lender-id: lender-id } spk)
        (map-set spk-lender spk { vault-id: vault-id, lender-id: lender-id })
        
        (ok true)
    )
)

(define-public (buy-lots (btc-amount uint) (vault-id uint) (height uint))
    (let (
        (lender-id (get lender-id (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND))))
    )
        (contract-call? .vault-accounting buy-lots btc-amount vault-id lender-id height)
    )
)

(define-public (buy-auction-lots (btc-amount uint) (vault-id uint) (height uint))
    (let (
        (lender-id (get lender-id (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND))))
    )
        (contract-call? .vault-auction buy-auction-lots btc-amount vault-id lender-id height)
    )
)

;; used for verifying the repayment of interest
(define-public (run-periodic-payment (amount uint) (vault-id uint) (spk (buff 42)) (height uint))
    (begin
        (asserts! (is-approved-caller contract-caller)  (err ERR_UNAUTHORIZED))
        (if (is-some (map-get? treasury-multisig spk))
            (begin
                ;; assumes there are other outputs to make sure that the vault-id is correct
                ;; might need to check independently that the vault-id is the right one
                (contract-call? .vault-accounting pay-to-treasury amount vault-id height)
            )
            (let (
                ;; determine if the payment goes to the lender or if it goes the Protocol Treasury
                (lender-info (unwrap! (map-get? spk-lender spk) (err ERR_LENDER_NOT_FOUND)))
                (lender-id (get lender-id lender-info))
            )
                (asserts!
                    (and
                        (is-approved-caller contract-caller)
                        (is-eq vault-id (get vault-id lender-info))) (err ERR_UNAUTHORIZED))
                ;; accouting determines if it's a lot payment or an interest payment
                (contract-call? .vault-accounting pay-to-lender amount vault-id lender-id height)
            )
        )
    )
)

(define-public (repay-lot (amount uint) (vault-id uint) (spk (buff 42)) (height uint))
    (begin
        (asserts! (is-approved-caller contract-caller)  (err ERR_UNAUTHORIZED))
        (let (
            ;; determine if the payment goes to the lender or if it goes the Protocol Treasury
            (lender-info (unwrap! (map-get? spk-lender spk) (err ERR_LENDER_NOT_FOUND)))
            (lender-id (get lender-id lender-info))
        )
            (asserts!
                (and
                    (is-approved-caller contract-caller)
                    (is-eq vault-id (get vault-id lender-info))) (err ERR_UNAUTHORIZED))
            ;; accouting determines if it's a lot payment or an interest payment
            (contract-call? .vault-accounting repay-lot amount vault-id lender-id height)
        )
    )
)

(define-public (get-native-data (vault-id uint))
    (ok (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND)))
)

(define-public (get-lender-spk (vault-id uint) (lender-id uint))
    (ok (unwrap! (map-get? lenders-spk { vault-id: vault-id, lender-id: lender-id }) (err ERR_VAULT_NOT_FOUND)))
)

;; for recordkeeping transactions that have already been confirmed and processed

(define-constant ERR_FULL_HISTORY u900)
(define-constant ERR_DOES_NOT_EXIST u901)
(define-constant ERR_TX_EXISTS u902)
(define-constant ERR_INVALID_TX u903)


(define-constant DUST 0x01)
(define-constant PAYMENT 0x02)
(define-constant REPAYMENT 0x03)

;; vault-id -> list of txs
(define-map txs
    uint
    { history: (list 40 (buff 32)), state: (buff 1) })

(define-public (add-tx (vault-id uint) (tx-id (buff 32)) (height uint) (state (buff 1)))
    (let (
        (history (default-to { history: (list), state: 0x } (map-get? txs vault-id)))
        (vault (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (if (is-eq state (get state history))
            (begin
                    (map-set txs vault-id (merge history {
                        history: (unwrap! (as-max-len? (append (get history history) tx-id) u40) (err ERR_FULL_HISTORY))})))
            (map-set txs vault-id { history: (list tx-id), state: state })   
        )
        (ok true)
    )
)

(define-public (clear-history (vault-id uint))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (ok (map-delete txs vault-id))
    )
)

(define-read-only (get-history (vault-id uint))
    (map-get? txs vault-id)
)

(define-private (tx-exists (vault-id uint) (tx-id (buff 32)))
    (let (
        (contents (unwrap! (map-get? txs vault-id) (err ERR_DOES_NOT_EXIST)))
    )
        (asserts! (is-some (index-of (get history contents) tx-id)) (err ERR_INVALID_TX))
        (ok contents)
    )
)

(define-read-only (is-even (val uint))
    (is-eq (mod val u2) u0)
)

;; Convert a 1-byte buff into a uint.
(define-read-only (buff-to-u8 (byte (buff 1)))
    (unwrap-panic (index-of BUFF_TO_BYTE byte)))

(define-constant BUFF_TO_BYTE (list
   0x00 0x01 0x02 0x03 0x04 0x05 0x06 0x07 0x08 0x09 0x0a 0x0b 0x0c 0x0d 0x0e 0x0f
   0x10 0x11 0x12 0x13 0x14 0x15 0x16 0x17 0x18 0x19 0x1a 0x1b 0x1c 0x1d 0x1e 0x1f
   0x20 0x21 0x22 0x23 0x24 0x25 0x26 0x27 0x28 0x29 0x2a 0x2b 0x2c 0x2d 0x2e 0x2f
   0x30 0x31 0x32 0x33 0x34 0x35 0x36 0x37 0x38 0x39 0x3a 0x3b 0x3c 0x3d 0x3e 0x3f
   0x40 0x41 0x42 0x43 0x44 0x45 0x46 0x47 0x48 0x49 0x4a 0x4b 0x4c 0x4d 0x4e 0x4f
   0x50 0x51 0x52 0x53 0x54 0x55 0x56 0x57 0x58 0x59 0x5a 0x5b 0x5c 0x5d 0x5e 0x5f
   0x60 0x61 0x62 0x63 0x64 0x65 0x66 0x67 0x68 0x69 0x6a 0x6b 0x6c 0x6d 0x6e 0x6f
   0x70 0x71 0x72 0x73 0x74 0x75 0x76 0x77 0x78 0x79 0x7a 0x7b 0x7c 0x7d 0x7e 0x7f
   0x80 0x81 0x82 0x83 0x84 0x85 0x86 0x87 0x88 0x89 0x8a 0x8b 0x8c 0x8d 0x8e 0x8f
   0x90 0x91 0x92 0x93 0x94 0x95 0x96 0x97 0x98 0x99 0x9a 0x9b 0x9c 0x9d 0x9e 0x9f
   0xa0 0xa1 0xa2 0xa3 0xa4 0xa5 0xa6 0xa7 0xa8 0xa9 0xaa 0xab 0xac 0xad 0xae 0xaf
   0xb0 0xb1 0xb2 0xb3 0xb4 0xb5 0xb6 0xb7 0xb8 0xb9 0xba 0xbb 0xbc 0xbd 0xbe 0xbf
   0xc0 0xc1 0xc2 0xc3 0xc4 0xc5 0xc6 0xc7 0xc8 0xc9 0xca 0xcb 0xcc 0xcd 0xce 0xcf
   0xd0 0xd1 0xd2 0xd3 0xd4 0xd5 0xd6 0xd7 0xd8 0xd9 0xda 0xdb 0xdc 0xdd 0xde 0xdf
   0xe0 0xe1 0xe2 0xe3 0xe4 0xe5 0xe6 0xe7 0xe8 0xe9 0xea 0xeb 0xec 0xed 0xee 0xef
   0xf0 0xf1 0xf2 0xf3 0xf4 0xf5 0xf6 0xf7 0xf8 0xf9 0xfa 0xfb 0xfc 0xfd 0xfe 0xff
))


(map-set caller-contracts .tx-verification true)
(map-set caller-contracts .vault true)

(map-set treasury-multisig 0x002068355c69d502eca786e43370078b4a8349a1e543f235326c8e78318765c3576d true)
