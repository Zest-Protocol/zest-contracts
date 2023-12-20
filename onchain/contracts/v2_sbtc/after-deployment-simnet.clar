(try! (contract-call? .executor-dao construct .zgp000-bootstrap))

(try! (contract-call? .stSTX mint u1000000000000000 'ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ))
(try! (contract-call? .stSTX mint u1000000000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
(try! (contract-call? .stSTX mint u1000000000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
;; (try! (contract-call? .stSTX mint u10000000000 '))