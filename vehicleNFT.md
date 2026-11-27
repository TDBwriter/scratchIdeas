# vehicleNFT: the car that broadcasts itself

Working title: **ChainPlate**, a second license plate that the car writes itself.

## The pitch

Custom software on a small computer in the car gives the vehicle its own cryptographic identity, minted as an NFT. The car then *broadcasts* that identity. Over Bluetooth it reaches phones and cars nearby. Over cellular it reaches the chain. What it carries is a living record: miles, mods, service, builds, races, and every owner it has had.

The NFT isn't a JPEG of the car. It's the car's voice.

## What "broadcast as NFT" means here

Three layers:

1. **Identity.** An ERC-721 token is minted once per vehicle. Whoever holds the token is the owner, and the token's metadata is the build sheet.
2. **Voice.** A key pair is created inside a secure chip in the car and never leaves it, so only the car can sign as the car. The owner holds the token. The car holds the pen.
3. **Broadcast.**
   - **Near:** a BLE beacon. Scan a car at a meet, see the build, and confirm it's really that car and not a clone. Your phone sends a challenge and the car signs it.
   - **Far:** the car signs a snapshot every so often (odometer, health, mods) and pins it to IPFS/Arweave. The snapshot's hash is anchored on an L2. Each metadata change fires an ERC-4906 `MetadataUpdate` event, so wallets and marketplaces refresh.

Optional: an **ERC-6551 token-bound account** gives the car NFT its own wallet. The car collects service stamps from mechanics and "spotted" badges from meets. It can also pay for charging, tolls and parking itself.

## Architecture sketch

```
 [Vehicle CAN / OBD-II] --(listen-only)--> [ChainPlate box]
                                            |- secure element  (car's private key, never leaves)
                                            |- GPS
                                            |- BLE radio  ----> phones / other cars nearby
                                            '- LTE / phone tether ----> pinning service
                                                                            |
                                                                            v
                                                                     L2 contract
                                                                     (ERC-721 + ERC-4906
                                                                      + ERC-6551 account)
```

**Hardware (bench prototype):**
- Raspberry Pi Zero 2 W or ESP32-S3
- CAN HAT (MCP2515) in listen-only mode, *or* an ELM327-style OBD-II dongle
- Secure element (ATECC608 or similar) that holds the car's key
- GPS module
- LTE modem, or tether to the owner's phone and skip the modem

**Software modules:**
- `bus-listener`: reads the VIN, trouble codes, fuel/charge level and RPM (to detect when a drive starts and ends). It reads the odometer too, through the standard OBD-II PID `0xA6` where the car supports it, otherwise through manufacturer-specific PIDs. It never transmits on the bus.
- `signer`: wraps the secure element and signs snapshots with a monotonic counter, so readings can't be replayed or rolled back.
- `beacon`: BLE advertising plus challenge-response over GATT.
- `anchor`: batches snapshots, pins them, and anchors one hash per batch to keep gas cheap.
- `companion app`: the owner picks a privacy mode and approves mints and transfers. Everyone else gets a scanner.

## Example payloads

**BLE advert.** A 64-byte signature won't fit in a legacy 31-byte advert. The advert carries a rotating ephemeral ID instead, and anyone who wants to verify the car connects and runs a challenge-response:

```
advert:     [ ephemeral_id (rotates every ~15 min) | mode flag ]
handshake:  scanner -> car : nonce
            car -> scanner : token_id, chain_id, contract, sig(nonce || token_id)
```

**Signed snapshot** (pinned off-chain, hash anchored on-chain):

```json
{
  "token_id": 1337,
  "seq": 48211,
  "odometer_km": 182044,
  "dtc": [],
  "mods": ["coilovers", "turbo-kit-v2"],
  "geohash": null,
  "ts": "2026-11-27T22:15:00Z",
  "sig": "0x..."
}
```

**Token metadata** (`tokenURI`):

