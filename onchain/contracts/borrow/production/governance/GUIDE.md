# Zest Governance

## Overview

The Zest Governance system is designed to manage important decisions for the Zest Protocol through a structured, multi-layered approach. Think of it as a sophisticated voting and execution system that ensures decisions are made safely and efficiently.

## How It Works

### The Two Execution Teams

The governance system has two specialized teams responsible for executing proposals:

1. **Executive Team** - Controls emergency shutdown functionality
2. **Signer Team** - Provides execution layer with built-in safety delays

## Execution Mechanisms

### Executive Team: The Emergency Shutdown Controllers

The Executive Team is responsible for controlling the emergency shutdown functionality of the protocol.

**What they do:**
- Toggle the emergency shutdown state of the protocol
- Provide multi-signature approval (multiple people must agree)
- Can activate or deactivate emergency shutdown when sufficient approval is gathered

**How it works:**
1. Executive Team members signal their approval to toggle emergency shutdown
2. Once enough approvals are collected, the emergency shutdown state changes
3. This happens immediately - no waiting period
4. The shutdown state toggles between active and inactive

**Safety features:**
- Requires multiple Executive Team members to approve

### Signer Team: The Deliberate Executors

The Signer Team provides an execution layer with built-in safety delays to ensure proper consideration of proposals.

**What they do:**
- Execute proposals after proper deliberation
- Provide multi-signature approval
- Follow strict timing rules to ensure proper consideration

**Timing Rules:**
1. **Proposal must be active** - Can't execute before the proposal starts
2. **Proposal must have ended** - Must wait for the voting period to finish
3. **Cooldown period** - Must wait an additional day after voting ends
4. **Then execution** - Only then can the Signer Team execute

## Execution Mechanisms Explained

### Emergency Shutdown Control (Executive Team)

```
Emergency Situation → Executive Team Approval → Shutdown Toggle
       ↓                        ↓                    ↓
   Critical Issue        Multi-Signature        Protocol State
                        Agreement Required      Changes Immediately
```

**Timeline:** Minutes to hours
**Approval:** Multiple Executive Team members must agree
**Safety:** Automatic expiration of powers
**Action:** Toggles emergency shutdown state (on/off)

### Deliberate Execution (Signer Team)

```
Regular Proposal → Voting Period → Cooldown Period → Signer Team Execution
       ↓              ↓                ↓                    ↓
   Community      Time for         Safety Delay        Multi-Signature
   Discussion     Consideration                        Approval
```

**Timeline:** Days to weeks
**Approval:** Multiple Signer Team members must agree
**Safety:** Multiple timing checks and delays



