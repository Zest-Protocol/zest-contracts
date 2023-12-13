(use-trait lp-token .lp-token-trait.lp-token-trait)

(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)

(use-trait ft .ft-trait.ft-trait)
(use-trait sip-010 .sip-010-trait.sip-010-trait)

(use-trait v .vault-trait.vault-trait)
(use-trait fv .funding-vault-trait.funding-vault-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(use-trait payment .payment-trait.payment-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(define-data-var owner principal tx-sender)

;; tx-id -> tx-height
(define-map escrowed-tx (buff 32) { height: uint, supplier-id: uint, token-id: uint, loan-id: uint, amount: uint, finalized: bool, controller: principal, action: (buff 1) })
(define-map magic-id uint bool)

(define-constant FUNDS_TO_POOL 0x00)
(define-constant PAYMENT 0x01)
(define-constant PAYMENT_VERIFY 0x02)
(define-constant PAYMENT_RESIDUAL 0x03)
(define-constant FULL_PAYMENT 0x04)

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
    (lp <sip-010>)
    (token-id uint)
    (l-v <lv>)
    (xbtc-ft <ft>)
    (amount uint)
    (r-c <rewards-calc>))
  (let (
    (height burn-block-height)
    (globals (contract-call? .globals get-globals))
    )
    ;; disabling contingency plan
    ;; (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (try! (as-contract (contract-call? xbtc-ft transfer amount tx-sender .pool-v2-0 none)))
    (try! (contract-call? .pool-v2-0 send-funds lp token-id l-v xbtc-ft amount tx-sender))
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
  (lp <sip-010>)
  (l-v <lv>)
  (xbtc-ft <ft>)
  (r-c <rewards-calc>) )
  (let (
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (sats (get amount params))
    )
    (asserts! (get finalized params) ERR_UNAUTHORIZED)
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender .pool-v2-0 none)))
    (try! (contract-call? .pool-v2-0 send-funds lp (get token-id params) l-v xbtc-ft sats (get controller params)))

    (map-delete escrowed-tx txid)
    (ok sats)
  )
)

(define-public (make-payment-verify
  (txid (buff 32))
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (sats (get amount params))
    )

  (asserts! (get finalized params) ERR_UNAUTHORIZED)
  (asserts! (is-eq PAYMENT_VERIFY (get action params)) ERR_INVALID_ACTION)

  (map-delete escrowed-tx txid)
  (print { type: "make-payment-verify", payload: { key: { tx-id: txid }, data: params } })
  (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender .loan-v1-0 none)))
  (ok (try! (contract-call? .loan-v1-0 make-payment-verify (get loan-id params) (get height params) pay lp l-v swap-router sats xbtc-ft (get controller params))))
  )
)

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
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (sats (get amount params)))

    (asserts! (is-eq PAYMENT (get action params)) ERR_INVALID_ACTION)
    (asserts! (get finalized params) ERR_UNAUTHORIZED)

    (map-delete escrowed-tx txid)
    (print { type: "make-payment", payload: { key: { tx-id: txid }, data: params } })
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender .pool-v2-0 none)))
    (ok (try! (contract-call? .pool-v2-0 make-payment (get loan-id params) (get height params) pay lp l-v cp swap-router sats xbtc-ft (get controller params))))
  )
)

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
  (lp <sip-010>)
  (l-v <lv>)
  (xbtc-ft <ft>))
  (let (
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (sats (get amount params)))

    (asserts! (is-eq PAYMENT_RESIDUAL (get action params)) ERR_INVALID_ACTION)
    (asserts! (get finalized params) ERR_UNAUTHORIZED)

    (map-delete escrowed-tx txid)
    (print { type: "make-residual-payment", payload: { key: { tx-id: txid }, data: params } })
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender .pool-v2-0 none)))
    (ok (try! (contract-call? .pool-v2-0 make-residual-payment (get loan-id params) lp (get token-id params) l-v sats xbtc-ft (get controller params))))
  )
)

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
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (params (unwrap! (map-get? escrowed-tx txid) ERR_TX_DOES_NOT_EXIST))
    (sats (get amount params)))

    (asserts! (is-eq FULL_PAYMENT (get action params)) ERR_INVALID_ACTION)
    (asserts! (get finalized params) ERR_UNAUTHORIZED)

    (map-delete escrowed-tx txid)
    (print { type: "make-full-payment", payload: { key: { tx-id: txid }, data: params } })
    (try! (as-contract (contract-call? xbtc-ft transfer sats tx-sender .loan-v1-0 none)))
    (ok (try! (contract-call? .loan-v1-0 make-full-payment (get loan-id params) (get height params) pay lp l-v cp swap-router sats xbtc-ft (get controller params))))
  )
)

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
  (height uint)
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (token-id uint)
  (cp <lp-token>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (begin
    ;; let (
    ;; (height burn-block-height)
    ;; (globals (contract-call? .globals get-globals)))
    ;; (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (try! (as-contract (contract-call? xbtc-ft transfer amount tx-sender .pool-v2-0 none)))
    (contract-call? .pool-v2-0 make-payment loan-id height pay lp l-v cp swap-router amount xbtc-ft tx-sender)
    ;; (ok u0)
  )
)

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
  (pay <payment>)
  (lp <sip-010>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (ok (try! (contract-call? .loan-v1-0 make-full-payment loan-id burn-block-height pay lp l-v cp swap-router amount xbtc-ft tx-sender)))
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (l-v <lv>)
  (xbtc-ft <ft>)
  )
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    )
    (if (get open pool)
      true
      (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    )
    (try! (contract-call? .pool-v2-0 redeem lp token-id l-v xbtc-ft xbtc tx-sender tx-sender))
    ;; (try! (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))

    (ok true)
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (l-v <lv>)
  (xbtc-ft <ft>)
  )
  (let (
    (globals (contract-call? .globals get-globals))
    )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (try! (contract-call? .pool-v2-0 redeem lp token-id l-v xbtc-ft xbtc tx-sender tx-sender))
    (ok true)
  )
)

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
  (token-id uint)
  (l-v <lv>)
  (xbtc <ft>))
  (let (
    (withdrawn-funds (try! (contract-call? .cover-pool-v1-0 withdraw-rewards token-id l-v xbtc tx-sender)))
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    )
    (if (get open pool)
      true
      (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    )
    ;; (try! (contract-call? .magic-protocol initiate-outbound-swap withdrawn-funds btc-version btc-hash supplier-id))
    (ok withdrawn-funds)
  )
)

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
  (token-id uint)
  (l-v <lv>)
  (xbtc <ft>))
  (let (
    (globals (contract-call? .globals get-globals))
    (withdrawn-funds (try! (contract-call? .cover-pool-v1-0 withdraw-rewards token-id l-v xbtc tx-sender)))
    )
    (asserts! (get contingency-plan globals) ERR_CONTINGENCY_PLAN_DISABLED)
    (ok withdrawn-funds)
  )
)

