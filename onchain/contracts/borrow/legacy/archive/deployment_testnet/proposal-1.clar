(impl-trait .proposal-trait.proposal-trait)


(define-public (execute (sender principal))
	(begin
		;; set signer team members
		(try! (contract-call? .pool-reserve-data set-optimal-utilization-rate .ststx u50000000))

		(ok true)
	)
)
