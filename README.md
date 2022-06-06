# EFX MasterChef

MasterChef of the EFX PancakeSwap kitchen.

Distributes EFX Tokens to PCS liquidity providers.

## Deployments

### BSC Mainnet

#### MasterChef
#1:
0xE2F0627DCA576CCdbce0CED3E60E0E305b7D4E33

#2:
0xb8326DCe706DF2D14f51C6B2f2013B6490B6ad57

#3:
0x85545106c90D502C108F38B7eb9A8ec265F07415

#4:
0x2ee04Eb081C6548BDDb729d64AA2912375882735

#### EFX Token
0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0

### BSC Testnet

#### MasterChef
0x9d29dB5798B8A6913542556b93b1c12bE702Ddd4

#### EFX Token
0xAe39A0369ED22D75Cc62666ad2978C1D1ba3450E

## Differences from PCS MasterChef

EfxMasterChef operates in a slightly different way:

- There is no ~syrup~. EFX is his sole ingredient.
- No contributions to ~devaddr~, all rewards go to LPs.
- He receives tokens from the DAO and keeps them safe in storage. No minting.
- He doesn't have a migrator. He has a fixed purpose and can do without this
  risk factor.
