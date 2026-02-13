# WhiteClaws Contract Wiring Guide

When contracts are compiled and deployed to Base, this is the **only change needed** to activate the entire onchain layer.

## Step 1: Paste Addresses

Edit `lib/web3/config.ts`:

```typescript
export const CONTRACTS = {
  accessSBT: '0x_YOUR_ACCESS_SBT_ADDRESS_HERE',     // ← paste
  wcToken: '0x_YOUR_WC_TOKEN_ADDRESS_HERE',          // ← paste
  airdropClaim: '0x_YOUR_CLAIM_CONTRACT_ADDRESS_HERE', // ← paste
  usdcToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC (already set)
}
```

## Step 2: Drop ABIs

Copy compiled ABI JSON files into:

```
lib/web3/contracts/abis/
├── AccessSBT.json
├── WCToken.json
└── AirdropClaim.json
```

## Step 3: What Auto-Activates

Once `CONTRACTS.accessSBT !== null`:

| Function | Before | After |
|----------|--------|-------|
| `mintSBT()` | Records in Supabase only | Calls contract + records in Supabase |
| `hasSBT()` | Checks Supabase | Checks onchain + Supabase |
| `useAccessStatus()` | Supabase lookup | Onchain verification |

Once `CONTRACTS.wcToken !== null`:

| Function | Before | After |
|----------|--------|-------|
| `useTokenBalance()` | Returns "0" | Reads ERC-20 balanceOf |
| Payment routing | Supabase records only | Contract processes USDC/ETH/$WC |

Once `CONTRACTS.airdropClaim !== null`:

| Function | Before | After |
|----------|--------|-------|
| `hasClaimed()` | Returns false | Reads onchain claim status |
| `getVestingInfo()` | Returns zeros | Reads vesting schedule |
| Claim page | Shows "Not Yet Open" | Shows claim button with Merkle proof |

## Step 4: Update ABI Imports

In `lib/web3/contracts/access-sbt.ts`:
```typescript
import AccessSBTAbi from './abis/AccessSBT.json'
// Replace the stub ABI with the real one
```

In `lib/web3/contracts/airdrop-claim.ts`:
```typescript
import AirdropClaimAbi from './abis/AirdropClaim.json'
// Replace the stub ABI with the real one
```

## What Does NOT Change

- No API route changes
- No frontend component changes
- No database schema changes
- No hook changes
- No auth flow changes

Everything is built to work with Supabase today and auto-activate onchain when addresses are set.

## AccessSBT Contract Requirements

The AccessSBT contract should implement:

```solidity
function mint(address to) external payable  // or with USDC/WC approval
function balanceOf(address owner) external view returns (uint256)
function tokenOfOwner(address owner) external view returns (uint256)
// Soulbound: override transfer functions to revert
```

Accepts: ETH (native), USDC (ERC-20 approval), or $WC (ERC-20 approval)
Price: $20 equivalent (contract handles conversion)

## AirdropClaim Contract Requirements

```solidity
function claim(uint256 amount, bytes32[] calldata proof) external
function hasClaimed(address account) external view returns (bool)
function merkleRoot() external view returns (bytes32)
function vestingSchedule(address account) external view returns (
    uint256 total, uint256 claimed, uint256 remaining, uint256 nextUnlock
)
```

Standard OpenZeppelin MerkleClaim pattern with added vesting.
