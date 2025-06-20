(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-data-var emergency-shutdown bool false)

;; emergency execution
(define-data-var executive-team-sunset-height uint (+ burn-block-height u13140)) ;; ~3 month from deploy time
(define-data-var last-emergency-shutdown uint u0)
(define-data-var executive-toggle-period uint u100)

(define-map executive-team principal bool)
(define-map executive-action-signals {proposal: principal, team-member: principal} bool)
(define-map executive-action-signal-count principal uint)

(define-data-var executive-signals-required uint u1) ;; signals required for an executive action.

;; signers team
(define-data-var signer-team-sunset-height uint (+ burn-block-height u13140)) ;; ~3 month from deploy time
(define-data-var signer-signals-required uint u1)

(define-map signer-team principal bool)
(define-map signer-action-signals {proposal: principal, team-member: principal} bool)
(define-map signer-action-signal-count principal uint)


;; proposal data
(define-map proposals
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
(define-constant err-sunset-height-reached (err u3002))
(define-constant err-sunset-height-in-past (err u3003))
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
(define-public (add-proposal (proposal <proposal-trait>) (data {start-block-height: uint, end-block-height: uint, proposer: principal}))
	(begin
		(try! (is-dao))
		(asserts! (is-none (executed-at proposal)) err-proposal-already-executed)
		(print {event: "propose", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-insert proposals (contract-of proposal) (merge {votes-for: u0, votes-against: u0, concluded: false, passed: false} data)) err-proposal-already-exists))
	)
)

(define-public (execute (proposal <proposal-trait>) (sender principal))
	(begin
		(try! (is-dao))
		(asserts! (map-insert executed-proposals (contract-of proposal) burn-block-height) err-already-executed)
		(print {event: "execute", proposal: proposal})
		(as-contract (contract-call? proposal execute sender))
	)
)

;; --- Emergency Execution functions
;; --- Internal DAO functions

(define-public (set-executive-team-sunset-height (height uint))
	(begin
		(try! (is-dao))
		(asserts! (> height burn-block-height) err-sunset-height-in-past)
		(ok (var-set executive-team-sunset-height height))
	)
)

(define-public (set-executive-team-member (who principal) (member bool))
	(begin
		(try! (is-dao))
		(ok (map-set executive-team who member))
	)
)

(define-public (set-signals-required (new-requirement uint))
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

(define-read-only (has-signalled-executive (proposal principal) (who principal))
	(default-to false (map-get? executive-action-signals {proposal: proposal, team-member: who}))
)

(define-read-only (get-executive-signals-required)
	(var-get executive-signals-required)
)

(define-read-only (get-executive-signals (proposal principal))
	(default-to u0 (map-get? executive-action-signal-count proposal))
)


(define-public (executive-action (proposal <proposal-trait>))
	(let
		(
			(proposal-principal (contract-of proposal))
			(signals (+ (get-executive-signals proposal-principal) (if (has-signalled-executive proposal-principal contract-caller) u0 u1)))
		)
		(asserts! (is-executive-team-member contract-caller) err-not-executive-team-member)
		(asserts! (< burn-block-height (var-get executive-team-sunset-height)) err-sunset-height-reached)
		(asserts! (> (- burn-block-height (var-get last-emergency-shutdown)) (var-get executive-toggle-period)) err-executive-toggle-period-not-reached)
		(and (>= signals (var-get executive-signals-required))
			(begin
				(var-set emergency-shutdown (not (var-get emergency-shutdown)))
				;; if emergency is not enabled, set the last executive on block to the current burn block height
				(and (not (var-get emergency-shutdown))
					(var-set last-emergency-shutdown burn-block-height)
				)
			)
		)
		(map-set executive-action-signals {proposal: proposal-principal, team-member: contract-caller} true)
		(map-set executive-action-signal-count proposal-principal signals)
		(ok signals)
	)
)

;; --- Signer functions
;; --- Internal DAO functions
(define-public (set-signer-team-sunset-height (height uint))
	(begin
		(try! (is-dao))
		(asserts! (> height burn-block-height) err-sunset-height-in-past)
		(ok (var-set signer-team-sunset-height height))
	)
)

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

(define-public (signer-action (proposal <proposal-trait>))
	(let
		(
			(proposal-principal (contract-of proposal))
			(proposal-data (unwrap! (map-get? proposals proposal-principal) err-unknown-proposal))
			(signals (+ (get-signer-signals proposal-principal) (if (has-signalled-signer proposal-principal contract-caller) u0 u1)))
		)
		(asserts! (is-signer-team-member contract-caller) err-not-signer-team-member)
		(asserts! (>= burn-block-height (get start-block-height proposal-data)) err-proposal-inactive)
		(asserts! (< (- (get end-block-height proposal-data) (var-get proposal-cool-down-period)) burn-block-height) err-proposal-cool-down-period-not-reached)
		(asserts! (>= burn-block-height (get end-block-height proposal-data)) err-end-block-height-not-reached)
		(asserts! (< burn-block-height (var-get signer-team-sunset-height)) err-sunset-height-reached)
		(and (>= signals (var-get signer-signals-required))
			(try! (execute proposal contract-caller))
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
		(as-contract (execute proposal sender))
	)
)