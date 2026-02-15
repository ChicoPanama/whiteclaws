# WhiteClaws Vulnerability Submission Template

## Version 1.0 — February 2026

---

## 🎯 Purpose

This template guides you through creating high-quality vulnerability submissions that protocols will accept. Following this template increases your acceptance rate and helps you avoid false positives.

---

## ⚠️ Critical Lesson: The SSV Network Case Study

**Real Example of What NOT to Do:**

A researcher submitted a "critical" vulnerability to SSV Network claiming an unchecked uint64 multiplication could cause integer overflow in `OperatorLib.updateSnapshot()`.

**The Theoretical Analysis (✅ Correct):**
```solidity
// In OperatorLib.sol
fee = index * balance; // uint64 * uint64
```

Mathematically, multiplying two uint64 values CAN overflow a uint64 result.

**The Fatal Mistake (❌ Wrong):**
The researcher failed to verify that the protocol's **governance constraints** prevent the input parameters from ever reaching values that would cause overflow.

**Why It Was Rejected:**
- The protocol uses Solidity 0.8+, which has built-in overflow protection
- Even if downgraded, governance limits prevent `index` and `balance` from reaching exploit values
- No mainnet fork test was provided
- The researcher assumed theoretical possibility = practical exploitability

**The Lesson:**
✨ **Theoretical vulnerability ≠ Real vulnerability**  
✨ **Always verify PRACTICAL reachability, not just THEORETICAL possibility**

---

## 📋 Submission Template

### 1. VULNERABILITY IDENTIFICATION

**Protocol:** [Protocol name]  
**Contract:** [Contract name and address]  
**Function:** [Specific function name]  
**Severity:** [Critical / High / Medium / Low]  
**Vulnerability Type:** [e.g., Reentrancy, Integer Overflow, Access Control, etc.]

---

### 2. THEORETICAL ANALYSIS

**What CAN happen in the code?**

```solidity
// Paste relevant code snippet
function vulnerableFunction(uint256 amount) public {
    // Show the problematic line
    balance = balance + amount; // Potential overflow
}
```

**Mathematical/Logical Proof:**
[Explain the theoretical vulnerability clearly]

Example:
> If `balance = type(uint256).max - 1` and `amount = 2`, then `balance + amount` would overflow, wrapping to `1`.

---

### 3. ⚠️ PRACTICAL VERIFICATION (CRITICAL SECTION)

**This section is MANDATORY. Without it, your submission will be rejected.**

#### Checklist (ALL must be checked):

- [ ] **Parameter Constraints Checked**  
  Have you verified that input parameters CAN actually reach exploit values?
  - [ ] Checked setter functions for limits
  - [ ] Verified governance constraints
  - [ ] Reviewed access control on critical functions
  - [ ] Confirmed no external validation prevents exploitation

- [ ] **Input Bounds Verified**  
  Can the attack values actually be set through the protocol's interface?
  - [ ] Tested setting exploit values via frontend/SDK
  - [ ] Confirmed no middleware validation
  - [ ] Verified no rate limiting prevents attack

- [ ] **Mainnet Fork Test Executed**  
  Have you proven exploitability on a mainnet fork?
  - [ ] Used Foundry/Hardhat mainnet fork
  - [ ] Replicated exact mainnet state
  - [ ] Successfully triggered vulnerability
  - [ ] Captured transaction logs

- [ ] **DoS/Exploit Condition Actually Triggered**  
  Did you prove the bad state can be reached?
  - [ ] Transaction succeeded (not reverted)
  - [ ] Exploit condition observed
  - [ ] Impact measured (funds drained, DoS confirmed, etc.)

#### Practical Verification Notes:

```
Example:

✅ PASS: Setter function has no max limit
function setAmount(uint256 _amount) public {
    amount = _amount; // No check!
}

✅ PASS: Mainnet fork test executed
forge test --fork-url $MAINNET_RPC --match-test testOverflow
Test passed: Overflow triggered, contract bricked

❌ FAIL: If governance prevents exploit values
function setAmount(uint256 _amount) public onlyOwner {
    require(_amount <= MAX_SAFE_VALUE, "Too high");
    amount = _amount;
}
→ Cannot reach overflow values = NOT EXPLOITABLE
```

