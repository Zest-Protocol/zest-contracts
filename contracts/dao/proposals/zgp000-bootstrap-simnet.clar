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
    
    ;; (try! (contract-call? .zest-reward-dist add-contract .loan-v1-0))
    ;; (try! (contract-call? .zest-reward-dist add-contract .pool-v1-0))
    ;; (try! (contract-call? .zest-reward-dist add-contract .payment-fixed))
    ;; (try! (contract-call? .lp-token add-contract .loan-v1-0))
    ;; (try! (contract-call? .lp-token add-contract .pool-v1-0))
    ;; (try! (contract-call? .lp-token add-contract .payment-fixed))
    ;; (try! (contract-call? .lp-token add-contract .supplier-interface))
    ;; (try! (contract-call? .payment-fixed add-contract .loan-v1-0))
    ;; (try! (contract-call? .liquidity-vault-v1-0 add-contract .lp-token))
    ;; (try! (contract-call? .liquidity-vault-v1-0 add-contract .pool-v1-0))
    ;; (try! (contract-call? .cp-token add-contract .payment-fixed))
    ;; (try! (contract-call? .cp-token add-contract .pool-v1-0))
    ;; (try! (contract-call? .cp-token add-contract .cover-pool-v1-0))
    ;; (try! (contract-call? .rewards-calc add-contract .pool-v1-0))
    ;; (try! (contract-call? .rewards-calc add-contract .cover-pool-v1-0))
    ;; (try! (contract-call? .funding-vault add-contract .loan-v1-0))
    ;; (try! (contract-call? .coll-vault add-contract .loan-v1-0))
    ;; (try! (contract-call? .loan-v1-0 set-pool-contract .pool-v1-0))
    ;; (try! (contract-call? .loan-v1-0 add-borrower 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP))
    ;; (try! (contract-call? .cover-pool-v1-0 set-pool-contract .pool-v1-0))
    ;; devnet
    ;; (try! (contract-call? .loan-v1-0 set-contract-owner 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
    ;; testnet
    ;; (try! (contract-call? .loan-v1-0 set-contract-owner 'ST24EA7AG3068VF6X0ZB68CQ2HNEJWPZN6MXGZTBM))

    ;; (try! (contract-call? .rewards-calc set-multiplier u1 u10000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u2 u15000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u3 u20000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u4 u25000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u5 u30000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u6 u35000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u7 u40000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u8 u45000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u9 u50000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u10 u55000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u11 u60000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u12 u65000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u13 u70000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u14 u75000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u15 u80000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u16 u85000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u17 u90000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u18 u95000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u19 u105000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u20 u110000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u21 u115000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u22 u120000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u23 u125000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u24 u130000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u25 u135000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u26 u140000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u27 u145000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u28 u150000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u29 u155000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u30 u160000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u31 u165000))
    ;; (try! (contract-call? .rewards-calc set-multiplier u32 u170000))

		(print "Zest has risen.")
		(ok true)
	)
)
