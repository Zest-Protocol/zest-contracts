(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token xbtc)
(define-data-var token-uri (string-utf8 256) u"")

(define-constant DEPLOYER tx-sender)

(define-constant ERR-UNAUTHORIZED u300)

(define-read-only (get-total-supply)
  (ok (ft-get-supply xbtc))
)

(define-read-only (get-name)
  (ok "xBTC")
)

(define-read-only (get-symbol)
  (ok "xBTC")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance xbtc account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender DEPLOYER)
    (ok (var-set token-uri value))
    (err ERR-UNAUTHORIZED)
  )
)

(define-read-only (get-token-uri)
    (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-UNAUTHORIZED))
    
    (match (ft-transfer? xbtc amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(ft-mint? xbtc u10000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; (ft-mint? xbtc u10000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
;; (ft-mint? xbtc u10000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
;; (ft-mint? xbtc u10000000000 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)
;; (ft-mint? xbtc u10000000000 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP)
;; (ft-mint? xbtc u10000000000 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ)
;; (ft-mint? xbtc u10000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge-router-test)
;; (ft-mint? xbtc u10000000000 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP)