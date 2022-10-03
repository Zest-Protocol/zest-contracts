;; procedures for verifying and manipulating transactions

(define-constant ERR_CONVERSION u500)
(define-constant ERR_VERIFICATION u503)
(define-constant ERR_TX_NOT_MINED u502)

(define-constant ERR_VAULT_NOT_FOUND u400)
(define-constant ERR_INVALID_OUT_IDX u401)
(define-constant ERR_INCORRECT_DEST u402)
(define-constant ERR_INVALID_SKP u403)
(define-constant ERR_SETTING_REFUND_ADDR u404)
(define-constant ERR_WHILE_PROCESSING u405)


(define-constant ERR-OUT-OF-BOUNDS u300)

(define-constant DUST 0x01)
(define-constant PAYMENT 0x02)
(define-constant REPAYMENT 0x03)

;; we might write different versions for the different number of ins and outs for optimization
;; Can verify pre-segwit dust transactions
(define-public (verify-dust
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    (out-idx uint)
    )
    (let (
        (tx-out (unwrap! (element-at (get outs tx) out-idx) (err ERR_INVALID_OUT_IDX)))
    )
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id DUST) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        (asserts!
            (is-eq
                (get dest (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
                (get scriptPubKey tx-out)
            )
            (err ERR_INCORRECT_DEST))
        (try! (verify-outs-dust (get outs tx) vault-id (get height block)))
        (try! (contract-call? .vault-accounting lock-funds vault-id))
        (ok true)
    )
)

(define-private (verify-outs-dust (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (funding-data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
        (result
            (fold
                verify-outs-dust-iter
                outs
                (ok {   scriptPubKey: (get dest funding-data),
                        vault-id: vault-id,
                        height: height,
                        lender-id: (unwrap-panic (contract-call? .vault-accounting register-lender)) })))
        )
        ;; If destination addr was not set as (buff 42) always fail
        (ok true)
    )
)

;; We will perform the logic required in case of payment depending on whether it's
;; SPEND, CHANGE or DATA out
(define-private (verify-outs-dust-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { scriptPubKey: (buff 1024), vault-id: uint, height: uint, lender-id: uint } uint)))
    ;; if it's not the spend addr, it's change or data
    (if (is-eq (get scriptPubKey out) (get scriptPubKey (unwrap! output (err ERR_WHILE_PROCESSING)))) ;; if vault SPEND out
        (begin
            (try! (contract-call?
                .native
                reserve-lots
                (read-uint64 (get value out))
                (get vault-id (unwrap-panic output))
                (get lender-id (unwrap-panic output))
                (get height (unwrap-panic output))))
            (print { vault-reserved: (get vault-id (unwrap-panic output)), reserved-by: (get scriptPubKey out) })
            output)
        
        (if (is-data-out (unwrap-panic (as-max-len? (get scriptPubKey out) u42))) ;; if CHANGE out
            output ;; do nothing
            (begin
                (try!
                    (contract-call?
                        .native
                        store-spk
                        (get vault-id (unwrap-panic output))
                        (get lender-id (unwrap-panic output))
                        (unwrap-panic (as-max-len? (get scriptPubKey out) u42))
                    )
                )
                output
            )
        )
    )
)

;; we might write different versions for the different number of ins and outs for optimization
;; Can verify pre-segwit dust transactions
(define-public (verify-payment
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    )
    (begin
        ;; add guards
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id PAYMENT) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        (try! (process-payment (get outs tx) vault-id (get height block)))
        (ok true)
    )
)

(define-private (process-payment (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (funding-data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (fold process-payment-iter outs (ok { scriptPubKey: (get dest funding-data), vault-id: vault-id, height: height }))
    )
)

;; check if payment was sent to funding addr in vault
;; SPEND
(define-private (process-payment-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { scriptPubKey: (buff 1024), vault-id: uint, height: uint } uint)))
    ;; only need to read the spend output
    (begin
        (asserts! (is-eq (get scriptPubKey out) (get scriptPubKey (unwrap-panic output))) output)
        (try!
            (contract-call?
                .native
                buy-lots
                (read-uint64 (get value out))
                (get vault-id (unwrap-panic output))
                (get height (unwrap-panic output))
            )
        )
        (print { vault-paid: (get vault-id (unwrap-panic output)), amount-paid:  (get value out) })
        output
    )
)

