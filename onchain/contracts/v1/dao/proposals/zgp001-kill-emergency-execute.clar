;; Title: EDP002 Kill Emergency Execute
;; Author: Marvin Janssen
;; Synopsis:
;; This proposal disables extension "ZGE004 Emergency Execute".
;; Description:
;; If this proposal passes, extension "ZGE004 Emergency Execute" is immediately
;; disabled.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(contract-call? .executor-dao set-extension .zge004-emergency-execute false)
)