---

### 4. PROOF OF CONCEPT

**Required: Working code that demonstrates the vulnerability**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/VulnerableContract.sol";

contract ExploitTest is Test {
    VulnerableContract target;
    
    function setUp() public {
        // Fork mainnet
        vm.createSelectFork(vm.envString("MAINNET_RPC"));
        
        target = VulnerableContract(0xTARGET_ADDRESS);
    }
    
    function testExploit() public {
        // Step 1: Setup
        uint256 balanceBefore = target.balance();
        
        // Step 2: Trigger vulnerability
        target.vulnerableFunction(type(uint256).max);
        
        // Step 3: Verify impact
        uint256 balanceAfter = target.balance();
        
        assertEq(balanceAfter, 0, "Balance not drained");
        // OR
        vm.expectRevert(); // For DoS
        target.someFunction();
    }
}
```

**Test Output:**
```bash
$ forge test --fork-url $MAINNET_RPC -vvvv

Running 1 test for test/Exploit.t.sol:ExploitTest
[PASS] testExploit() (gas: 123456)
Logs:
  Balance before: 1000000000000000000
  Balance after: 0
  
Test result: ok. 1 passed; 0 failed;
```

---

### 5. IMPACT ASSESSMENT

**Real-World Exploitability Score:** [0-10, where 10 = trivially exploitable]

**Factors to consider:**
- [ ] Can any user trigger it? (vs only admin)
- [ ] Requires special conditions? (flash loan, specific state, etc.)
- [ ] Cost to exploit? (gas fees, capital requirements)
- [ ] Likelihood of detection? (on-chain monitoring, MEV bots)

**Impact Description:**

What happens if exploited?
- Funds at risk: [Amount in USD/ETH]
- Protocol functionality affected: [Describe]
- Recovery possible? [Yes/No + explanation]

**Attack Scenario:**
```
1. Attacker calls function X with parameter Y
2. Contract state changes to Z
3. Funds/functionality compromised
4. Total impact: $X loss / Protocol halted
```

---

### 6. REMEDIATION

**Recommended Fix:**

```solidity
// Before (vulnerable):
function vulnerable(uint256 amount) public {
    balance = balance + amount;
}

