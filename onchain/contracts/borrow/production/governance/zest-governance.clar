(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-data-var emergency-shutdown bool false)

;; emergency execution
(define-data-var executive-team-sunset-height uint (+ burn-block-height u13140)) ;; ~3 month from deploy time
(define-data-var last-emergency-shutdown uint u0)
(define-data-var executive-toggle-period uint u100)

(define-map executive-team principal bool)
(define-map executive-action-signals {id: uint, team-member: principal} bool)


(define-data-var last-shutdown-proposal-id uint u0)
(define-map last-shutdown-proposal-executed uint bool)
(define-map executive-action-signal-count uint uint)

(define-data-var executive-signals-required uint u1) ;; signals required for an executive action.

;; signers team
(define-data-var signer-signals-required uint u1)

(define-map signer-team principal bool)
(define-map signer-action-signals {proposal: principal, team-member: principal} bool)
(define-map signer-action-signal-count principal uint)


;; proposal data
(define-map signer-proposals
	principal
	{
		votes-for: uint,
		votes-against: uint,
		start-block-height: uint,
		end-block-height: uint,
		concluded: bool,
		passed: bool,
		proposer: principal
	}
)

(define-map executive-proposals
	principal
	{
		votes-for: uint,
		votes-against: uint,
		start-block-height: uint,
		end-block-height: uint,
		concluded: bool,
		passed: bool,
		proposer: principal
	}
)

(define-data-var proposal-cool-down-period uint u144) ;; ~1 day

(define-map executed-proposals principal uint)

;; deployment executive
(define-data-var executive principal tx-sender)


(define-constant err-unauthorised (err u3000))
(define-constant err-not-emergency-team-member (err u3001))
(define-constant err-proposal-already-executed (err u3004))
(define-constant err-proposal-already-exists (err u3005))
(define-constant err-not-executive-team-member (err u3006))
(define-constant err-not-signer-team-member (err u3007))
(define-constant err-already-executed (err u3008))
(define-constant err-end-block-height-not-reached (err u3009))
(define-constant err-unknown-proposal (err u3010))
(define-constant err-proposal-inactive (err u3011))
(define-constant err-proposal-cool-down-period-not-reached (err u3012))
(define-constant err-executive-toggle-period-not-reached (err u3013))
(define-constant err-proposal-already-concluded (err u3014))
(define-constant err-start-block-height-in-past (err u3015))

;; --- Authorisation check
(define-public (is-dao)
	(ok (asserts! (is-eq tx-sender .zest-governance) err-unauthorised))
)

(define-read-only (get-emergency-shutdown)
	(var-get emergency-shutdown)
)

;; --- DAO functions
(define-read-only (executed-at (proposal <proposal-trait>))
	(map-get? executed-proposals (contract-of proposal))
)

;; --- Proposal functions
(define-public (add-signer-proposal (proposal <proposal-trait>) (data {start-block-height: uint, end-block-height: uint, proposer: principal}))
	(begin
		(asserts! (is-signer-team-member tx-sender) err-not-signer-team-member)
		(asserts! (is-none (executed-at proposal)) err-proposal-already-executed)
		(asserts! (> (get start-block-height data) burn-block-height) err-start-block-height-in-past)
		(asserts! (> (- (get end-block-height data) (var-get proposal-cool-down-period)) burn-block-height) err-proposal-cool-down-period-not-reached)
		(print {event: "propose", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-insert signer-proposals (contract-of proposal) (merge
			{
				votes-for: u0,
				votes-against: u0,
				concluded: false,
				passed: false,
			}
			data)) err-proposal-already-exists))
	)
)


(define-public (add-executive-proposal)
	(let (
		(last-id (var-get last-shutdown-proposal-id))
		(next-proposal-id (+ last-id u1))
	)
		(asserts! (is-executive-team-member tx-sender) err-not-executive-team-member)
		;; check if last-id was executed
		(asserts! (is-none (map-get? last-shutdown-proposal-executed last-id)) err-proposal-already-executed)
		(print {event: "propose", proposal-id: next-proposal-id, proposer: tx-sender})
		(map-set last-shutdown-proposal-executed next-proposal-id false)
		(ok (var-set last-shutdown-proposal-id next-proposal-id))
	)
)

(define-public (execute-signer-proposal (proposal <proposal-trait>) (sender principal))
	(let
		(
			(proposal-data (unwrap! (map-get? signer-proposals (contract-of proposal)) err-unknown-proposal))
		)
		(asserts! (not (get concluded proposal-data)) err-proposal-already-concluded)
		(asserts! (>= burn-block-height (get end-block-height proposal-data)) err-end-block-height-not-reached)

		(map-set signer-proposals (contract-of proposal) (merge proposal-data {concluded: true, passed: true}))
		(print {event: "conclude", proposal: proposal, passed: true})
		(as-contract (try! (contract-call? proposal execute tx-sender)))
		(ok true)
	)
)


