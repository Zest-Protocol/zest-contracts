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
		(try! (contract-call? .zge002-emergency-proposals set-emergency-team-member 'STC6G8DC2A0V58A6399M22C06BF4EK5JZSQW7BWP true))
		(try! (contract-call? .zge002-emergency-proposals set-emergency-team-member 'ST58JQJZEHBJTGPHVES8FN448T98QV2VF9JWQ31B true))

		;; Set executive team members.
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'STC6G8DC2A0V58A6399M22C06BF4EK5JZSQW7BWP true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST58JQJZEHBJTGPHVES8FN448T98QV2VF9JWQ31B true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST24EA7AG3068VF6X0ZB68CQ2HNEJWPZN6MXGZTBM true))
		(try! (contract-call? .zge003-emergency-execute set-executive-team-member 'ST2GYC2YYAMQ3SJ6DXFFVGFN54DBC5A7DGN7ZG60Y true))
		(try! (contract-call? .zge003-emergency-execute set-signals-required u3)) ;; signal from 3 out of 4 team members requied.

		;; Mint initial token supply.
		(try! (contract-call? .zge000-governance-token edg-mint-many
			(list
				{amount: u1000000000, recipient: sender}
        {amount: u2100000000, recipient: 'STC6G8DC2A0V58A6399M22C06BF4EK5JZSQW7BWP}
			)
		))

		(print "Zest has risen.")
		(ok true)
	)
)
