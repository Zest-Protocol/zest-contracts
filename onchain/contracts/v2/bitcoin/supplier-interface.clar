(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait sip-010 .sip-010-trait.sip-010-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait fv .funding-vault-trait.funding-vault-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)
(use-trait sc .supplier-controller-trait.supplier-controller-trait)

(use-trait payment .payment-trait.payment-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(define-data-var owner principal tx-sender)

;; tx-id -> tx-height
(define-map escrowed-tx (buff 32) { height: uint, supplier-id: uint, token-id: uint, loan-id: uint, finalized: bool })

;; @desc Escrows funds using the magic-protocol
;; @param block: a tuple containing `header` (the Bitcoin block header) and the `height` (Stacks height)
;; where the BTC tx was confirmed.
;; @param prev-blocks: because Clarity contracts can't get Bitcoin headers when there is no Stacks block,
;; this param allows users to specify the chain of block headers going back to the block where the
;; BTC tx was confirmed.
;; @param tx: the hex data of the BTC tx
;; @param proof: a merkle proof to validate inclusion of this tx in the BTC block
;; @param output-index: the index of the HTLC output in the BTC tx
;; @param sender: The swapper's public key used in the HTLC
;; @param recipient: The supplier's public key used in the HTLC
;; @param expiration-buff: A 4-byte integer the indicated the expiration of the HTLC
;; @param hash: a hash of the `preimage` used in this swap
;; @param swapper-buff: a 4-byte integer that indicates the `swapper-id`
;; @param supplier-id: the supplier used in this swap
;; @param min-to-receive: minimum receivable calculated off-chain to avoid the supplier front-run the swap by adjusting fees
;; @returns (response boolean uint)
(define-public (send-funds
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (sender (buff 33))
  (recipient (buff 33))
  (expiration-buff (buff 4))
  (hash (buff 32))
  (swapper-buff (buff 4))
  (supplier-id uint)
  (min-to-receive uint)
  (token-id uint)
  (loan-id uint)
  )
  (let (
    (tx-id (contract-call? .clarity-bitcoin get-txid tx))
  )
    (asserts! (map-insert escrowed-tx tx-id { height: (get height block), supplier-id: supplier-id, token-id: token-id, loan-id: loan-id, finalized: false }) ERR_TX_ESCROWED)
    (contract-call? .magic-protocol escrow-swap block prev-blocks tx proof output-index sender recipient expiration-buff hash swapper-buff supplier-id min-to-receive)
  )
)

(define-public (send-funds-finalize
  (txid (buff 32))
  (preimage (buff 128))
  (sc <sc>))
  (let (
    (supplier-id (unwrap! (contract-call? .magic-protocol get-supplier-id-by-controller (contract-of sc)) ERR_INVALID_SUPPLIER))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST)))
    (asserts! (is-eq supplier-id (get supplier-id params)) ERR_INVALID_SUPPLIER)

    (try! (contract-call? sc finalize-swap txid preimage))
    (map-set escrowed-tx txid (merge params { finalized: true }))
    (ok true)
  )
)

;; @desc Sends funds directly to the Liquidity Pool in case contingency plan is activated
;; @param factor: number of cycles to be committed
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param amount: amount being sent from the protocol
;; @param rewards-calc: contract used to calculate zest rewards
;; @returns (response uint uint)
(define-public (send-funds-xbtc
    (factor uint)
    (lp-token <sip-010>)
    (token-id uint)
    (zp-token <dtc>)
    (lv <lv>)
    (xbtc-ft <ft>)
    (amount uint)
    (rewards-calc <rewards-calc>))
  (let (
    (height burn-block-height)
    (globals (contract-call? .globals get-globals)))
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (try! (contract-call? .pool-v2-0 send-funds lp-token token-id lv xbtc-ft amount tx-sender))
    (ok amount)
  )
)

