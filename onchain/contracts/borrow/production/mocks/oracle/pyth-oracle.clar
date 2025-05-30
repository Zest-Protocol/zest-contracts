(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

(define-constant err-unauthorized (err u6000))
(define-constant err-stale-price (err u6001))
(define-constant err-price-feed-id (err u6002))
(define-constant err-price-out-of-range (err u6003))
(define-constant err-expo-should-be-negative (err u6004))

(define-constant btc-price-feed-id 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
(define-constant stx-price-feed-id 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)
(define-constant usdc-price-feed-id 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a)

(define-constant ststx-contract .ststx)
(define-constant wstx-contract .wstx)
(define-constant sbtc-contract .sbtc)
(define-constant usdc-contract .usda)

(define-constant stx-den u1000000)
(define-constant one-8 u100000000)
(define-constant deployer tx-sender)

(define-data-var stale-price-threshold uint (if is-in-mainnet u120 (+ u120 u8000)))

(define-map assets principal {
    price-feed-id: (buff 32),
    ;; sigma/mu confidence interval https://docs.pyth.network/price-feeds/best-practices#confidence-intervals
    sigma-mu: uint,
})

;; prices are fixed to 8 decimals
(define-public (get-asset-price (token <ft>))
  (let (
    (price-feed (unwrap! (map-get? assets (contract-of token)) err-price-feed-id))
    (price-feed-id (get price-feed-id price-feed))
    (sigma-mu (get sigma-mu price-feed))
    (oracle-data
        (try!
            (contract-call? .pyth-oracle-v3
                get-price
                price-feed-id
                .pyth-storage-v3
            )
        )
    )
    (expo (get expo oracle-data))
    (price (try! (convert-to-fixed-8 (get price oracle-data) expo)))
    (conf (try! (convert-to-fixed-8 (to-int (get conf oracle-data)) expo)))
  )
    ;; is in confidence interval
    (asserts! (< (div conf price) sigma-mu) err-price-out-of-range)
    ;; is not stale
    (asserts! (<
        (- (unwrap-panic (get-stacks-block-info? time (- stacks-block-height u1))) (get publish-time oracle-data))
        (var-get stale-price-threshold)
    ) err-stale-price)

    ;; convert to ststx if token is ststx
    (if (is-eq (contract-of token) ststx-contract)
      (convert-stx-to-ststx price)
      (ok price)
    )
  )
)

(define-read-only (get-price (token principal))
  (let (
    (price-feed (unwrap! (map-get? assets token) err-price-feed-id))
    (price-feed-id (get price-feed-id price-feed))
    (sigma-mu (get sigma-mu price-feed))
    (oracle-data (try! (contract-call? .pyth-storage-v3 get-price price-feed-id)))
    (expo (get expo oracle-data))
    (price (unwrap-panic (convert-to-fixed-8 (get price oracle-data) expo)))
    (conf (unwrap-panic (convert-to-fixed-8 (to-int (get conf oracle-data)) expo)))
  )
    (if (is-eq token ststx-contract)
        (convert-stx-to-ststx-read price)
        (ok price)
    )
  )
)

(define-private (convert-stx-to-ststx (stx-price uint))
  (let (
    ;; (ratio
    ;;   (try!
    ;;     (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v2
    ;;       get-stx-per-ststx
    ;;       'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1
    ;;     )
    ;;   )
    ;; )
    (ratio u1080000)
  )
    (asserts! true (err u999))
    (ok (/ (* stx-price ratio) stx-den))
  )
)


(define-read-only (convert-stx-to-ststx-read (stx-price uint))
  (let (
    ;; (total-stx-amount (unwrap-panic (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1 get-total-stx)))
    ;; (ststxbtc-supply (unwrap-panic (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststxbtc-token get-total-supply)))
    ;; (stx-for-ststx (- total-stx-amount ststxbtc-supply))
    ;; (ratio (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v2 get-stx-per-ststx-helper stx-for-ststx))
    (ratio u1080000)
  )
    (ok (/ (* stx-price ratio) stx-den))
  )
)

(define-read-only (get-stale-price-threshold)
    (var-get stale-price-threshold))

(define-public (set-stale-price-threshold (threshold uint))
    (begin
        (asserts! (is-eq tx-sender deployer) err-unauthorized)
        (ok (var-set stale-price-threshold threshold))
    )
)

(define-public (set-asset (token principal) (data { price-feed-id: (buff 32), sigma-mu: uint }))
    (begin
        (asserts! (is-eq tx-sender deployer) err-unauthorized)
        (ok (map-set assets token data))
    )
)


;; if the integer represenation is 10^expo, convert to 8 decimal places
(define-read-only (convert-to-fixed-8 (price int) (expo int))
  (if (> expo 0)
    ;; should not be the case, fail
    err-expo-should-be-negative
    (if (< expo -8)
      (ok (to-uint (/ price (pow 10 (- (+ expo 8))))))
      (ok (to-uint (* price (pow 10 (+ expo 8)))))
    )
  )
)

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y))


;; sigma/mu of 0.5%
(map-set assets sbtc-contract { price-feed-id: btc-price-feed-id, sigma-mu: u500000 })
;; 0.5%
(map-set assets wstx-contract { price-feed-id: stx-price-feed-id, sigma-mu: u500000 })
(map-set assets ststx-contract { price-feed-id: stx-price-feed-id, sigma-mu: u500000 })
;; 0.1%
(map-set assets usdc-contract { price-feed-id: usdc-price-feed-id, sigma-mu: u100000 })
