# EFX MasterChef

MasterChef of the EFX PancakeSwap kitchen.

Distributes EFX Tokens to PCS liquidity providers.

## Deployments

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
