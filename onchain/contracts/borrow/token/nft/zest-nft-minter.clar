(define-constant ERR_NOT_AUTHORIZED u1101)
(define-constant ERR_CANNOT_CLAIM u1102)
(define-constant ERR_ALREADY_CLAIMED u1103)
(define-constant DEPLOYER tx-sender)


;; does not exist: 0x00
;; unclaimed: 0x01
;; claimed: 0x02
(define-map claims principal { state: (buff 1), type: uint })

(define-read-only (get-claim (account principal))
  (default-to { state: 0x00, type: u0 } (map-get? claims account))
)

(define-read-only (has-claimed (account principal))
  (is-eq (get state (get-claim account)) 0x02)
)

(define-public (set-claim (acount principal) (type uint))
  (begin
    (asserts! (is-eq DEPLOYER tx-sender) ERR_NOT_AUTHORIZED)
    (ok (map-set claims account { state: 0x01, type: type}))
  )
)

(define-public (claim)
  (let (
    (claim-state (get-claim contract-caller))
  )
    (asserts! (is-eq (get state claim-state) 0x01) (err ERR_CANNOT_CLAIM))

    (try! (contract-call? .zest-nft mint-for-protocol contract-caller (get type claims)))
    (map-set claims tx-sender (merge claim-state { state: 0x02 }))
    (ok true)
  )
)

(map-set claims 'SP2N3KC4CR7CC0JP592S9RBA9GHVVD30WRA5GXE8G true)