;; @desc Complete the escrow in magic-protocol to commit funds to the liquidity pool
;; @param txid: the txid of the BTC tx used for this inbound swap
;; @param preimage: the preimage that hashes to the swap's `hash`
;; @param factor: number of cycles to be committed
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param rewards-calc: contract used to calculate zest rewards
;; @returns (response uint uint)
(define-public (send-funds-to-pool
  (txid (buff 32))
  (lp-token <sip-010>)
  (lv <lv>)
  (xbtc-ft <ft>)
  (rewards-calc <rewards-calc>) )
  (let (
    (swap (try! (contract-call? .magic-protocol get-full-inbound txid)))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper swap))
    (sats (get sats swap)))
    (asserts! (get finalized params) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-v2-0 send-funds lp-token (get token-id params) lv xbtc-ft sats tx-sender))

    (map-delete escrowed-tx txid)
    (ok swap)
  )
)

(define-public (send-funds-finalize-completed
  (txid (buff 32))
  (factor uint)
  (lp-token <sip-010>)
  (token-id uint)
  (zp-token <dtc>)
  (lv <lv>)
  (xbtc-ft <ft>)
  (rewards-calc <rewards-calc>))
  (let (
    (swap (try! (finalize-completed txid xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (try! (contract-call? .pool-v2-0 send-funds lp-token (get token-id params) lv xbtc-ft (get sats swap) tx-sender))
    (map-delete escrowed-tx txid)
    (ok (get sats swap))))

(define-public (make-payment-verify
  (txid (buff 32))
  (preimage (buff 128))
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-priv txid preimage xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-payment-verify (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))


(define-public (make-payment-verify-completed
  (txid (buff 32))
  (loan-id uint)
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-completed txid xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-payment-verify (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))

;; @desc Complete the escrow in magic-protocol to make a loan repayment
;; @param txid: the txid of the BTC tx used for this inbound swap
;; @param preimage: the preimage that hashes to the swap's `hash`
;; @param loan-id: id of the loan to which the payment is made
;; @param payment: contract for completing payments
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: contract of the token accounting for cover pool zest rewards
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (make-payment
  (txid (buff 32))
  (preimage (buff 128))
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-priv txid preimage xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-payment (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))

(define-public (make-payment-completed
  (txid (buff 32))
  (loan-id uint)
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-completed txid xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-payment (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))

;; @desc Complete the escrow in magic-protocol to make a residual payment for rollover
;; @param txid: the txid of the BTC tx used for this inbound swap
;; @param preimage: the preimage that hashes to the swap's `hash`
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (make-residual-payment
  (txid (buff 32))
  (preimage (buff 128))
  (lp-token <sip-010>)
  (lv <lv>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-priv txid preimage xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .pool-v2-0 make-residual-payment (get loan-id params) lp-token (get token-id params) lv (get sats swap) xbtc-ft tx-sender)))))

(define-public (make-residual-payment-completed
  (txid (buff 32))
  (lp-token <sip-010>)
  (lv <lv>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-completed txid xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .pool-v2-0 make-residual-payment (get loan-id params) lp-token (get token-id params) lv (get sats swap) xbtc-ft tx-sender)))))

;; @desc Complete the escrow in magic-protocol to make a full repayment of the loan
;; @param txid: the txid of the BTC tx used for this inbound swap
;; @param preimage: the preimage that hashes to the swap's `hash`
;; @param loan-id: id of the loan to which the payment is made
;; @param payment: contract for completing payments
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: contract of the token accounting for cover pool zest rewards
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (make-full-payment
  (txid (buff 32))
  (preimage (buff 128))
  (loan-id uint)
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-priv txid preimage xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-full-payment (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))

(define-public (make-full-payment-completed
  (txid (buff 32))
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (swap (try! (finalize-completed txid xbtc-ft)))
    (fee (get fee swap))
    (xbtc (get xbtc swap))
    (hash (get hash swap))
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (swapper (get swapper-principal swap)))
    (map-delete escrowed-tx txid)
    (ok (try! (contract-call? .loan-v1-0 make-full-payment (get loan-id params) (get height params) payment lp-token lv cp-token cp-rewards-token zp-token swap-router (get sats swap) xbtc-ft tx-sender)))))

;; @desc Make a loan repayment in case of contingency plan
;; @param amount: amount of xBTC being sent
;; @param loan-id: id of the loan to which the payment is made
;; @param payment: contract for completing payments
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: contract of the token accounting for cover pool zest rewards
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (make-payment-xbtc
  (amount uint)
  (loan-id uint)
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (let (
    (height burn-block-height)
    (globals (contract-call? .globals get-globals))
  )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (contract-call? .loan-v1-0 make-payment loan-id height payment lp-token lv cp-token cp-rewards-token zp-token swap-router amount xbtc-ft tx-sender)))

;; @desc Make a full loan repayment in case of contingency plan
;; @param amount: amount of xBTC being sent
;; @param loan-id: id of the loan to which the payment is made
;; @param payment: contract for completing payments
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param token-id: id of the pool that funds are being sent to
;; @param cp-token: contract of the token accounting for cover pool zest rewards
;; @param cp-rewards-token: contract of the token accounting for cover pool xBTC rewards
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (make-full-payment-xbtc
  (amount uint)
  (loan-id uint)
  (payment <payment>)
  (lp-token <sip-010>)
  (lv <lv>)
  (token-id uint)
  (cp-token <cp-token>)
  (cp-rewards-token <dt>)
  (zp-token <dt>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (let (
    (height burn-block-height)
    (globals (contract-call? .globals get-globals))
  )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (ok (try! (contract-call? .loan-v1-0 make-full-payment loan-id height payment lp-token lv cp-token cp-rewards-token zp-token swap-router amount xbtc-ft tx-sender)))))

;; @desc Initiate withdrawal process through magic protocol to withdraw funds sent to liquidity-pool
;; @param xbtc: amount of xBTC (sats) to withdraw
;; @param btc-version: the address version for the swapper's BTC address
;; @param btc-hash: the hash for the swapper's BTC address
;; @param supplier-id: the supplier used for this swap
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param token-id: id of the pool that funds are being sent to
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response true uint)
(define-public (withdraw
  (xbtc uint)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (lp-token <sip-010>)
  (zp-token <dtc>)
  (token-id uint)
  (lv <lv>)
  (xbtc-ft <ft>)
  )
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id))))
    (if (get open pool)
      true
      (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED))
    (try! (contract-call? .pool-v2-0 redeem lp-token token-id lv xbtc-ft xbtc tx-sender tx-sender))
    (try! (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))
    (print { btc-version: btc-version, btc-hash: btc-hash, supplier-id: supplier-id, amount: xbtc })
    (ok true)))

