
;; testnet
(try! (contract-call? .sbtc mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))
(try! (contract-call? .ststx mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))
(try! (contract-call? .diko mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))
(try! (contract-call? .usda mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))
(try! (contract-call? .xusd mint u1000000000000000 'ST3TBY8R0WVGSJWDDDQEX7594XDGH6G8K1RRW31W6))

(try! (contract-call? .sbtc mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))
(try! (contract-call? .ststx mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))
(try! (contract-call? .diko mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))
(try! (contract-call? .usda mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))
(try! (contract-call? .xusd mint u1000000000000000 'ST8NT020C8QJ9VGZAGGZZBBX3NNB78HTKDF9N6RX))

(try! (contract-call? .sbtc mint u1000000000000000 'ST3MFGGY0T2FQTNVC2E8EVHQ1DZJ1Z92SP5JQ2HTV))
(try! (contract-call? .ststx mint u1000000000000000 'ST3MFGGY0T2FQTNVC2E8EVHQ1DZJ1Z92SP5JQ2HTV))
(try! (contract-call? .diko mint u1000000000000000 'ST3MFGGY0T2FQTNVC2E8EVHQ1DZJ1Z92SP5JQ2HTV))
(try! (contract-call? .usda mint u1000000000000000 'ST3MFGGY0T2FQTNVC2E8EVHQ1DZJ1Z92SP5JQ2HTV))
(try! (contract-call? .xusd mint u1000000000000000 'ST3MFGGY0T2FQTNVC2E8EVHQ1DZJ1Z92SP5JQ2HTV))

(try! (contract-call? .sbtc mint u1000000000000000 'ST3HS04BSZ13JZAAEQPX4ZMMW90MESSD3EFXPZ7HH))
(try! (contract-call? .ststx mint u1000000000000000 'ST3HS04BSZ13JZAAEQPX4ZMMW90MESSD3EFXPZ7HH))
(try! (contract-call? .diko mint u1000000000000000 'ST3HS04BSZ13JZAAEQPX4ZMMW90MESSD3EFXPZ7HH))
(try! (contract-call? .usda mint u1000000000000000 'ST3HS04BSZ13JZAAEQPX4ZMMW90MESSD3EFXPZ7HH))
(try! (contract-call? .xusd mint u1000000000000000 'ST3HS04BSZ13JZAAEQPX4ZMMW90MESSD3EFXPZ7HH))

(try! (contract-call? .sbtc mint u1000000000000000 'ST1Y7F4ET4NM6V9JG5DZNZ3C6FRHSV4BCD8489Y6K))
(try! (contract-call? .ststx mint u1000000000000000 'ST1Y7F4ET4NM6V9JG5DZNZ3C6FRHSV4BCD8489Y6K))
(try! (contract-call? .diko mint u1000000000000000 'ST1Y7F4ET4NM6V9JG5DZNZ3C6FRHSV4BCD8489Y6K))
(try! (contract-call? .usda mint u1000000000000000 'ST1Y7F4ET4NM6V9JG5DZNZ3C6FRHSV4BCD8489Y6K))
(try! (contract-call? .xusd mint u1000000000000000 'ST1Y7F4ET4NM6V9JG5DZNZ3C6FRHSV4BCD8489Y6K))

(try! (contract-call? .sbtc mint u1000000000000000 'ST1YCEV0CWZ2RJ2KMWF8QYA98VZCKRR926PF3G168))
(try! (contract-call? .ststx mint u1000000000000000 'ST1YCEV0CWZ2RJ2KMWF8QYA98VZCKRR926PF3G168))
(try! (contract-call? .diko mint u1000000000000000 'ST1YCEV0CWZ2RJ2KMWF8QYA98VZCKRR926PF3G168))
(try! (contract-call? .usda mint u1000000000000000 'ST1YCEV0CWZ2RJ2KMWF8QYA98VZCKRR926PF3G168))
(try! (contract-call? .xusd mint u1000000000000000 'ST1YCEV0CWZ2RJ2KMWF8QYA98VZCKRR926PF3G168))


(define-constant max-value u340282366920938463463374607431768211455)

(define-constant sbtc-supply-cap u1000000000000)
(define-constant sbtc-borrow-cap u900000000000)

(define-constant ststx-supply-cap u10000000000000)
(define-constant ststx-borrow-cap u10000000000000)

(define-constant diko-supply-cap u200000000000000)
(define-constant diko-borrow-cap u150000000000000)

(define-constant usda-supply-cap u10000000000000)
(define-constant usda-borrow-cap u10000000000000)

(define-constant xusd-supply-cap u10000000000000)
(define-constant xusd-borrow-cap u10000000000000)

(try!
  (contract-call? .pool-borrow
    init
    .lp-ststx
    .ststx
    u6
    ststx-supply-cap
    ststx-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .ststx)

(try!
  (contract-call? .pool-borrow
    init
    .lp-wstx
    .wstx
    u6
    ststx-supply-cap
    ststx-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .wstx)

(try!
  (contract-call? .pool-borrow
    init
    .lp-sbtc
    .sbtc
    u8
    sbtc-supply-cap
    sbtc-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .sbtc)

(try!
  (contract-call? .pool-borrow
    init
    .lp-diko
    .diko
    u6
    diko-supply-cap
    diko-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .diko)

(try!
  (contract-call? .pool-borrow
    init
    .lp-usda
    .usda
    u6
    usda-supply-cap
    usda-borrow-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .usda)

(try!
  (contract-call? .pool-borrow
    init
    .lp-xusd
    .xusd
    u6
    xusd-supply-cap
    xusd-supply-cap
    .oracle
    .interest-rate-strategy-default
  )
)

(contract-call? .pool-borrow add-asset .xusd)

(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .ststx
    true
    u80000000
    u90000000
    u5000000
  )
)
(try! 
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .wstx
    true
    u80000000
    u90000000
    u5000000
  )
)
(try!
  (contract-call? .pool-borrow set-usage-as-collateral-enabled
    .sbtc
    true
    u80000000
    u90000000
    u5000000
  )
)
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .diko
;;     true
;;     u60000000
;;     u90000000
;;     u5000000
;;   )
;; )
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .usda
;;     true
;;     u70000000
;;     u90000000
;;     u5000000
;;   )
;; )
;; (try! 
;;   (contract-call? .pool-borrow set-usage-as-collateral-enabled
;;     .xusd
;;     true
;;     u80000000
;;     u90000000
;;     u5000000
;;   )
;; )

;; (contract-call? .pool-borrow set-borrowing-enabled .ststx true)
(contract-call? .pool-borrow set-borrowing-enabled .wstx true)
(contract-call? .pool-borrow set-borrowing-enabled .sbtc true)
(contract-call? .pool-borrow set-borrowing-enabled .diko true)
(contract-call? .pool-borrow set-borrowing-enabled .usda true)
(contract-call? .pool-borrow set-borrowing-enabled .xusd true)

(contract-call? .pool-borrow add-isolated-asset .ststx u1000000000000000)

(contract-call? .pool-borrow set-borroweable-isolated .xusd)
(contract-call? .pool-borrow set-borroweable-isolated .usda)
(contract-call? .pool-borrow set-borroweable-isolated .wstx)

(contract-call? .oracle set-price .ststx u163000000)
(contract-call? .oracle set-price .wstx u160000000)
(contract-call? .oracle set-price .sbtc u4000000000000)
(contract-call? .oracle set-price .diko u40000000)
(contract-call? .oracle set-price .usda u90000000)
(contract-call? .oracle set-price .xusd u100000000)

(contract-call? .pool-reserve-data set-base-variable-borrow-rate .ststx u0)
(contract-call? .pool-reserve-data set-base-variable-borrow-rate .wstx u0)
(contract-call? .pool-reserve-data set-base-variable-borrow-rate .sbtc u0)
(contract-call? .pool-reserve-data set-base-variable-borrow-rate .diko u0)
(contract-call? .pool-reserve-data set-base-variable-borrow-rate .usda u0)
(contract-call? .pool-reserve-data set-base-variable-borrow-rate .xusd u0)

(contract-call? .pool-reserve-data set-variable-rate-slope-1 .ststx u4000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-1 .wstx u4000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-1 .sbtc u4000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-1 .diko u4000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-1 .usda u4000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-1 .xusd u4000000)

(contract-call? .pool-reserve-data set-variable-rate-slope-2 .ststx u300000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-2 .wstx u300000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-2 .sbtc u300000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-2 .diko u300000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-2 .usda u300000000)
(contract-call? .pool-reserve-data set-variable-rate-slope-2 .xusd u300000000)

(contract-call? .pool-reserve-data set-optimal-utilization-rate .ststx u80000000)
(contract-call? .pool-reserve-data set-optimal-utilization-rate .wstx u80000000)
(contract-call? .pool-reserve-data set-optimal-utilization-rate .sbtc u80000000)
(contract-call? .pool-reserve-data set-optimal-utilization-rate .diko u80000000)
(contract-call? .pool-reserve-data set-optimal-utilization-rate .usda u80000000)
(contract-call? .pool-reserve-data set-optimal-utilization-rate .xusd u80000000)

(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .ststx u50000000)
(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .wstx u50000000)
(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .sbtc u50000000)
(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .diko u50000000)
(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .usda u50000000)
(contract-call? .pool-reserve-data set-liquidation-close-factor-percent .xusd u50000000)

(contract-call? .pool-0-reserve set-flashloan-fee-total .ststx u35)
(contract-call? .pool-0-reserve set-flashloan-fee-total .sbtc u35)

(contract-call? .pool-0-reserve set-flashloan-fee-protocol .ststx u3000)
(contract-call? .pool-0-reserve set-flashloan-fee-protocol .sbtc u3000)

(contract-call? .pool-reserve-data set-origination-fee-prc .ststx u25)
(contract-call? .pool-reserve-data set-origination-fee-prc .wstx u25)
(contract-call? .pool-reserve-data set-origination-fee-prc .sbtc u25)
(contract-call? .pool-reserve-data set-origination-fee-prc .diko u25)
(contract-call? .pool-reserve-data set-origination-fee-prc .usda u25)
(contract-call? .pool-reserve-data set-origination-fee-prc .xusd u25)

(contract-call? .pool-reserve-data set-reserve-factor .ststx u10000000)
(contract-call? .pool-reserve-data set-reserve-factor .wstx u10000000)
(contract-call? .pool-reserve-data set-reserve-factor .sbtc u10000000)
(contract-call? .pool-reserve-data set-reserve-factor .diko u10000000)
(contract-call? .pool-reserve-data set-reserve-factor .usda u10000000)
(contract-call? .pool-reserve-data set-reserve-factor .xusd u10000000)


(contract-call? .pool-borrow supply
  .lp-diko
  .pool-0-reserve
  .diko
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-sbtc
  .pool-0-reserve
  .sbtc
  u100000000000
  tx-sender
)


(contract-call? .pool-borrow supply
  .lp-ststx
  .pool-0-reserve
  .ststx
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-xusd
  .pool-0-reserve
  .xusd
  u100000000000
  tx-sender
)

(contract-call? .pool-borrow supply
  .lp-usda
  .pool-0-reserve
  .usda
  u100000000000
  tx-sender
)
