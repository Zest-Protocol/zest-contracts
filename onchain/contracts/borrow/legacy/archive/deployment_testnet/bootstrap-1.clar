(impl-trait .proposal-trait.proposal-trait)


(define-constant wallet_1 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant wallet_2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
(define-constant wallet_3 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)
(define-constant wallet_4 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND)
(define-constant wallet_5 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB)
(define-constant wallet_6 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0)
(define-constant wallet_7 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ)

(define-public (execute (sender principal))
	(begin
		;; set signer team members
		(try! (contract-call? .zest-governance set-signer-team-member wallet_1 true))
		(try! (contract-call? .zest-governance set-signer-team-member wallet_2 true))
		(try! (contract-call? .zest-governance set-signer-team-member wallet_3 true))
		(try! (contract-call? .zest-governance set-signer-team-member wallet_4 true))

		(try! (contract-call? .zest-governance set-signer-signals-required u3))


		;; set executive team members
		(try! (contract-call? .zest-governance set-executive-team-member wallet_5 true))
		(try! (contract-call? .zest-governance set-executive-team-member wallet_6 true))
		(try! (contract-call? .zest-governance set-executive-team-member wallet_7 true))

		(try! (contract-call? .zest-governance set-executive-signals-required u3))


		(ok true)
	)
)
