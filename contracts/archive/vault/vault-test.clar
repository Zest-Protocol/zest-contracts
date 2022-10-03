;; for calling verify-dust
(define-public (verify-dust-1)
    (begin 
        (contract-call?
            .tx-verification
            verify-dust
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u2
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x3d51e7b96cdaecbb776a1fd0a4ec83a6280004e929cd07c75ea1833bf9b77cdc,
                        index: 0x57000000
                    },
                    scriptSig: 0x473044022073f4d2b3485b364c570007eac01d6bc567219a32bdf0ad948ed150537f791e7d02204c19d23b279ece7592be9ad53a17d51a8fcc0c9e001b2f0f038b8f279b56882e012102a3fd1f0084b90878d43ed01a4ad5fef89265a8ad98c4639ece8ffc7d28052930,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0xf07e0e0000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                {
                    ;; SPEND
                    value: 0x0500000000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
            u1
        )
    )
)
;; same height as 1 but higher dust amount
(define-public (verify-dust-2)
    (begin 
        (contract-call?
            .tx-verification
            verify-dust
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u2
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x3d51e7b96cdaecbb776a1fd0a4ec83a6280004e929cd07c75ea1833bf9b77cdc,
                        index: 0x57000000
                    },
                    scriptSig: 0x473044022073f4d2b3485b364c570007eac01d6bc567219a32bdf0ad948ed150537f791e7d02204c19d23b279ece7592be9ad53a17d51a8fcc0c9e001b2f0f038b8f279b56882e012102a3fd1f0084b90878d43ed01a4ad5fef89265a8ad98c4639ece8ffc7d28052930,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x547f0e0000000000,
                    scriptPubKey: 0xa9142c2ff269501c179ff08fee3c769e6e4a94105e9187
                }
                {
                    ;; SPEND
                    value: 0x5802000000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
            u1
        )
    )
)

(define-public (verify-dust-3)
    (begin
        (contract-call?
            .tx-verification
            verify-dust
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u3
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x3d51e7b96cdaecbb776a1fd0a4ec83a6280004e929cd07c75ea1833bf9b77cdc,
                        index: 0x57000000
                    },
                    scriptSig: 0x473044022073f4d2b3485b364c570007eac01d6bc567219a32bdf0ad948ed150537f791e7d02204c19d23b279ece7592be9ad53a17d51a8fcc0c9e001b2f0f038b8f279b56882e012102a3fd1f0084b90878d43ed01a4ad5fef89265a8ad98c4639ece8ffc7d28052930,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x547f0e0000000000,
                    scriptPubKey: 0xa9142c2ff269501c179ff08fee3c769e6e4a94105e9187
                }
                {
                    ;; SPEND
                    value: 0x5802000000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
            u1
        )
    )
)

