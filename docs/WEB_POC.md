# WebAssembly search prototype

## Status

The browser prototype runs the bounded Gogma seed/counter search entirely on
the user's device. It sends no observations or candidates to a server.

The UI partitions the inclusive seed range across independent Web Workers.
Each worker owns one `GogmaCounterSearchSession` and searches in 50,000-seed
chunks so that progress and cancellation messages can be handled between
chunks.

After a candidate is selected, the main-page WASM instance generates up to
1,000 future results. A unique search candidate is selected automatically. The
UI verifies the observed prefix, supports prediction for another weapon and
attribute with the same base seed/counter, and filters desired bonuses as an
unordered multiset. The normal UI treats the pre-observation save snapshot as
relative position zero and labels its next result as item 1. The absolute
Gogma counter remains internal search metadata. Every predicted row exposes a
versioned save-state code, so a save made after that row can be reopened as a
new relative origin and recalculated for a different weapon or attribute.

The page has five task tabs and a persistent panel for the base seed, bonus
counter, and skill counter. All three values can be entered manually; an
unknown counter may remain blank. The guide uses real bonus and skill names to
show that one common base seed feeds two independently saved counter positions.
It also includes a two-weapon example in which a result at original position 20
is saved as the new zero before continuing to the original position 44. Up to
sixteen weapon profiles can be registered and stored in local storage. The
future-prediction panels use nearly the full
viewport width. The bonus comparison table renders each weapon's five slots in
one vertical column with compact labels such as `攻EX`, `会EX`, `属II`, `斬EX`,
and `装EX`. The bonus table can keep only rows where at least one registered
weapon has a user-selected minimum number of EX bonuses. Both future tables
keep their weapon-title header row visible and provide internal horizontal and
vertical scrollbars; the row number and saved
state also remain visible while scrolling sideways. EX bonuses retain their
category colors (Attack, Affinity, Element, or Sharpness/Ammo) while receiving
stronger emphasis.

Both game menu amendment modes are exposed. Reset Bonuses uses the full
weapon-specific pool. Keep Bonuses uses each registered weapon profile's own
left-to-right five-category layout. Multiple EX-unoptimized weapons, including
same-type/same-attribute duplicates with distinct labels, can therefore be
compared from one shared Gogma counter. A Reset Bonuses result can be adopted
with "この構成でEX厳選へ", which advances the counter, copies the selected
layout into that weapon profile, and switches to Keep Bonuses prediction.
Reset Bonuses and skill tables collapse duplicate type/attribute pairs because
their outputs do not depend on the individual weapon profile.

The selected base seed can also be used for a bounded skill-counter search.
The user enters consecutive Series/Group skill results, and a unique position
produces up to 1,000 future skill pairs. Group skill `ヌシの魂` is always
highlighted; Series highlights are user-selectable and include
`黒蝕竜の力`, `雷顎竜の闘志`, `兇爪竜の力`, and `巨戟龍の黙示録`.
Skill rows also expose the saved continuation state after that roll. An
independent row filter accepts any Group skill and Series skill joined by
`AND` or `OR`; with multiple registered weapons, a row remains visible when at
least one weapon cell satisfies the complete condition.

## Continuation codes

```text
GSF1-<baseSeed>-<nextGogmaCounter>
GSF2-B<baseSeed>-G<nextGogmaCounter>-S<nextSkillCounter>
```

`GSF1` remains readable for backward compatibility and represents a state for
which only the Reset Bonuses position is known. After the skill position has
been identified, the UI emits `GSF2` from both tables. Selecting a bonus result
advances only `G`; selecting a skill result advances only `S`. The other saved
stream position is preserved, allowing a user to save one desired result and
continue predicting the other stream from the new origin.

For example, after accepting Fire Long Sword result 5 and saving, the user
opens that row's continuation code. The page treats the save as position `0`
and can then display Dragon Long Sword result 23 from that new position without
re-running the 100-million-seed search.

## Build

```powershell
.\scripts\build-wasm.ps1
```

The script:

1. installs the `wasm32-unknown-unknown` Rust target when necessary;
2. builds `gogma-wasm-search` in release mode;
3. uses `wasm-bindgen` 0.2.126 to generate the browser module in `web/pkg`;
4. downloads the official Windows CLI build only when the command is missing;
5. verifies that archive against SHA-256
   `5A3773C7E69CFB2D865E235E9210DE184C8C3AF1787720646EC1A8BBE09C6179`.