;; @desc Withdraw funds sent to liquidity-pool in case of contingency plan
;; @param xbtc: amount of xBTC (sats) to withdraw
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param zp-token: contract of the token accounting for lp zest rewards
;; @param token-id: id of the pool that funds are being sent to
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response true uint)
(define-public (withdraw-xbtc
  (xbtc uint)
  (lp-token <sip-010>)
  (zp-token <dtc>)
  (token-id uint)
  (lv <lv>)
  (xbtc-ft <ft>)
  )
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (try! (contract-call? .pool-v2-0 redeem lp-token token-id lv xbtc-ft xbtc tx-sender tx-sender))
    (ok true)))

;; @desc Initiate withdrawal process through magic protocol to withdraw rewards in cover-pool
;; @param btc-version: the address version for the swapper's BTC address
;; @param btc-hash: the hash for the swapper's BTC address
;; @param supplier-id: the supplier used for this swap
;; @param cp-rewards-token: contract of the token accounting for cp xbtc rewards
;; @param token-id: id of the pool that funds are being sent to
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (withdraw-cover-rewards
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (cp-rewards-token <dt>)
  (token-id uint)
  (lv <lv>)
  (xbtc <ft>))
  (let (
    (withdrawn-funds (try! (contract-call? .cover-pool-v1-0 withdraw-rewards cp-rewards-token token-id lv xbtc tx-sender)))
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id))))
    (if (get open pool)
      true
      (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED))
    (try! (contract-call? .magic-protocol initiate-outbound-swap withdrawn-funds btc-version btc-hash supplier-id))
    (ok withdrawn-funds)))

;; @desc Withdraw funds sent to cover-pool in case of contingency plan
;; @param btc-version: the address version for the swapper's BTC address
;; @param btc-hash: the hash for the swapper's BTC address
;; @param supplier-id: the supplier used for this swap
;; @param cp-rewards-token: contract of the token accounting for cp xbtc rewards
;; @param token-id: id of the pool that funds are being sent to
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (withdraw-cover-rewards-xbtc
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (cp-rewards-token <dt>)
  (token-id uint)
  (lv <lv>)
  (xbtc <ft>))
  (let (
    (globals (contract-call? .globals get-globals))
    (withdrawn-funds (try! (contract-call? .cover-pool-v1-0 withdraw-rewards cp-rewards-token  token-id lv xbtc tx-sender))))
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (ok withdrawn-funds)))

