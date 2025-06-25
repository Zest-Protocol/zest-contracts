(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-data-var emergency-shutdown bool false)

;; emergency execution
;; (define-data-var executive-team-sunset-height uint (+ burn-block-height u13140)) ;; ~3 month from deploy time
(define-data-var last-emergency-shutdown uint u0)
(define-data-var executive-toggle-period uint u100)

(define-map executive-team principal bool)
(define-map executive-action-signals {id: uint, team-member: principal} bool)


(define-data-var last-shutdown-proposal-id uint u0)
(define-data-var execution-in-process bool false)
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
		start-block-height: uint,
		end-block-height: uint,
		concluded: bool,
		passed: bool,
		proposer: principal
	}
)

(define-data-var proposal-cool-down-period uint u144) ;; ~1 day

;; deployment executive
(define-data-var executive principal tx-sender)


(define-constant err-unauthorised (err u3000))
(define-constant err-proposal-already-exists (err u3005))
(define-constant err-not-executive-team-member (err u3006))
(define-constant err-not-signer-team-member (err u3007))

(define-constant err-end-block-height-not-reached (err u3009))
(define-constant err-unknown-proposal (err u3010))
(define-constant err-proposal-inactive (err u3011))
(define-constant err-proposal-cool-down-period-not-reached (err u3012))
(define-constant err-executive-toggle-period-not-reached (err u3013))
(define-constant err-proposal-already-concluded (err u3014))
(define-constant err-start-block-height-in-past (err u3015))
(define-constant err-execution-in-process (err u3016))
(define-constant err-execution-not-in-process (err u3017))
(define-constant err-already-signed (err u3018))

;; --- Authorisation check
(define-public (is-dao)
	(ok (asserts! (is-eq tx-sender .zest-governance) err-unauthorised))
)

(define-read-only (get-emergency-shutdown)
	(var-get emergency-shutdown)
)

(define-public (set-proposal-cool-down-period (new-period uint))
	(begin
		(try! (is-dao))
		(ok (var-set proposal-cool-down-period new-period))
	)
)

;; --- Proposal functions
(define-public (add-signer-proposal (proposal <proposal-trait>) (data {start-block-height: uint, end-block-height: uint, proposer: principal}))
	(begin
		(asserts! (is-signer-team-member tx-sender) err-not-signer-team-member)
		(asserts! (> (get start-block-height data) burn-block-height) err-start-block-height-in-past)
		(asserts! (> (- (get end-block-height data) (var-get proposal-cool-down-period)) burn-block-height) err-proposal-cool-down-period-not-reached)
		(print {event: "propose", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-insert signer-proposals (contract-of proposal) (merge
			{
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
		(asserts! (not (var-get execution-in-process)) err-execution-in-process)
		;; check if the last emergency shutdown was more than the toggle period ago
		(asserts! (or (> (- burn-block-height (var-get last-emergency-shutdown)) (var-get executive-toggle-period)) (is-eq (var-get last-emergency-shutdown) u0)) err-executive-toggle-period-not-reached)
		(print {event: "propose", proposal-id: next-proposal-id, proposer: tx-sender})
		(var-set execution-in-process true)
		(ok (var-set last-shutdown-proposal-id next-proposal-id))
	)
)

(define-private (execute-signer-proposal (proposal <proposal-trait>) (sender principal))
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

(define-read-only (get-executive-toggle-period)
	(var-get executive-toggle-period)
)

(define-read-only (get-last-emergency-shutdown)
	(var-get last-emergency-shutdown)
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
			(signals (+ (get-executive-signals proposal-id) u1))
		)
		(asserts! (is-executive-team-member contract-caller) err-not-executive-team-member)
		(asserts! (var-get execution-in-process) err-execution-not-in-process)
		(asserts! (not (has-signalled-executive proposal-id contract-caller)) err-already-signed)
		;; the first time, the shutdown can be done any time, but the next time it must be after the toggle period
		(and (>= signals (var-get executive-signals-required))
			(begin
				(print {event: "execute", proposal-id: proposal-id, caller: contract-caller})
				(var-set execution-in-process false)
				(var-set emergency-shutdown (not (var-get emergency-shutdown)))
				;; if emergency is not enabled, set the last executive on block to the current burn block height
				(and (var-get emergency-shutdown)
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
			(signals (+ (get-signer-signals proposal-principal) u1))
		)
		(asserts! (is-signer-team-member contract-caller) err-not-signer-team-member)
		(asserts! (not (has-signalled-signer proposal-principal contract-caller)) err-already-signed)
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