(define-public (drawdown-verify
  (loan-id uint)
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown-verify loan-id lp token-id coll-token coll-vault f-v swap-router xbtc-ft tx-sender)))
    )
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    (print { btc-version: btc-version, btc-hash: btc-hash, supplier-id: supplier-id, amount: xbtc })
    (ok { sats: xbtc })
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (swap-router <swap>)
  (xbtc-ft <ft>)
  )
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown loan-id lp token-id coll-token coll-vault f-v swap-router xbtc-ft tx-sender))))
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)

    ;; Burn sBTC
    (try! (as-contract (contract-call? xbtc-ft transfer xbtc tx-sender 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR none)))
    (ok { sats: xbtc }))
)

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (xbtc-ft <ft>)
  )
  (begin (contract-call? .pool-v2-0 finalize-drawdown loan-id lp token-id coll-token coll-vault f-v xbtc-ft)))

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (globals (contract-call? .globals get-globals))
    (xbtc (try! (contract-call? .pool-v2-0 drawdown loan-id lp token-id coll-token coll-vault f-v swap-router xbtc-ft tx-sender)))
    (result (try! (contract-call? .pool-v2-0 finalize-drawdown loan-id lp token-id coll-token coll-vault f-v xbtc-ft))))
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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (btc-version (buff 1))
  (btc-hash (buff 20))
  (supplier-id uint)
  (swap-router <swap>)
  (xbtc-ft <ft>))
  (let (
    (pool (try! (contract-call? .pool-v2-0 get-pool token-id)))
    (xbtc (try! (contract-call? .pool-v2-0 complete-rollover loan-id lp token-id coll-token coll-vault f-v swap-router xbtc-ft tx-sender)))
    ;; (swap-id (if (> xbtc u0) (try! (as-contract (contract-call? .magic-protocol initiate-outbound-swap xbtc btc-version btc-hash supplier-id))) u0) )
    ;; (liquidity (try! (get-current-liquidity)))
    )
    (asserts! (contract-call? .globals is-onboarded-address-read tx-sender btc-version btc-hash) ERR_ADDRESS_NOT_ALLOWED)
    (ok xbtc)
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (xbtc-ft <ft>)
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
  (output-index uint)
  (swap-id uint))
  (begin
    (contract-call? .pool-v2-0 finalize-rollover loan-id lp token-id coll-token coll-vault f-v xbtc-ft)
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (xbtc-ft <ft>)
  (swap-id uint)
  )
  (begin
    ;; TODO: use loan-id to cancel drawdown
    (try! (as-contract (contract-call? xbtc-ft transfer u0 tx-sender .pool-v2-0 none)))
    ;; TODO: use only loan-id to cancel loan rollover
    (try! (contract-call? .pool-v2-0 cancel-drawdown loan-id lp token-id coll-token coll-vault f-v u0 xbtc-ft))
    (ok u0)
  )
)

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
  (lp <sip-010>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (xbtc-ft <ft>)
  (swap-id uint)
  )
  (begin
    ;; TODO: use only loan-id to cancel loan rollover
    (try! (as-contract (contract-call? xbtc-ft transfer u0 tx-sender .pool-v2-0 none)))
    ;; TODO: use only loan-id to cancel loan rollover
    (try! (contract-call? .pool-v2-0 cancel-rollover loan-id lp token-id coll-token coll-vault f-v u0 xbtc-ft tx-sender))
    (ok u0)
  )
)

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
(define-constant ERR_INVALID_ACTION (err u1010))
(define-constant ERR_TX_COMPLETED (err u1011))
(define-constant INVALID_OUTBOUND_TX (err u1012))

;; Magic error
(define-constant ERR_TXID_USED (err u16))
(define-constant ERR_ALREADY_FINALIZED (err u17))