;; @desc Withdraw funds sent to cover-pool in case of contingency plan
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param lv: liquidity vault contract holding the liquid funds in the pool
;; @param xbtc: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
;; (define-public (withdraw-rewards-xbtc
;;   (lp-token <lp-token>)
;;   (token-id uint)
;;   (lv <lv>)
;;   (xbtc <ft>))
;;   (let (
;;     (globals (contract-call? .globals get-globals))
;;     (withdrawn-funds (try! (contract-call? .pool-v2-0 withdraw-rewards lp-token token-id lv xbtc tx-sender))))
;;     (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
;;     (ok withdrawn-funds)))

(define-public (drawdown-verify
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown-verify loan-id lp-token token-id coll-token coll-vault fv swap-router xbtc-ft tx-sender)))
    (swap-id (try! (as-contract (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))))
    (liquidity (try! (get-current-liquidity))))
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    (asserts! (>= liquidity xbtc) ERR_NOT_ENOUGH_LIQUIDITY)
    (print { btc-version: btc-version, btc-hash: btc-hash, supplier-id: supplier-id, amount: xbtc })
    (ok { swap-id: swap-id, sats: xbtc })))

;; @desc Initiate drawdown process through magic protocol to withdraw a funded loan
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param btc-version: the address version for the swapper's BTC address
;; @param btc-hash: the hash for the swapper's BTC address
;; @param supplier-id: the supplier used for this swap
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response { swap-id: uint, sats: uint } uint)
(define-public (drawdown
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown loan-id lp-token token-id coll-token coll-vault fv swap-router xbtc-ft tx-sender)))
    (swap-id (try! (as-contract (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))))
    (liquidity (try! (get-current-liquidity))))
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    (asserts! (>= liquidity xbtc) ERR_NOT_ENOUGH_LIQUIDITY)
    (print { btc-version: btc-version, btc-hash: btc-hash, supplier-id: supplier-id, amount: xbtc })
    (ok { swap-id: swap-id, sats: xbtc })))

;; @desc Finalize drawdown process through magic protocol to update the loan status
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param block: a tuple containing `header` (the Bitcoin block header) and the `height` (Stacks height)
;; @param prev-blocks: because Clarity contracts can't get Bitcoin headers when there is no Stacks block,
;; where the BTC tx was confirmed.
;; this param allows users to specify the chain of block headers going back to the block where the
;; BTC tx was confirmed.
;; @param tx: the hex data of the BTC tx
;; @param proof: a merkle proof to validate inclusion of this tx in the BTC block
;; @param output-index: the index of the HTLC output in the BTC tx
;; @param swap-id; the outbound swap ID they're finalizing
;; @returns (response uint uint)
(define-public (finalize-drawdown
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (xbtc-ft <ft>)
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (swap-id uint))
  (begin
    (try! (contract-call? .magic-protocol finalize-outbound-swap block prev-blocks tx proof output-index swap-id))
    (contract-call? .pool-v2-0 finalize-drawdown loan-id lp-token token-id coll-token coll-vault fv xbtc-ft)))

;; @desc Borrower can drawdown funds when contingency plan is active
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response { recipient: uint, sats: uint } uint)
(define-public (drawdown-xbtc
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (globals (contract-call? .globals get-globals))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown loan-id lp-token token-id coll-token coll-vault fv swap-router xbtc-ft tx-sender)))
    (result (try! (contract-call? .pool-v2-0 finalize-drawdown loan-id lp-token token-id coll-token coll-vault fv xbtc-ft))))
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (as-contract (try! (contract-call? xbtc-ft transfer xbtc tx-sender (get borrower result) none)))
    (ok { recipient: (get borrower result), sats: xbtc })))

