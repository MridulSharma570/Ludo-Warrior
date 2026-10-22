# ⚔️ LUDO WARRIOR — Imperial Strategic Board Arena

**Ludo Warrior** is a high-detail, 100% ad-free strategic board game inspired by Ludo King and elevated with custom royal war-table visuals, 3D tactile dice, tactical Warrior Abilities, Grandmaster AI, and real-time online multiplayer via Socket.IO.

---

## ✨ Key Features

### 1. Four Playable Game Modes
- **⚔️ Warrior Battle Mode (Exclusive):** Build **Warrior Rage (0–100)** on every roll, step, and capture. Unleash tactical abilities:
  - **⚡ Swift Charge (+2 Steps):** Boosts your next move by +2 extra tiles.
  - **🛡️ Aegis Shield:** Surrounds your warrior in a protective forcefield for 2 rounds that repels enemy captures.
  - **🎲 Sovereign Reroll:** Reset an unfavorable dice roll and cast again.
  - **🔥 Battlefield Power Orbs:** Step on glowing runes along the perimeter for instant Rage surges, shields, or bonus rolls.
- **👑 Classic Royal Mode:** Authentic Ludo rules — roll a 6 to deploy from your Fortress Yard, navigate the 52-tile perimeter, and ascend all 4 warriors into the central Imperial Citadel.
- **⚡ Quick Blitz Rush:** Fast-paced 5-minute matches! 1 warrior starts pre-deployed on your starting safe square, and ascending just **2 warriors** into the Citadel wins the match.
- **🛡️ 2v2 Team Alliance:** **Crimson Vanguard (Red) & Solar Sovereign (Yellow)** vs. **Emerald Sentinel (Green) & Azure Tempest (Blue)**. Allies share tiles safely without capturing each other, and once you finish all your own warriors, your dice rolls command your partner's tokens.

### 2. Real-Time Online Multiplayer & Local Modes
- **🌐 Real-Time Online Multiplayer (Socket.IO):**
  - **Private 6-Character Room Codes** (e.g. `WAR782`) to share with friends.
  - **Quick Public Matchmaking Queue** & live lobby directory.
  - **AI Warlord Backfill:** Start an online room immediately and fill any remaining slots with server-authoritative AI bots.
  - **Live War Cries & Animated Emoji Reactions:** Broadcast floating emotes and tactical callouts across all players.
- **🤖 Vs. Computer AI:** Choose between *Recruit*, *Tactician*, and *Warlord (Grandmaster)* AI evaluation engines.
- **👥 Pass & Play:** 2 to 4 human commanders on the same device (or any mix of humans and AI bots).

### 3. High-Detail Visuals & Procedural Audio
- **Imperial Armory & Customization:** Unlock and equip 4 War-Table Board Arenas (*Imperial Obsidian*, *Celestial Astral Sanctum*, *Ancient Jade Dynasty*, *Cyber Valhallan Forge*) and 3 3D Warrior Pawn Skins (*Royal Crowned Shields*, *Elemental War Totems*, *Astral Vanguard Helms*) using free Match Gold.
- **Hop-by-Hop Parabolic Token Animations** & **Hover Trajectory Arcs** with capture target indicators.
- **Procedural Web Audio Synthesizer:** Zero-latency dice clatter, rising musical step hops, sword-clash capture impacts, sanctuary chimes, and victory fanfares.

### 4. Dormant Monetization & Store Pipeline (`OFF` by Default)
- All purchase-related systems (Gold/Gem packs, Seasonal Imperial War Pass, Sovereign VIP Membership, and Checkout Hooks) are architected in `src/config/monetizationPipeline.ts` and `/api/pipeline/monetization`.
- All monetization flags default to **`false` (`PIPELINE OFF`)** and **`ZERO_ADS_ENFORCED: true`** for future upgrades.

---

## 🚀 Running the Project

```bash
npm install
npm run dev
```
