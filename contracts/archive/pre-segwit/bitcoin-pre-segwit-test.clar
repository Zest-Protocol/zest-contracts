(define-read-only (test-concat-tx-1)
;; IN: P2PKH
;; OUTS: P2SH, P2PKH
    (let (
        (tx (contract-call?
            .concat-pre-segwit 
            concat-tx
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
                    value: 0xf07e0e0000000000,
                    scriptPubKey: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87
                }
                {
                    value: 0xbee2040000000000,
                    scriptPubKey: 0x76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac
                }
                ),
                locktime: 0x00000000
            }))
        )
        (asserts!
            (is-eq
                (contract-call? .verify-pre-segwit get-reversed-txid tx)
                0x7b4d414124c2ec714fc3ecfd8732fdbfc471de1152448255846374555c8d60a3)
        (err u300))

        (ok true)
    )
)