;; @desc Initiate completion of rollover when funds have to been withdrawn
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param btc-version: the address version for the swapper's BTC address
;; @param btc-hash: the hash for the swapper's BTC address
;; @param supplier-id: the supplier used for this swap
;; @param swap-router: logic for swapping assets
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response uint uint)
(define-public (complete-rollover
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 complete-rollover loan-id lp-token token-id coll-token coll-vault fv swap-router xbtc-ft tx-sender)))
    (swap-id (if (> xbtc u0) (try! (as-contract (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))) u0) )
    (liquidity (try! (get-current-liquidity))))
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    (asserts! (>= liquidity xbtc) ERR_NOT_ENOUGH_LIQUIDITY)
    (ok swap-id)))

;; @desc Finalize rollover magic protocol to update the loan and rollover status
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param block: a tuple containing `header` (the Bitcoin block header) and the `height` (Stacks height)
;; where the BTC tx was confirmed.
;; @param prev-blocks: because Clarity contracts can't get Bitcoin headers when there is no Stacks block,
;; this param allows users to specify the chain of block headers going back to the block where the
;; BTC tx was confirmed.
;; @param tx: the hex data of the BTC tx
;; @param proof: a merkle proof to validate inclusion of this tx in the BTC block
;; @param output-index: the index of the HTLC output in the BTC tx
;; @param swap-id; the outbound swap ID they're finalizing
;; @returns (response uint uint)
(define-public (finalize-rollover
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (xbtc-ft <ft>)
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (swap-id uint))
  (begin
    (try! (contract-call? .magic-protocol finalize-outbound-swap block prev-blocks tx proof output-index swap-id))
    (contract-call? .pool-v2-0 finalize-rollover loan-id lp-token token-id coll-token coll-vault fv xbtc-ft)))

;; @desc Cancel drawdown when the magic-protocol process cannot be completed
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param swap-id; the outbound swap ID they're finalizing
;; @returns (response uint uint)
(define-public (cancel-drawdown
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (xbtc-ft <ft>)
  (swap-id uint)
  )
  (let (
    (swap (try! (contract-call? .magic-protocol revoke-expired-outbound swap-id)))
    (recovered-amount (get xbtc swap))
  )
    (try! (as-contract (contract-call? xbtc-ft transfer recovered-amount tx-sender .pool-v2-0 none)))
    (try! (contract-call? .pool-v2-0 cancel-drawdown loan-id lp-token token-id coll-token coll-vault fv recovered-amount xbtc-ft))
    (ok (get xbtc swap))))

;; @desc Cancel rollover when the magic-protocol process cannot be completed
;; @param loan-id: id of the loan to which the payment is made
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param token-id: id of the pool that funds are being sent to
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param swap-id; the outbound swap ID they're finalizing
;; @returns (response uint uint)
(define-public (cancel-rollover
  (loan-id uint)
  (lp-token <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (xbtc-ft <ft>)
  (swap-id uint))
  (let (
    (swap (try! (contract-call? .magic-protocol revoke-expired-outbound swap-id)))
    (recovered-amount (get xbtc swap)))
    (try! (as-contract (contract-call? xbtc-ft transfer recovered-amount tx-sender .pool-v2-0 none)))
    (try! (contract-call? .pool-v2-0 cancel-rollover loan-id lp-token token-id coll-token coll-vault fv recovered-amount xbtc-ft tx-sender))
    (ok swap)))

;; @desc Finalize outbound swaps such as for withdrawing rewads or sent funds
;; @param block: a tuple containing `header` (the Bitcoin block header) and the `height` (Stacks height)
;; where the BTC tx was confirmed.
;; @param prev-blocks: because Clarity contracts can't get Bitcoin headers when there is no Stacks block,
;; this param allows users to specify the chain of block headers going back to the block where the
;; BTC tx was confirmed.
;; @param tx: the hex data of the BTC tx
;; @param proof: a merkle proof to validate inclusion of this tx in the BTC block
;; @param output-index: the index of the HTLC output in the BTC tx
;; @param swap-id; the outbound swap ID they're finalizing
;; @returns (response uint uint)
(define-public (finalize-outbound
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (swap-id uint))
  (begin
    (contract-call? .magic-protocol finalize-outbound-swap block prev-blocks tx proof output-index swap-id)))

;; internal
(define-private (withdraw-protocol (amount uint))
  (as-contract (contract-call? .magic-protocol remove-funds amount)))

(define-private (transfer-full (swapped-amount uint) (fee uint) (sender principal) (recipient principal) (xbtc <ft>))
  (begin
    (try! (as-contract (contract-call? xbtc transfer swapped-amount sender recipient none)))
    (try! (as-contract (contract-call? xbtc transfer fee tx-sender recipient none)))
    (ok (+ swapped-amount fee))))

(define-private (finalize-priv (txid (buff 32)) (preimage (buff 128)) (xbtc-ft <ft>))
  (let (
    (swap-resp (as-contract (try! (contract-call? .magic-protocol finalize-swap txid preimage))))
    (swap (try! (contract-call? .magic-protocol get-full-inbound txid)))
    (swapper (get swapper-principal swap))
    (sats (get sats swap))
    (xbtc (get xbtc swap))
    (fee (- sats xbtc))
    (updated-funds (try! (withdraw-protocol fee))))
    (try! (as-contract (contract-call? xbtc-ft transfer fee tx-sender swapper none)))
    (asserts! (is-eq tx-sender swapper) ERR_WRONG_SWAPPER)
    (ok (merge swap { fee: fee }))))

(define-private (finalize-completed (txid (buff 32)) (xbtc-ft <ft>))
  (let (
    (swap (try! (contract-call? .magic-protocol get-full-inbound txid)))
    (swapper (get swapper-principal swap))
    (sats (get sats swap))
    (xbtc (get xbtc swap))
    (fee (- sats xbtc))
    (updated-funds (try! (withdraw-protocol fee))))
    (unwrap! (contract-call? .magic-protocol get-preimage txid) ERR_TX_DOES_NOT_EXIST)
    (asserts! (is-eq tx-sender swapper) ERR_WRONG_SWAPPER)
    (try! (as-contract (contract-call? xbtc-ft transfer fee tx-sender swapper none)))
    (ok (merge swap { fee: fee }))))

;; owner methods
(define-public (register-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18))
    (funds uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol register-supplier public-key inbound-fee outbound-fee outbound-base-fee inbound-base-fee funds))))

