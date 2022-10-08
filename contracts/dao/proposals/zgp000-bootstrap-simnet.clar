;; Title: EDP000 Bootstrap
;; Author: Marvin Janssen
;; Synopsis:
;; Boot proposal that sets the governance token, DAO parameters, and extensions, and
;; mints the initial governance tokens.
;; Description:
;; Mints the initial supply of governance tokens and enables the the following 
;; extensions: "ZGE000 Governance Token", "ZGE001 Proposal Voting",
;; "ZGE002 Proposal Submission", "ZGE003 Emergency Proposals",
;; "ZGE004 Emergency Execute".

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .executor-dao set-extensions
			(list
				{extension: .zge000-governance-token, enabled: true}
				{extension: .zge001-proposal-voting, enabled: true}
				{extension: .zge002-emergency-proposal, enabled: true}
				{extension: .zge003-emergency-execute, enabled: true}
				{extension: .zge004-onboard-borrower, enabled: true}
				{extension: .payment-fixed, enabled: true}
				{extension: .rewards-calc, enabled: true}
			)
		))

		;; Set emergency team members.
		(try! (contract-call? .zge002-emergency-proposals set-emergency-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
		(try! (contract-call? .zge002-emergency-proposals set-emergency-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))

		;; Set executive team members.
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true))
		(try! (contract-call? .zge003-emergency-execute set-signals-required u3)) ;; signal from 3 out of 4 team members requied.

		;; Mint initial token supply.
		(try! (contract-call? .zge000-governance-token edg-mint-many
			(list
				{amount: u10000000000, recipient: sender}
        {amount: u2100000000000000, recipient: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC}
			)
		))

		(print "Zest has risen.")
		(ok true)
	)
)
