;; @contract Zest Genesis NFT
;; @version 1

(impl-trait .nft-trait.nft-trait)
(use-trait commission-trait .commission-trait.commission)

(define-non-fungible-token zest-genesis uint)

;;-------------------------------------
;; Constants
;;-------------------------------------

(define-constant ERR_NOT_AUTHORIZED u1101)
(define-constant ERR_SENDER_NOT_OWNER u1102)
(define-constant ERR_NFT_NOT_FOUND u1103)
(define-constant ERR_NO_LISTING u1104)
(define-constant ERR_WRONG_COMMISSION u1105)
(define-constant ERR_IS_LISTED u1106)
(define-constant ERR_GET_OWNER u1107)

;;-------------------------------------
;; Variables
;;-------------------------------------

(define-data-var last-id uint u0)
(define-data-var base-token-uri (string-ascii 210) "ipfs://")
(define-data-var contract-owner principal tx-sender)
(define-data-var the-mint principal tx-sender)

;;-------------------------------------
;; Maps
;;-------------------------------------

(define-map token-count principal uint)
(define-map market uint { price: uint, commission: principal })
;; u0 - Bootstrapper
;; u1 - Champion
;; u2 - King
;; u3 - GM
(define-map genesis-type uint uint)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-base-token-uri)
  (var-get base-token-uri)
)

(define-read-only (get-balance (account principal))
  (default-to u0 (map-get? token-count account))
)

(define-read-only (get-genesis-type (id uint))
  (default-to u0 (map-get? genesis-type id))
)

(define-read-only (get-listing-in-ustx (id uint))
  (map-get? market id)
)

;;-------------------------------------
;; IPFS
;;-------------------------------------

(define-public (set-base-token-uri (new-base-token-uri (string-ascii 210)))
  (begin
    (try! (is-contract-owner))

    (var-set base-token-uri new-base-token-uri)
    (ok true)
  )
)

;;-------------------------------------
;; SIP-009 
;;-------------------------------------

(define-read-only (get-last-token-id)
  (ok (var-get last-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (concat (var-get base-token-uri) (uint-to-string token-id)) ".json")))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? zest-genesis token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-none (map-get? market token-id)) (err ERR_IS_LISTED))
    (try! (transfer-helper token-id sender recipient))
    (ok true)
  )
)

;;-------------------------------------
;; uint to string
;;-------------------------------------

(define-constant LIST_40 (list
  true true true true true true true true true true
  true true true true true true true true true true
  true true true true true true true true true true
  true true true true true true true true true true
))

(define-read-only (uint-to-string (value uint))
  (get return (fold uint-to-string-clojure LIST_40 {value: value, return: ""}))
)

(define-read-only (uint-to-string-clojure (i bool) (data {value: uint, return: (string-ascii 40)}))
  (if (> (get value data) u0)
    {
      value: (/ (get value data) u10),
      return: (unwrap-panic (as-max-len? (concat (unwrap-panic (element-at "0123456789" (mod (get value data) u10))) (get return data)) u40))
    }
    data
  )
)

;;-------------------------------------
;; Mint / Burn
;;-------------------------------------

(define-public (set-contract-owner (owner principal))
  (begin
    (try! (is-contract-owner tx-sender))
    (ok (var-set contract-owner owner))
  )
)

(define-public (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (is-contract-owner (caller principal))
  (asserts! (is-eq caller (var-get contract-owner)) ERR_NOT_AUTHORIZED)
)

(define-public (set-the-mint (the-mint principal))
  (begin
    (try! (is-contract-owner tx-sender))
    (ok (var-set the-mint the-mint))
  )
)

(define-public (get-the-mint)
  (ok (var-get the-mint))
)

(define-read-only (is-the-mint (the-mint principal))
  (asserts! (is-eq caller (var-get the-mint)) ERR_NOT_AUTHORIZED)
)

(define-public (mint-for-protocol (recipient principal) (type uint))
  (let (
    (next-id (+ u1 (var-get last-id)))
  )
    (try! (is-the-mint contract-caller))

    (try! (nft-mint? zest-genesis (var-get last-id) recipient))

    (map-set token-count recipient (+ (get-balance recipient) u1))
    (map-set genesis-type (var-get last-id) type)
    (var-set last-id next-id)
    (ok true)
  )
)

(define-public (burn-for-protocol (token-id uint))
  (let (
    (owner (unwrap! (unwrap! (get-owner token-id) (err ERR_GET_OWNER)) (err ERR_GET_OWNER)))
  )
    (try! (is-the-mint contract-caller))

    (try! (nft-burn? zest-genesis token-id owner))

    (map-set token-count owner (- (get-balance owner) u1))
    (ok true)
  )
)

;;-------------------------------------
;; Marketplace
;;-------------------------------------

(define-private (is-sender-owner (id uint))
  (let (
    (owner (unwrap! (nft-get-owner? zest-genesis id) false))
  )
    (or (is-eq tx-sender owner) (is-eq contract-caller owner))
  )
)

(define-public (list-in-ustx (id uint) (price uint) (commission-contract <commission-trait>))
  (let (
    (listing  { price: price, commission: (contract-of commission-contract) })
  )
    (asserts! (is-sender-owner id) (err ERR_SENDER_NOT_OWNER))

    (map-set market id listing)
    (print (merge listing { a: "list-in-ustx", id: id }))
    (ok true)
  )
)

(define-public (unlist-in-ustx (id uint))
  (begin
    (asserts! (is-sender-owner id) (err ERR_SENDER_NOT_OWNER))

    (map-delete market id)
    (print { a: "unlist-in-ustx", id: id })
    (ok true)
  )
)

(define-public (buy-in-ustx (id uint) (commission-contract <commission-trait>))
  (let (
    (owner (unwrap! (nft-get-owner? zest-genesis id) (err ERR_NFT_NOT_FOUND)))
    (listing (unwrap! (map-get? market id) (err ERR_NO_LISTING)))
    (price (get price listing))
  )
    (asserts! (is-eq (contract-of commission-contract) (get commission listing)) (err ERR_WRONG_COMMISSION))

    (try! (stx-transfer? price tx-sender owner))
    (try! (contract-call? commission-contract pay id price))
    (try! (transfer-helper id owner tx-sender))

    (map-delete market id)
    (print { a: "buy-in-ustx", id: id })
    (ok true)
  )
)

(define-private (transfer-helper (id uint) (sender principal) (recipient principal))
  (begin
    (try! (nft-transfer? zest-genesis id sender recipient))

    (let (
      (sender-balance (get-balance sender))
      (recipient-balance (get-balance recipient))
    )
      (map-set token-count sender (- sender-balance u1))
      (map-set token-count recipient (+ recipient-balance u1))
      (ok true)
    )
  )
)