(define-public (add-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol add-funds amount))))

(define-public (remove-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .magic-protocol remove-funds amount))))

(define-public (update-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18)))
  (begin
    (try! (validate-owner))
    (try! (as-contract (contract-call? .magic-protocol update-supplier-fees inbound-fee outbound-fee outbound-base-fee inbound-base-fee)))
    (as-contract (contract-call? .magic-protocol update-supplier-public-key public-key))))

(define-public (transfer-owner (new-owner principal))
  (begin
    (try! (validate-owner))
    (var-set owner new-owner)
    (ok new-owner)))

;; helpers
(define-read-only (validate-owner)
  (if (is-eq tx-sender (get-owner))
    (ok true)
    ERR_UNAUTHORIZED))

(define-read-only (get-owner) (var-get owner))

(define-map protocol-liquidity uint uint)

(define-data-var highest-set-liquidity uint burn-block-height)

(define-read-only (get-current-liquidity)
  (get-liquidity (var-get highest-set-liquidity))
)

(define-read-only (get-liquidity-read (height uint))
  (unwrap-panic (map-get? protocol-liquidity height))
)

(define-read-only (get-liquidity (height uint))
  (ok (unwrap! (map-get? protocol-liquidity height) ERR_HEIGHT_UNAVAILABLE))
)

(define-public (update-liquidity (height uint) (liquidity uint))
  (begin
    (asserts! (contract-call? .globals is-governor tx-sender) ERR_UNAUTHORIZED)
    (if (> height (var-get highest-set-liquidity)) (var-set highest-set-liquidity height) false)
    (print { type: "updated_liquidity", payload: { height: height, liquidity: liquidity } })
    (ok (map-set protocol-liquidity height liquidity))
  )
)

;; ERROR START 1000
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_WRONG_SWAPPER (err u1001))
(define-constant ERR_PANIC (err u1002))
(define-constant ERR_TX_ESCROWED (err u1003))
(define-constant ERR_TX_DOES_NOT_EXIST (err u1004))
(define-constant ERR_HEIGHT_UNAVAILABLE (err u1005))
(define-constant ERR_NOT_ENOUGH_LIQUIDITY (err u1006))
(define-constant ERR_ADDRESS_NOT_ALLOWED (err u1007))
(define-constant ERR_CONTINGENCY_PLAN_DISABLED (err u1008))
(define-constant ERR_INVALID_SUPPLIER (err u1009))