;; we might write different versions for the different number of ins and outs for optimization
(define-public (verify-periodic-payment
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    )
    (begin
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id REPAYMENT) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        (try! (process-periodic-payment (get outs tx) vault-id (get height block)))
        (ok true)
    )
)

(define-private (process-periodic-payment (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (fold process-periodic-payment-iter outs (ok { vault-id: vault-id, height: height }))
    )
)

;; check if payment was sent to funding addr in vault
(define-private (process-periodic-payment-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { vault-id: uint, height: uint } uint)))
    (match (contract-call?
            .native
            run-periodic-payment
            (read-uint64 (get value out))
            (get vault-id (unwrap-panic output))
            (unwrap-panic (as-max-len? (get scriptPubKey out) u42))
            (get height (unwrap-panic output)))
        ok-value (begin 
                    (print { vault-repaid: (get vault-id (unwrap-panic output)), amount-repaid:  (get value out) })
                    output)
        ignored output
    )
)

(define-public (verify-repayment
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    )
    (begin
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id REPAYMENT) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        (try! (process-repayment (get outs tx) vault-id (get height block)))
        (ok true)
    )
)

(define-private (process-repayment (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (fold process-repayment-iter outs (ok { vault-id: vault-id, height: height }))
    )
)

(define-private (process-repayment-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { vault-id: uint, height: uint } uint)))
    (match (contract-call?
            .native
            repay-lot
            (read-uint64 (get value out))
            (get vault-id (unwrap-panic output))
            (unwrap-panic (as-max-len? (get scriptPubKey out) u42))
            (get height (unwrap-panic output)))
        ok-value (begin 
                    (print { vault-repaid: (get vault-id (unwrap-panic output)), amount-repaid:  (get value out) })
                    output)
        ignored output
    )
)

(define-public (verify-auction-reservation
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    )
    (begin
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id REPAYMENT) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        
        (try! (process-auction-reservation (get outs tx) vault-id (get height block)))
        
        (ok true)
    )
)

(define-private (process-auction-reservation (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (fold
            process-auction-iter
            outs
            (ok  {  scriptPubKey: (get dest data),
                    vault-id: vault-id,
                    height: height,
                    lender-id: (unwrap-panic (contract-call? .vault-accounting register-lender)) }))
    )
)

(define-private (process-auction-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { scriptPubKey: (buff 1024), vault-id: uint, height: uint, lender-id: uint } uint)))
    (if (is-eq (get scriptPubKey out) (get scriptPubKey (unwrap-panic output))) ;; if vault SPEND out
        (begin
            (try! (contract-call?
                .native
                ;; do the reservation for an auction here
                reserve-auction-lots
                (read-uint64 (get value out))
                (get vault-id (unwrap-panic output))
                (get scriptPubKey (unwrap-panic output))
                (get lender-id (unwrap-panic output))
                (get height (unwrap-panic output))))
            (print { vault-reserved: (get vault-id (unwrap-panic output)), reserved-by: (get scriptPubKey out) })
            output
        )
        (if (is-data-out (unwrap-panic (as-max-len? (get scriptPubKey out) u42))) ;; if DATA or CHANGE out
            output ;; do nothing
            (begin
                (try!
                    (contract-call?
                        .native
                        store-spk
                        (get vault-id (unwrap! output (err ERR_WHILE_PROCESSING)))
                        (get lender-id (unwrap! output (err ERR_WHILE_PROCESSING)))
                        (unwrap-panic (as-max-len? (get scriptPubKey out) u42))
                    )
                )
                output
            )
        )
    )
)

(define-public (verify-auction-purchase
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    )
    (begin
        (asserts!
            (unwrap! (verify-transaction block tx proof vault-id REPAYMENT) (err ERR_VERIFICATION))
            (err ERR_TX_NOT_MINED))
        
        (try! (process-auction-buy (get outs tx) vault-id (get height block)))
        
        (ok true)
    )
)

(define-private (process-auction-buy (outs (list 3 { value: (buff 8), scriptPubKey: (buff 128) })) (vault-id uint) (height uint))
    (let (
        (data (unwrap! (contract-call? .native get-native-data vault-id) (err ERR_VAULT_NOT_FOUND)))
    )
        (fold
            process-auction-buy-iter
            outs
            (ok { vault-id: vault-id, height: height }))
    )
)

(define-private (process-auction-buy-iter
    (out { value: (buff 8), scriptPubKey: (buff 128) })
    (output (response { vault-id: uint, height: uint } uint)))
    (match (contract-call?
            .native
            ;; buy auction lots
            repay-lot
            (read-uint64 (get value out))
            (get vault-id (unwrap-panic output))
            (unwrap-panic (as-max-len? (get scriptPubKey out) u42))
            (get height (unwrap-panic output)))
        ok-value (begin 
                    (print { vault-repaid: (get vault-id (unwrap-panic output)), amount-repaid:  (get value out) })
                    output)
        ignored output
    )
)

;; wrapper function to verify a transaction
;; currently always verifies to true because
;; the burnchain header hash is always equal to 0x0030 in a regtest environment
(define-public (verify-transaction
    (block {
        version: (buff 4),
        parent: (buff 32),
        merkle-root: (buff 32),
        timestamp: (buff 4),
        nbits: (buff 4),
        nonce: (buff 4),
        height: uint
    })
    (tx {
        version: (buff 4),
        ins: (list 8 { outpoint: { hash: (buff 32), index: (buff 4) }, scriptSig: (buff 256), sequence: (buff 4) }),
        outs: (list 3 { value: (buff 8), scriptPubKey: (buff 128) }),
        locktime: (buff 4)})
    (proof {
        tx-index: uint,
        hashes: (list 12 (buff 32)),
        tree-depth: uint })
    (vault-id uint)
    (state (buff 1))
    )
    (let (
        (concatenated-tx (contract-call? .bitcoin-pre-segwit concat-tx tx))
        (tx-id (sha256 (sha256 concatenated-tx)))
    )
        (try! (contract-call? .native add-tx vault-id tx-id (get height block) state))
        ;; add guards
        (ok true)
        ;; To use on DevNet or TestNet
        ;; (asserts!
        ;;     (unwrap!
        ;;         (contract-call? .bitcoin-pre-segwit was-tx-mined block concatenated-tx proof)
        ;;         (err ERR_VERIFICATION))
        ;;     (err ERR_TX_NOT_MINED))
    )
)

;; read uint64 little endian
;; we can assume amount is valid because the transaction contents have been verified
(define-read-only (read-uint64 (amount (buff 8)))
    (+
        (buff-to-u8 (unwrap-panic (element-at amount u0)))
        (* u256 (buff-to-u8 (unwrap-panic (element-at amount u1))))
        (* u65536 (buff-to-u8 (unwrap-panic (element-at amount u2))))
        (* u16777216 (buff-to-u8 (unwrap-panic (element-at amount u3))))
        (* u4294967296 (buff-to-u8 (unwrap-panic (element-at amount u4))))
        (* u1099511627776 (buff-to-u8 (unwrap-panic (element-at amount u5))))
        (* u281474976710656 (buff-to-u8 (unwrap-panic (element-at amount u6))))
        (* u72057594037927936 (buff-to-u8 (unwrap-panic (element-at amount u7)))))
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


;; is OP_RETURN OP_PUSH_32
;; max size of push DATA is 83 bytes
(define-private (is-data-out (scriptPubKey (buff 128)))
    (asserts!
        (is-eq 0x6a (unwrap-panic (element-at scriptPubKey u0)))
        false
    )
)