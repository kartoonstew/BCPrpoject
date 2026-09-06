# Equipment calculations and house rules

The shared ES5 engine in `conditional-rules.js` runs both in the workshop and inside the PDF calculation script. Inputs are stored in drafts and JSON backups. Every download contains saved field values and appearance streams, so reading them needs no JavaScript. Preview and LibreOffice users should change the web draft and export again to recalculate. Edits made in the PDF do not sync back.

## Automatic rules

- Armor selection calculates light/medium/heavy AC, Dexterity caps, shields, armor/shield magic bonuses, Defense and Bird Bones. Unarmored does not receive armor magic or Defense. Manual AC is a final value, with no equipment additions. All Brothers have light/medium/shield training; heavy training follows the four campaign subclasses.
- Armor Stealth disadvantage is a separate roll state, never a reduction of the numeric skill bonus. Untrained armor marks all Strength/Dexterity D20 tests as disadvantaged and warns that spellcasting is unavailable. Missing required Strength reduces speed by 10 feet. Mithral removes the armor's Strength and Stealth restrictions, not the training requirement.
- Four SRD Fighting Styles: Defense, Archery, Great Weapon Fighting and Two-Weapon Fighting. Archery applies to Ranged weapons, not thrown Melee weapons. Great Weapon Fighting supplies a damage-die reminder, not a flat damage bonus. Other styles can be recorded manually.
- Three weapon configurations with 23 optional presets. Presets only fill editable inputs after selection. Melee, Ranged and Thrown melee distinguish the weapon's classification from its attack. Finesse chooses the higher Strength/Dexterity modifier unless an ability is explicitly selected. Campaign Scrappers can use finesse with non-heavy Melee weapons. The same ability determines damage. All configured weapons assume Brother simple/martial proficiency; use Manual or final overrides for untrained or exceptional attacks.
- Versatile notation such as `1d8/1d10 slashing` switches to the second dice only for a two-handed melee attack with the Versatile property. Heavy weapon requirements mark disadvantage. Loading and incompatible hand/shield choices produce reminders. Selecting Light extra attack removes positive ability damage unless Two-Weapon Fighting applies; negative modifiers remain. Mastery presets are reminders and do not confer mastery training. Nick does not grant an additional extra attack.
- Exhaustion uses 2024 rules: each level reduces D20 rolls by 2 and speed by 5 feet; level 6 warns of death. It affects automatic skills, saves, initiative, attacks and death-check adjustment, not ability modifiers, proficiency, damage, DCs or resource maxima. Passive Perception is not a D20 roll and is not reduced by this direct roll penalty. Manual weapon totals and explicit initiative overrides are final values; include exhaustion in them yourself.
- Campaign effects: Bird Bones armor penalty; Bump Iron Cocoon damage reduction reminder in heavy armor; Soak heavy-armor eligibility reminder; Shieldwall self AC bonus with shield at level 7; Payday Fury heavy-armor restriction; Salt Survivor proficiency added to death checks at level 3. Activated effects and adjacent-ally benefits are not silently activated.

## House rules

Turn **Enable house rules** On to apply the optional replacements. Nonblank AC, speed and weapon totals replace final values, including zero. Per-weapon and Stealth roll settings force Normal, Advantage or Disadvantage. Armor training can be forced, and armor Stealth/Strength or exhaustion penalties can be ignored independently. Auto retains the base rule. Custom selections and values remain stored while the switch is Off.

The active-effects summary identifies the switch and replacements, followed by underlying rule reminders. A forced roll state takes precedence over those reminders. The reason field documents the house rule. Presets preserve manual override fields, so reviewing existing overrides is appropriate when changing weapon loadouts.

The two equipment configuration pages keep advanced inputs off the combat page. Calculated results are read-only PDF fields; manual values and override inputs remain editable. In scripting-capable readers they recalculate immediately. Ability descriptions, style reference text and continuation notes are export snapshots: re-export to refresh them after changes.

This batch does not automate general conditions, spells, banners/auras, Fury/Soak activation, ammunition inventory, weight/encumbrance, feat-specific exceptions, resource consumption or rest recovery. Use notes and overrides for these pending further choices.

## Sources

- [Official SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf): Fighting Styles pp. 87–88, equipment pp. 89–92, Exhaustion p. 181, Mithral Armor p. 231.
- [2024 Basic Rules: Equipment](https://www.dndbeyond.com/sources/dnd/br-2024/equipment)
- [2024 Basic Rules: Rules Glossary](https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary)
- Campaign source: supplied `BC PHB 1.14.pdf`, normalized in `data/rules.json`.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Mechanical tables and rule summaries above are adaptations.