```json
{
  "name": "'91 Hatch \"Night Sky\"",
  "description": "Four owners, two engines, one soul.",
  "image": "ipfs://.../livery.png",
  "attributes": [
    { "trait_type": "Make", "value": "..." },
    { "trait_type": "Odometer (km)", "value": 182044, "display_type": "number" },
    { "trait_type": "Owners", "value": 4, "display_type": "number" },
    { "trait_type": "Last service", "value": "2026-10-02" }
  ],
  "vin_commitment": "0x<salted hash of VIN>"
}
```

## Guardrails (non-negotiable)

- **Listen-only on the bus.** ChainPlate never transmits onto CAN. That keeps it away from anything safety-critical and out of emissions and tamper law. Enforce it in hardware: put the transceiver in silent mode, or limit the dongle to read-only PIDs.
- **Raw location never goes on-chain.** Chains are forever, and a public trail of where a car sleeps at night is a stalking tool. The only option is an opt-in, coarse, time-delayed geohash.
- **Privacy modes, default Ghost:**
  - *Ghost:* no broadcast at all.
  - *Meet:* BLE on, ephemeral ID, and the token is revealed only during a handshake.
  - *Public:* BLE plus far broadcast.
- **Rotating BLE IDs.** A static beacon could be used to follow a car across a city.
- **The VIN goes on-chain only as a salted commitment.** The owner can reveal the salt to a buyer to prove which car it is.
- **The NFT is not the legal title** (in most places). Present it as provenance, not ownership paperwork. When the car sells, the app should nudge the owner to transfer the token, but the DMV still rules.
- **Don't overclaim on sensors.** The box can prove that *it* signed a reading, not that the reading is true. Make tampering harder (monotonic counters, checking GPS distance against the odometer change), and say so honestly.
- **Theft mode.** A thief who takes the car doesn't get the token. The owner can flag the token as reported stolen, and the car then reports its location *encrypted to the owner only*. This is exactly the tracking ability the other guardrails restrict, so only the owner can decrypt it.

## Why anyone would want this

- **Used-car buyers:** tamper-evident mileage and service history that travels with the car, not with someone's account on a history site.
- **Car culture:** builds become collectibles. Scan cars at a meet and collect "spotted" badges in your wallet while the car collects them too. Legendary builds pile up provenance, as in "this is the car that won X."
- **Shops and builders:** a shop signs a service stamp into the car's token-bound account, which builds reputation for both of them.
- **EVs, tolls, parking:** the car's own account pays.
- **Art:** the livery is the token image, and the art can weather dynamically as the miles add up.

## Story hooks

- **The car in theCloud** (see `Binary.md`): the network ignores unsigned messages. A car whose chain doesn't match is unsigned, which means no tolls, no charging, and no meets. It's a ghost on the road.
- **Scars on-chain:** street racers whose cars carry their history. A race win is a signed handshake between two cars' keys at the finish line, witnessed by every phone in the crowd.
- **The silent car:** a thief can drive a stolen car but can't make it speak. It goes dark on the network, and the silence is how the crew finds it.
- **Corpos want the feed** (see `scratch0`): insurers want to buy every car's telemetry stream. The underground runs Ghost mode by default and trades only what it chooses to.

## Open questions

- Which chain? A cheap L2 (Base, Optimism, Arbitrum, Polygon) or an app-chain? It comes down to the gas cost per batch against how often snapshots are anchored.
- Who is allowed to mint for a given VIN? If the first device wins, there needs to be a dispute path, maybe an attestation from a shop or the DMV.
- Hardware dies. Replacing the box means rotating the car's key, signed by the owner's wallet and recorded on-chain.
- What happens when two boxes claim the same VIN?
- Fleet and rental mode: one owner, many drivers.
- Should the broadcast be visual too, such as an e-ink or LED plate frame that shows a QR code for the token?

## Next steps

1. **Bench prototype:** Pi + OBD-II dongle + BLE beacon with no chain yet, just signed snapshots and a phone scanner that verifies the challenge-response.
2. **Testnet contract:** ERC-721 + ERC-4906 + ERC-6551 account. Mint one token for a test car and push metadata updates.
3. **Companion app:** privacy modes, mint/transfer approvals, and the scanner.
4. **Field test** at a car meet.