;; --- Emergency Execution functions
;; --- Internal DAO functions

(define-public (set-executive-team-member (who principal) (member bool))
	(begin
		(try! (is-dao))
		(ok (map-set executive-team who member))
	)
)

(define-public (set-executive-signals-required (new-requirement uint))
	(begin
		(try! (is-dao))
		(ok (var-set executive-signals-required new-requirement))
	)
)

(define-public (set-executive-toggle-period (new-period uint))
	(begin
		(try! (is-dao))
		(ok (var-set executive-toggle-period new-period))
	)
)

;; --- Public functions

(define-read-only (is-executive-team-member (who principal))
	(default-to false (map-get? executive-team who))
)

(define-read-only (has-signalled-executive (id uint) (who principal))
	(default-to false (map-get? executive-action-signals {id: id, team-member: who}))
)

(define-read-only (get-executive-signals-required)
	(var-get executive-signals-required)
)

(define-read-only (get-executive-signals (id uint))
	(default-to u0 (map-get? executive-action-signal-count id))
)


(define-public (executive-action)
	(let
		(
			(proposal-id (var-get last-shutdown-proposal-id))
			(signals (+ (get-executive-signals proposal-id) (if (has-signalled-executive proposal-id contract-caller) u0 u1)))
		)
		(asserts! (is-executive-team-member contract-caller) err-not-executive-team-member)
		;; the first time, the shutdown can be done any time, but the next time it must be after the toggle period
		(asserts! (or (> (- burn-block-height (var-get last-emergency-shutdown)) (var-get executive-toggle-period)) (is-eq (var-get last-emergency-shutdown) u0)) err-executive-toggle-period-not-reached)
		(and (>= signals (var-get executive-signals-required))
			(begin
				(print {event: "execute", proposal-id: proposal-id, caller: contract-caller})
				(map-set last-shutdown-proposal-executed proposal-id true)
				(var-set emergency-shutdown (not (var-get emergency-shutdown)))
				;; if emergency is not enabled, set the last executive on block to the current burn block height
				(and (not (var-get emergency-shutdown))
					(var-set last-emergency-shutdown burn-block-height)
				)
			)
		)
		(map-set executive-action-signals {id: proposal-id, team-member: contract-caller} true)
		(map-set executive-action-signal-count proposal-id signals)
		(ok signals)
	)
)

;; --- Signer functions
;; --- Internal DAO functions
(define-public (set-signer-team-member (who principal) (member bool))
	(begin
		(try! (is-dao))
		(ok (map-set signer-team who member))
	)
)

(define-public (set-signer-signals-required (new-requirement uint))
	(begin
		(try! (is-dao))
		(ok (var-set signer-signals-required new-requirement))
	)
)

;; --- Public functions

(define-read-only (is-signer-team-member (who principal))
	(default-to false (map-get? signer-team who))
)

(define-read-only (has-signalled-signer (proposal principal) (who principal))
	(default-to false (map-get? signer-action-signals {proposal: proposal, team-member: who}))
)

(define-read-only (get-signer-signals-required)
	(var-get signer-signals-required)
)

(define-read-only (get-signer-signals (proposal principal))
	(default-to u0 (map-get? signer-action-signal-count proposal))
)

(define-read-only (get-signer-proposal-data (proposal principal))
	(map-get? signer-proposals proposal)
)

(define-public (signer-action (proposal <proposal-trait>))
	(let
		(
			(proposal-principal (contract-of proposal))
			(proposal-data (unwrap! (map-get? signer-proposals proposal-principal) err-unknown-proposal))
			(signals (+ (get-signer-signals proposal-principal) (if (has-signalled-signer proposal-principal contract-caller) u0 u1)))
		)
		(asserts! (is-signer-team-member contract-caller) err-not-signer-team-member)
		(asserts! (>= burn-block-height (get start-block-height proposal-data)) err-proposal-inactive)

		(and (>= signals (var-get signer-signals-required))
			(try! (execute-signer-proposal proposal contract-caller))
		)
		(map-set signer-action-signals {proposal: proposal-principal, team-member: contract-caller} true)
		(map-set signer-action-signal-count proposal-principal signals)
		(ok signals)
	)
)



;; --- Bootstrap
(define-public (construct (proposal <proposal-trait>))
	(let ((sender tx-sender))
		(asserts! (is-eq sender (var-get executive)) err-unauthorised)
		(var-set executive (as-contract tx-sender))
		(as-contract (contract-call? proposal execute sender))
	)
)