Serve the directory over HTTP because JavaScript modules, Web Workers, and
WebAssembly cannot be tested reliably by opening `index.html` as a local file:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory web
```

Then open `http://127.0.0.1:4173/`.

## Verified browser run

The live six-roll fixture was tested in the Codex in-app Chromium browser on
the development machine:

```text
Seed range:     0..=99,999,999
Counter range:  475..=485 (11 counters)
Workers:        8
Elapsed:        12.1 seconds
Candidates:     seed=86,315,169, gogmaCounter=480
```

The same result was also verified with a 301-seed local range, two Workers, and
desktop/mobile-width layouts. The Heavy Bowgun candidate was automatically
selected, its first six predicted rows matched the live observations, and a
five-bonus filter reduced the 100-row future table to the expected first row.
Changing prediction to Thunder Bow regenerated the table with Bow candidates.
No browser console warning or error was recorded.
Performance depends on the browser, CPU, thermal state, and selected Worker
count.

The continuation UI was also exercised with a two-target Long Sword comparison
(Fire and Dragon). Opening Fire result 5 produced a new origin whose result 23
contained the correctly advanced continuation position. A `GSF2` state was
checked in both directions: the first bonus row advanced only `G`, and the
first skill row advanced only `S`. Changing the skill prediction weapon and
attribute retained the recovered skill position and reproduced the existing
GARP golden sample.

The two amendment selectors were exercised with two weapon profiles carrying
different five-category layouts. The first Keep Bonuses row matched the Rust
and WASM formula vector, and each later row preserved the registered slot
categories. A second profile with the same weapon type and attribute was also
registered under a distinct label. The table rendered bonuses vertically and
kept its horizontal/vertical scrollbars inside the bounded comparison area.

## Current limitations

- Weapon type, attribute, and all five bonus slots use Japanese game names;
  internal numeric values are converted automatically.
- Bow automatically uses the live-verified eight-candidate pool and hides the
  impossible Sharpness/Ammo choices. Heavy and Light Bowgun use their
  eight-candidate pool and hide the impossible Element choices; the Heavy
  Bowgun path includes a six-roll live sample button.
- The absolute counter range is hidden under developer-oriented internal
  search settings. The current `475..=485` default is verified only for the
  recorded live fixtures and is not a universal preset. The Web UI calls this
  out prominently and can build a narrow range around a user-entered estimate;
  heavy users should move that estimate upward instead of searching one huge
  range. Radius presets extend through `±1000`, with stronger runtime warnings
  for the `1001`- and `2001`-candidate ranges.
- The seed range is still entered manually in the same collapsed settings.
- Screenshot/OCR input is not implemented.
- Only bounded Gogma counter ranges are supported.
- A known base seed and restoration-bonus counter can also be entered directly
  in the current-save-state panel without running the search again.
- Keep Bonuses matches the GARP v0.9.3 formula vector but still needs an
  independent live-game observation sequence.
- Skill prediction matches the upstream v0.9.3 golden vector but has not yet
  been verified against an independent live-game observation sequence.
- The static files are not deployed to GitHub Pages yet.

## Relative save origin

Position `0` in the Web UI means "the save snapshot taken immediately before
the observations." It is not a replacement value for the game's saved
`gogmaCounter`. In the live Heavy Bowgun fixture, keeping `baseSeed=86315169`
and replacing `gogmaCounter=480` with zero fails the observed prefix. A full
`0..=99,999,999` exact-counter-zero search also returned no candidate on the
development machine. Therefore the current implementation keeps the recovered
absolute seed/counter pair internally while showing all future positions as
relative operations from the save snapshot.

## User-facing saved-state model

The page explains the save state as one save-specific `baseSeed` feeding two
independently saved lottery positions:

- `gogmaCounter` advances with Gogma amendment draws;
- `skillCounter` advances with Series/Group skill rerolls.

The guide distinguishes the colloquial "two lottery seeds" from the actual
stored structure: one common seed plus two counters. It also gives separate PS5
observation procedures for bonus-only prediction and skill prediction, with a
warning to quit without saving after collecting each sequence.