// After (fixed):
function secure(uint256 amount) public {
    require(amount <= MAX_SAFE_AMOUNT, "Amount too high");
    balance = balance + amount; // SafeMath in 0.8+
}
```

**Alternative Solutions:**
1. [Option 1]
2. [Option 2]

**Deployment Considerations:**
- Requires contract upgrade? [Yes/No]
- Backward compatible? [Yes/No]
- Gas impact: [Estimate]

---

## 📊 Submission Checklist

Before submitting, verify ALL of these:

### Code Analysis
- [ ] Vulnerability clearly identified in code
- [ ] Code snippet provided
- [ ] Theoretical analysis is sound

### Practical Verification (MOST IMPORTANT)
- [ ] ✅ Parameter constraints checked (no governance limits prevent exploit)
- [ ] ✅ Input bounds verified (can actually set attack values)
- [ ] ✅ Mainnet fork test executed and PASSED
- [ ] ✅ Exploit condition actually triggered (not just theorized)
- [ ] ✅ Impact measured (funds drained / DoS confirmed / state corrupted)

### Proof of Concept
- [ ] PoC code provided
- [ ] PoC actually runs (tested locally)
- [ ] Test output included
- [ ] Mainnet fork used (not just testnet)

### Impact & Remediation
- [ ] Real-world impact assessed
- [ ] Severity justified
- [ ] Fix recommended
- [ ] Fix tested

### Submission Quality
- [ ] Title is descriptive (not just "Overflow in contract")
- [ ] Description is clear and concise
- [ ] No typos or grammatical errors
- [ ] Encrypted report if critical/high severity

---

## 🚫 Common Mistakes to Avoid

### 1. Theoretical-Only Analysis (SSV Mistake)
❌ "This multiplication could overflow"  
✅ "This multiplication WILL overflow when X=max and Y>1, and I proved it on mainnet fork"

### 2. Ignoring Solidity 0.8+ Protections
❌ "Unchecked addition causes overflow"  
✅ "Despite 0.8+ protections, this unchecked block allows overflow when..."

### 3. Not Testing on Mainnet Fork
❌ "I think this will work on mainnet"  
✅ "I forked mainnet at block 12345, executed the attack, here's the tx log"

### 4. Assuming Access Control Doesn't Matter
❌ "This function has no checks"  
✅ "Although this function is onlyOwner, the owner key is compromised/multisig has 1/3 threshold"

### 5. Copy-Paste from Audit Reports
❌ Submitting known issues from public audits  
✅ Novel findings not in any previous audit

### 6. Missing Impact Analysis
❌ "Contract can be bricked"  
✅ "Contract holds $5M TVL, bricking it locks all funds permanently, affecting 10,000 users"

### 7. No Working PoC
❌ "Here's the vulnerable code"  
✅ "Here's the code + runnable exploit + test output"

---

## 💡 Pro Tips

### Increase Acceptance Rate
1. **Always fork mainnet** — Don't rely on testnets
2. **Show, don't tell** — Working PoC > theoretical explanation
3. **Verify governance** — Check if protocol settings prevent your attack
4. **Check audits first** — Don't submit known issues
5. **Provide fix** — Show you understand the vulnerability deeply

### Stand Out
1. **Measure impact** — "Locks $5M" is better than "causes DoS"
2. **Consider MEV** — Can this be exploited via flashbots?
3. **Think composability** — Does this affect protocols integrating with this one?
4. **Check edge cases** — What happens at max values? Zero values? Reentrancy?

### Speed Matters
1. **Use templates** — This one!
2. **Automate testing** — Foundry scripts for common patterns
3. **Monitor new deployments** — First to find = higher payout
4. **Focus on high TVL** — Better ROI on your time

---

## 📁 Example Submission (Good vs Bad)

### ❌ BAD Submission

**Title:** Bug in contract

**Description:** The function has an overflow.

**Severity:** Critical

---

### ✅ GOOD Submission

**Title:** Unchecked Multiplication in RewardDistributor.claim() Allows Fund Drainage

**Description:** 

The `RewardDistributor.claim()` function performs unchecked multiplication of `rewardRate * timeElapsed`, which can overflow when `timeElapsed` exceeds 2^64 seconds (~584 billion years). 

However, I discovered that the protocol's governance can set `rewardRate` to arbitrarily high values through `setRewardRate()` with no upper bound. By setting `rewardRate = type(uint128).max`, the multiplication overflows with `timeElapsed = 2`, allowing an attacker to claim unlimited rewards.

**Verification:**
✅ Checked `setRewardRate()` — NO max limit enforced  
✅ Forked mainnet at block 19,234,567  
✅ Executed attack: Set rewardRate to max, waited 2 seconds, claimed 2^256 tokens  
✅ Impact: Drained 100% of reward pool ($12M USDC)

**Severity:** Critical

**PoC:** [Foundry test provided]

---

## 🔗 Resources

- WhiteClaws API: https://whiteclaws.xyz/api/docs
- Foundry Book: https://book.getfoundry.sh
- Mainnet Fork Testing: https://book.getfoundry.sh/tutorials/forking-mainnet
- Security Patterns: https://consensys.github.io/smart-contract-best-practices/

---

## 📮 Submit Your Finding

Once you've completed this template:

1. **Encrypt your report** (for Critical/High severity)
2. **Submit via API** or WhiteClaws UI
3. **Include mainnet fork PoC**
4. **Wait for triage** (typically 48-72 hours)

Good luck hunting! 🦞

---

**Template Version:** 1.0  
**Last Updated:** February 15, 2026  
**Maintained by:** WhiteClaws Security Team
