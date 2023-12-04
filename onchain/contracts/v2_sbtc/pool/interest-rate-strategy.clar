
;; 0.8 Ur
(define-constant optimal-utilization-rate u8000)
(define-constant excess-utilization-rate (- u10000 optimal-utilization-rate))


;; when Ur = 0
(define-data-var base-variable-borrow-rate uint u0)

;; when Ur < optimal-utilization-rate
(define-data-var variable-rate-slope-1 uint u0)
;; when Ur > optimal-utilization-rate
(define-data-var variable-rate-slope-2 uint u0)

;; when Ur < optimal-utilization-rate
(define-data-var stable-rate-slope-1 uint u0)
;; when Ur > optimal-utilization-rate
(define-data-var stable-rate-slope-2 uint u0)

(define-read-only (calculate-interest-rates
    (available-liquidity uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (average-stable-borrow-rate uint)
  )
  (let (
    (total-borrows (+ total-borrows-stable total-borrows-variable))
    (utilization-rate
      (if (and (is-eq u0 total-borrows-stable) (is-eq u0 total-borrows-variable))
        u0
        (/
          (* u10000 total-borrows)
          (+ total-borrows available-liquidity)
          u10000
        )
      )
    )
    ;; TODO: should get this from an oracle, but might not exist
    (current-stable-borrow-rate u500)
  )
    (if (> utilization-rate optimal-utilization-rate)
      (let (
          (excess-utilization-rate-ratio
            (*
              (/
                (* u10000 (- utilization-rate optimal-utilization-rate))
                excess-utilization-rate)
              u10000))
          (new-stable-borrow-rate
            (+
              (+ current-stable-borrow-rate (var-get stable-rate-slope-1))
              (/
                (*
                  (* (var-get stable-rate-slope-2) u10000)
                  excess-utilization-rate-ratio)
                u10000)))
          (new-variable-borrow-rate
            (+
              (+ (var-get base-variable-borrow-rate) (var-get variable-rate-slope-1))
              (/
                (*
                  (* u10000 (var-get variable-rate-slope-2))
                  excess-utilization-rate-ratio)
                u10000))))
        (ok u0)
      )
      (ok u0)
    )
  )
)

(define-private (get-overall-borrow-rate-internal
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
  )
  (let (
    (total-borrows (+ total-borrows-stable total-borrows-variable))
  )
    (if (is-eq total-borrows u0)
      u0
      (let (
        (weighted-variable-rate
          (* total-borrows-variable current-variable-borrow-rate))
        (weighted-stable-rate
          (* total-borrows-stable current-average-stable-borrow-rate))
        (overall-borrow-rate
           (/
            (/
              (* u10000 (+ weighted-variable-rate weighted-stable-rate))
              total-borrows)
            u10000)))
          overall-borrow-rate
      ))))

(define-read-only (get-utilization-rate
  (total-borrows-stable uint)
  (total-borrows-variable uint)
  (available-liquidity uint))
  (let (
    (total-borrows (+ total-borrows-stable total-borrows-variable))
  )
    (/
      (* u10000 total-borrows)
      (+ total-borrows available-liquidity)
      u10000
    )
  )
)