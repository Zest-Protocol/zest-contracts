(define-map prices (buff 32) {
  price: int,
  conf: uint,
  expo: int,
  ema-price: int,
  ema-conf: uint,
  publish-time: uint,
  prev-publish-time: uint,
})

(define-public (read-price-feed
    (price-feed-id (buff 32))
    (pyth-storage-address principal))
  (begin
    (ok (unwrap! (map-get? prices price-feed-id) (err u404)))))

(define-public (set-price (entry {
      price-identifier: (buff 32),
      price: int,
      conf: uint,
      expo: int,
      ema-price: int,
      ema-conf: uint,
      publish-time: uint,
      prev-publish-time: uint,
    }))
  (begin
    (map-set prices (get price-identifier entry)
      {
        price: (get price entry),
        conf: (get conf entry),
        expo: (get expo entry),
        ema-price: (get ema-price entry),
        ema-conf: (get ema-conf entry),
        publish-time: (get publish-time entry),
        prev-publish-time: (get prev-publish-time entry)
      }
    )
    (ok entry)
  )
)

(map-set prices 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 {
  price: 140709112,
  conf: u140891,
  expo: -8,
  ema-price: 139652876,
  ema-conf: u152648,
  publish-time: u1705949667,
  prev-publish-time: u1705949667,
})