;; tx-hash: 9dbc98f76cfdc4dd9bb6fcf88aba9e0e60950db3c467083ed136f09bfc5364a9
(define-public (verify-payment-1)
    (begin 
        (contract-call?
            .tx-verification
            verify-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u0
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0xeb7ef08d6ef31737a32d78509dbcd2d3dcd511622ecfa3302a84336506e13045,
                        index: 0x77000000
                    },
                    scriptSig: 0x4730440220012ad37efca7f2656c80701c715cc636302395e7d4e26bfd6a8d2aa7037e4dc902204bfe6e3987a2a671a57f1b1fc4e72546f6d7ac015fc02c980f8ecf859f1ab103012102103618b77089709b2bf3936faa3144d027179e0681a7152f13a9607c67eda425,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x909f200000000000,
                    scriptPubKey: 0xa914e6d0770c1f9ff747974dc5b04119d4d7ca05994087
                }
                {
                    ;; SPEND
                    value: 0x8f02030000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; tx-hash: 65802ac046105533469dd55ba04250e8937b7f097a13a5536f16c3a4a1011fc4
(define-public (verify-payment-2)
    (begin 
        (contract-call?
            .tx-verification
            verify-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u0
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x77fd1a82539fd6604d1d7b3fa247d6cff18f04223558a7447c5b5b94845273fd,
                        index: 0x01000000
                    },
                    scriptSig: 0x483045022100c59a879fe5c16acab6cbaddfd1dcc12cfe7c10689a5e5a37874c7d0382c4328a02205c4c13a0d51522dd9ac03f5742f2bf69b794f0c891fe08c0e9c85900d53ea7e6012102671f1ae5ef3966dc547de554cccf34a0aaf1f245be325ca00dc54934f10736f3,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0xd02dca0000000000,
                    scriptPubKey: 0xa914337aa163645fe2ab4bbddf5f92e0670a927b66e987
                }
                {
                    ;; SPEND
                    value: 0xd5422f0000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; tx-hash: 1654ebdaffdf0b1840c2de4d3a2ac9c52cd1727ea3c85629e20a8c0102ab6f03
(define-public (verify-payment-3)
    (begin 
        (contract-call?
            .tx-verification
            verify-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u12
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0x80f0fa0200000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)


;; tx-hash: 1654ebdaffdf0b1840c2de4d3a2ac9c52cd1727ea3c85629e20a8c0102ab6f03
(define-public (verify-payment-4)
    (begin 
        (contract-call?
            .tx-verification
            verify-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u12
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0xe803000000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; not a real transaction
(define-public (verify-payment-interest-1)
    (begin 
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u4333
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0x5128130000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; not a real transaction
(define-public (verify-payment-interest-2)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u8655
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0x5128130000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)


;; not a real transaction
(define-public (verify-payment-interest-3)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u12972
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0xddd4030000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; not a real transaction
(define-public (verify-payment-interest-4)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u12974
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0xddd4030000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; not a real transaction
(define-public (verify-payment-interest-5)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u12999
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0xddd4030000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)
;; not a real transaction
(define-public (verify-payment-interest-6)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u13000
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0xddd4030000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)
;; not a real transaction
(define-public (verify-payment-interest-7)
    (begin
        (contract-call?
            .tx-verification
            verify-periodic-payment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u13010
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0x30c3030000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                {
                    ;; TREASURY
                    value: 0xf4cf120000000000,
                    scriptPubKey: 0x002068355c69d502eca786e43370078b4a8349a1e543f235326c8e78318765c3576d
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)

;; not a real transaction
(define-public (verify-repayment-1)
    (begin
        (contract-call?
            .tx-verification
            verify-repayment
            {
                version: 0x01000000,
                parent: 0x0000000000000000000000000000000000000000000000000000000000000000,
                merkle-root: 0x0000000000000000000000000000000000000000000000000000000000000000,
                timestamp: 0x00000000,
                nbits: 0x00000000,
                nonce: 0x00000000,
                height: u17869
            }
            {
                version: 0x01000000,
                ins: (list {
                    outpoint: {
                        hash: 0x71a582eac7cdac082ec9d9f1f39c60c8be0dbfb0c5c0b1bc9d165deef79fa785,
                        index: 0x00000000
                    },
                    scriptSig: 0x473044022033b6c2efda9f6edebac7f3b2a4aea0fc2e059788d3a9ca03c0421353005e913302205df62b2b81898dc602658b669564bb25d81dbec9a6ca675f8bbe18e21d0e3229012103d1aa499a80e2ca4b372d1fc67dd0316a97f4e2edcb929c123878de1596457711,
                    sequence: 0x00000080
                }),
                outs: (list
                {
                    ;; CHANGE
                    value: 0x4097690000000000,
                    scriptPubKey: 0x00147d5635bcc37269379b8ea5719ce41b4b68d04ac0
                }
                {
                    ;; SPEND
                    value: 0x80f0fa0200000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                ),
                locktime: 0x00000000
            }
            {
                tx-index: u0,
                hashes: (list 
                    0x0000000000000000000000000000000000000000000000000000000000000000
                ),
                tree-depth: u1
            }
            u0
        )
    )
)