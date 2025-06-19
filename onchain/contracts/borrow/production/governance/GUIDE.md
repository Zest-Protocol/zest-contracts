# Zest Governance

## Overview

The Zest Governance system is designed to manage important decisions for the Zest Protocol through a structured, multi-layered approach. Think of it as a sophisticated voting and execution system that ensures decisions are made safely and efficiently.

## How It Works

### The Two Execution Teams

The governance system has two specialized teams responsible for executing proposals:

1. **Executive Team** - Executes proposals quickly when needed
2. **Signer Team** - Provides additional execution layer with built-in safety delays

## Execution Mechanisms

### Executive Team: The Quick Executors

The Executive Team is responsible for executing proposals when speed is important. They work like a multi-signature system - multiple people must agree before anything gets executed.

**What they do:**
- Execute proposals quickly when needed
- Provide multi-signature approval (multiple people must agree)
- Can execute proposals immediately when sufficient approval is gathered

**How it works:**
1. A proposal is created through normal governance channels
2. Executive Team members signal their approval
3. Once enough approvals are collected, the proposal executes automatically
4. This happens immediately - no waiting period

**Safety features:**
- Requires multiple Executive Team members to approve
- Powers automatically expire after 3 months
- Each member can only approve once per proposal

### Signer Team: The Deliberate Executors

The Signer Team provides an additional execution layer with built-in safety delays to ensure proper consideration of proposals.

**What they do:**
- Execute proposals after proper deliberation
- Provide multi-signature approval like the Executive Team
- Follow strict timing rules to ensure proper consideration

**Timing Rules:**
1. **Proposal must be active** - Can't execute before the proposal starts
2. **Proposal must have ended** - Must wait for the voting period to finish
3. **Cooldown period** - Must wait an additional day after voting ends
4. **Then execution** - Only then can the Signer Team execute

**Why the delays:**
- Ensures proposals get proper consideration
- Prevents hasty decisions
- Gives time for community discussion and review

## Execution Mechanisms Explained

### Quick Execution (Executive Team)

```
Proposal Created → Executive Team Approval → Immediate Execution
       ↓                    ↓                        ↓
   Normal Process      Multi-Signature           No Waiting
                      Agreement Required
```

**Timeline:** Minutes to hours
**Approval:** Multiple Executive Team members must agree
**Safety:** Automatic expiration of powers

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

## Safety Mechanisms

### Automatic Safeguards
- **Sunset Heights**: All special powers expire automatically
- **Multi-Signature**: Multiple people must agree
- **Timing Controls**: Proper delays for regular proposals

### Human Safeguards
- **Team Separation**: Different teams for different timing needs
- **Approval Requirements**: Multiple approvals needed
- **Time for Consideration**: Built-in delays prevent rushing
