import * as Utils from "../flyff/flyffutils";
import ItemElem from "../flyff/flyffitemelem";
import Context from "../flyff/flyffcontext";

/**
 * Create a tooltip for the given item or skill
 * @param {object} content The item or skill
 * @param {object} i18n Localization
 * @returns a JSX element conatining the tooltip
 */
export function createTooltip(content, i18n) {
    if (content instanceof ItemElem) {
        return setupItem(content, i18n);
    }
    else if (content.passive != undefined) {
        return setupSkill(content, i18n);
    }
    else if (content.consumedPoints != undefined) {
        return setupPartySkill(content, i18n);
    }
    else {
        return setupHousingNpc(content, i18n);
    }
}

/**
 * Get the tooltip text for the given item
 * @param {ItemElem} itemElem The item elem
 * @param {object} i18n Localization
 */
function setupItem(itemElem, i18n) {
    const out = [];
    const itemProp = itemElem.itemProp;
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    const isUltimate = itemProp.rarity == "ultimate";

    if (isUltimate) {
        out.push(<img src="/ultimate-icon.png" style={{ height: "18px" }} className="rainbow-background"></img>);
    }

    // Ultimate jewels

    for (let i = 0; i < itemElem.getMaximumUltimateJewelSlots(); ++i) {
        if (i < itemElem.ultimateJewels.length) {
            out.push(<img src={`https://api.flyff.com/image/item/${itemElem.ultimateJewels[i].itemProp.icon}`} style={{ height: "18px", marginLeft: 3 }} className="rainbow-image"></img>);
        }
        else {
            out.push(<img src={`https://api.flyff.com/image/item/placeholderjewel.png`} style={{ height: "18px", marginLeft: 3 }}></img>);
        }
    }

    // Name

    if (isUltimate) {
        out.push(<br />); // Line break for all the ultimate tag and jewels
    }

    const statAwakeString = Utils.getStatAwakeTitle(itemElem, i18n);

    out.push(<span style={{
        fontWeight: 700,
        color: Utils.getItemNameColor(itemProp)
    }}>{itemProp.name[shortLanguageCode] ?? itemProp.name.en} {statAwakeString}</span>);

    // TODO: Origin awakes (STA+, etc.)

    if (itemElem.upgradeLevel > 0) {
        out.push(<span style={{ color: Utils.getItemNameColor(itemProp), fontWeight: 700 }}> +{itemElem.upgradeLevel}</span>);
    }

    if (itemElem.piercings.length > 0) {
        out.push(<span style={{ color: "#d386ff" }}> ({itemElem.piercings.length}/{itemElem.piercings.length})</span>)
    }

    // TODO: Lifestyle stuff

    // Pets

    if (itemProp.category == "raisedpet") {
        out.push("\n[Raised Pet]");
    }
    else if (itemProp.category == "pickuppet") {
        out.push("\n[Pick-Up Pet]");
    }
    else if (itemProp.category == "weapon") {
        if (itemProp.twoHanded) {
            out.push(`\n${i18n.t("tooltip_two_handed")}`)
        }
        else {
            out.push(`\n${i18n.t("tooltip_one_handed")}`)
        }
    }

    // Sex

    if (itemProp.sex == "male") {
        out.push(`\n${i18n.t("tooltip_sex_male")}`);
    }
    else if (itemProp.sex == "female") {
        out.push(`\n${i18n.t("tooltip_sex_female")}`);
    }

    // Attack & Defense

    let baseAbility = {};
    let isAttack = false;
    if (itemProp.minAttack != undefined && itemProp.maxAttack != undefined) {
        baseAbility.min = itemProp.minAttack + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxAttack + Context.player.getStat("maxability", false);
        isAttack = true;
    }
    else if (itemProp.minDefense != undefined && itemProp.maxDefense != undefined) {
        baseAbility.min = itemProp.minDefense + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxDefense + Context.player.getStat("maxability", false);
    }

    if (baseAbility.min != undefined) {
        const mul = itemElem.getUpgradeMultiplier();
        let add = 0;
        const upgradeLevel = itemElem.upgradeLevel + (itemProp.rarity == "ultimate" ? 10 : 0);
        if (upgradeLevel > 0) {
            add = Math.floor(Math.pow(upgradeLevel, 1.5));
        }

        const ability = {
            min: Math.floor(baseAbility.min * mul) + add,
            max: Math.floor(baseAbility.max * mul) + add
        };

        const baseStyle = { color: "#ffffff" };
        if (mul > 1.0) {
            baseStyle.color = "#00ffe1";
        }
        else if (mul == 1) {
            baseStyle.color = "inherit";
        }
        else if (mul >= 0.8) {
            baseStyle.color = "#00ff00";
        }
        else if (mul >= 0.6) {
            baseStyle.color = "#ff0000";
        }
        else {
            baseStyle.color = "#b2b2b2";
        }

        if (isAttack) {
            out.push(`\n${i18n.t("tooltip_attack")}`);
        }
        else {
            out.push(`\n${i18n.t("tooltip_defense")}`);
        }

        out.push(<span style={baseStyle}>{ability.min} ~ {ability.max}</span>);

        if (baseAbility.min != ability.min || baseAbility.max != ability.max) {
            if (isAttack) {
                out.push(`\nBase Attack: `);
            }
            else {
                out.push(`\nBase Defense: `);
            }

            out.push(<span style={{ color: "#b2b2b2" }}>{ability.min} ~ {ability.max}</span>);
        }
    }

    // Blessings

    if (itemProp.category == "fashion") {
        const hasBlessing = itemElem.randomStats.find((e) => e);

        if (hasBlessing) {
            out.push(<span style={{ color: "#d386ff" }}><br />{i18n.t("tooltip_blessing")}</span>);
        }

        for (const blessing of itemElem.randomStats) {
            if (blessing) {
                out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(blessing.parameter, i18n)}+{blessing.value}{blessing.rate ? "%" : ""}</span>);
            }
        }
    }

    if (itemProp.attackSpeed != undefined) {
        out.push(`\n${i18n.t("tooltip_attack_speed")}${itemProp.attackSpeed}`);
    }

    // Element

    if (itemElem.element != "none" && itemElem.elementUpgradeLevel > 0) {
        out.push(<span style={{ fontWeight: itemElem.hasElementStone ? 800 : 'inherit' }}><br />{itemElem.element}+{itemElem.elementUpgradeLevel}</span>);
    }
    if (itemProp.element != "none") {
        out.push(`\n${i18n.t("tooltip_element")}${itemProp.element}`);
    }

    // Stats

    if (itemProp.category != "recovery"
        && itemProp.category != "trans"
        && itemProp.category != "buff"
        && itemProp.category != "scroll"
        && itemProp.abilities != undefined) {
        const abilityStyle = { color: "#ffeaa1" };

        if (itemElem.statRanges.length == 0) {
            for (const ability of itemProp.abilities) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
        else {
            for (const ability of itemElem.statRanges) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.value}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }

                out.push(<span style={abilityStyle}> ({ability.add}~{ability.addMax})</span>);

                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
    }

    // Ultimate stats

    if (itemProp.possibleRandomStats != undefined) {
        for (const stat of itemElem.randomStats) {
            out.push(<span style={{ color: "#ffff00" }}><br />{Utils.getStatNameByIdOrDefault(stat.parameter, i18n)}+{stat.value}{stat.rate ? "%" : ""}</span>);
        }
    }

    for (const statAwake of itemElem.statAwake) {
        if (statAwake != null) {
            out.push(`\n${Utils.getStatNameByIdOrDefault(statAwake.parameter, i18n)} +${statAwake.value}`);
        }
    }

    // Jewelery stats

    if (itemProp.category == "jewelry" && itemProp.upgradeLevels != undefined) {
        const abilityStyle = { color: "#ffeaa1" };
        for (const ability of itemProp.upgradeLevels[itemElem.upgradeLevel].abilities) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
            if (ability.rate) {
                out.push(<span style={abilityStyle}>%</span>);
            }
        }
    }

    // TODO: itemElem origin awake here

    // Armor set upgrade

    if (itemProp.category == "armor") {
        const upgradeLevel = Context.player.getArmorSetUpgradeLevel();
        if (upgradeLevel > 0) {
            const bonus = Utils.getUpgradeBonus(upgradeLevel);
            for (const ability of bonus.setAbilities) {
                out.push(<span><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span>%</span>);
                }
            }
        }
    }

    // Medicine

    if (itemProp.category == "recovery" && itemProp.abilities != undefined) {
        for (const ability of itemProp.abilities) {
            switch (ability.parameter) {
                case "fp":
                    out.push(`\n${i18n.t("tooltip_restore_fp")}${ability.add}`);
                    break;
                case "mp":
                    out.push(`\n${i18n.t("tooltip_restore_mp")}${ability.add}`);
                    break;
                default:
                    out.push(`\n${i18n.t("tooltip_restore_hp")}${ability.add}`);
                    break;
            }
        }

        // TODO: Effective restoration. Not included in API
    }

    // Couple

    if (itemProp.subcategory == "couplering") {
        const style = { color: "#d386ff" };
        if (itemProp.coupleTeleports != undefined && itemProp.coupleTeleports > 0) {
            out.push(<span style={style}><br />Teleports: {itemProp.coupleTeleports}</span>);
        }
        if (itemProp.coupleCheers != undefined && itemProp.coupleCheers > 0) {
            out.push(<span style={style}><br />Cheers: {itemProp.coupleCheers}</span>);
        }
        if (itemProp.coupleBankSlots != undefined && itemProp.coupleBankSlots > 0) {
            out.push(<span style={style}><br />Storage slots: {itemProp.coupleBankSlots}</span>);
        }
    }

    // Job

    if (itemProp.class != undefined) {
        const job = Utils.getClassById(itemProp.class);
        if (job != undefined) {
            out.push(`\n${i18n.t("tooltip_required_job")}${job.name[shortLanguageCode] ?? job.name.en}`);
        }
    }

    // Level

    if (itemProp.level != undefined && itemProp.level > 1) {
        out.push(`\n${i18n.t("tooltip_required_level")}${itemProp.level}`);
        let levelsBelowRequirement = itemProp.level - Context.player.level;
        if (levelsBelowRequirement >= 1 && levelsBelowRequirement <= 5) {
            out.push(<span style={{ color: "#ff0000" }}> (-5)</span>);
        } 
        else if (levelsBelowRequirement >= 6 && levelsBelowRequirement <= 10) {
            out.push(<span style={{ color: "#ff0000" }}> (-10)</span>);
        }
    }

    // Required material item level

    if (itemProp.category == "material" && itemProp.minimumTargetItemLevel != undefined) {
        out.push(<span style={{ color: "#9e9e9e" }}><br />Required Target Level: {itemProp.minimumTargetItemLevel}</span>);
    }

    // TODO: itemElem pet stuff
    if (itemProp.category == "raisedpet") {
        const pet = itemElem;
        const petDefinition = Utils.getPetDefinitionByItemId(pet.itemProp.id)

        out.push(<span style={{ color: '#009e00' }}><br />Tier: {Utils.getPetTierByLevels(pet.petStats)} Tier</span>)
        out.push(<span style={{ color: '#ff0000' }}><br />Bonus: {`${Utils.getStatNameByIdOrDefault(petDefinition.parameter, i18n)} +${Utils.getPetStatSum(petDefinition, pet.petStats)}${petDefinition.rate ? '%' : ''}`}</span>)
        out.push(<span style={{ color: '#007fff' }}><br />({Object.values(pet.petStats).map((lv) => lv ? `Lv${lv}` : null).filter(_ => _).join('/')})</span>)

        out.push(<span style={{ color: '#7878dc' }}><br />Exp: 99.99%</span>)

        const petTier = Object.values(pet.petStats).filter((tier) => tier != null).length;
        out.push(<span style={{ color: '#ff0a0a' }}><br />Energy: {petDefinition.tiers[petTier - 1].maxEnergy} / {petDefinition.tiers[petTier - 1].maxEnergy}</span>)
    }

    // Rarity

    out.push(`\n${i18n.t("tooltip_rarity")}`);
    out.push(<span style={{ color: Utils.getItemNameColor(itemProp) }}>{itemProp.rarity}</span>);

    // Description

    if (itemProp.description.en != "null") {
        if (itemProp.category == "raisedpet") {
            out.push(<span style={{ color: "#d386ff" }}><br />{itemProp.description[shortLanguageCode] ?? itemProp.description.en}</span>);
        }
        else {
            out.push(`\n${i18n.t("tooltip_description")}${itemProp.description[shortLanguageCode] ?? itemProp.description.en}`);
        }
    }

    if (itemProp.subcategory == "visualcloak") {
        out.push("\nCan be worn over another cloak.");
    }

    // Buff items

    if (itemProp.category == "buff") {
        for (const ability of itemProp.abilities) {
            out.push(<span style={{ color: "#ffeaa1" }}><br />{ability.parameter}+{ability.add}{ability.rate && "%"}</span>);
        }
    }

    // Cooldown

    if (itemProp.cooldown != undefined) {
        out.push(`\nCooldown: ${itemProp.cooldown} seconds`);
    }

    // Equip sets

    if (itemProp.category == "armor" || itemProp.category == "jewelry") {
        const set = Utils.getEquipSetByItemId(itemProp.id);
        if (set != null) {
            const equippedCount = Context.player.getEquipSetPieceCountByItem(itemProp);
            out.push(`\n\n${set.name[shortLanguageCode] ?? set.name.en} (${equippedCount}/${set.parts.length})`);

            for (const part of set.parts) {
                const item = Utils.getItemById(part);
                if (item != undefined) {
                    out.push(<span style={{ color: "#01ab19" }}><br />    {item.name[shortLanguageCode] ?? item.name.en}</span>);
                }
            }

            const bonusStyle = { color: "#ff9d00" };
            const bonuses = {};

            // Accumulate all bonuses first then emit their sum
            for (const bonus of set.bonus) {
                if (bonus.equipped > equippedCount) {
                    continue;
                }

                const bonusKey = `${Utils.getStatNameByIdOrDefault(bonus.ability.parameter, i18n)}.${bonus.ability.rate ? 'Y' : 'N'}`;

                if (bonuses[bonusKey] == undefined) {
                    bonuses[bonusKey] = bonus.ability.add;
                }
                else {
                    bonuses[bonusKey] += bonus.ability.add;
                }
            }

            for (const [key, bonus] of Object.entries(bonuses)) {
                const [parameter, rateString] = key.split('.');
                const rate = rateString === 'Y';

                out.push(<span style={bonusStyle}><br />Set Effect: {Utils.getStatNameByIdOrDefault(parameter, i18n)} +{bonus}</span>);
                if (rate) {
                    out.push(<span style={bonusStyle}>%</span>);
                }
            }
        }
    }

    // Skill awakes

    if (itemElem.skillAwake != null) {
        if (itemElem.skillAwake.skill != undefined) {
            const skill = Utils.getSkillById(itemElem.skillAwake.skill);
            out.push(<span style={{ color: "#ff007b" }}><br />{skill.name[shortLanguageCode] ?? skill.name.en} damage+{itemElem.skillAwake.add}%</span>)
        }
        else if (itemElem.skillAwake.parameter != undefined) {
            out.push(<span style={{ color: "#ff007b" }}><br />{Utils.getStatNameByIdOrDefault(itemElem.skillAwake.parameter, i18n)}+{itemElem.skillAwake.add}%</span>)
        }
    }

    // Piercings

    // Collect bonuses
    const piercingBonuses = {};
    for (const card of itemElem.piercings) {
        if (card == null || card.itemProp.abilities == undefined) {
            continue;
        }

        for (const ability of card.itemProp.abilities) {
            if (ability.parameter in piercingBonuses) {
                piercingBonuses[Utils.getStatNameByIdOrDefault(ability.parameter, i18n)].add += ability.add;
            }
            else {
                piercingBonuses[Utils.getStatNameByIdOrDefault(ability.parameter, i18n)] = { ...ability };
            }
        }
    }

    for (const [parameter, effect] of Object.entries(piercingBonuses)) {
        out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(parameter, i18n)}+{effect.add}{effect.rate && "%"}</span>);
    }

    // Ultimate jewels

    for (const jewel of itemElem.ultimateJewels) {
        //#00c8ff
        for (const ability of jewel.itemProp.abilities) {
            out.push(<span style={{ color: "#00c8ff" }}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}{ability.rate && "%"}</span>);
        }
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given skill
 * @param {object} skill The skill property
 * @param {I18n} i18n Localization
 */
function setupSkill(skill, i18n) {
    const out = [];
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    const skillLevel = Context.player.skillLevels[skill.id] ?? skill.levels.length;
    const levelProp = skillLevel != undefined ? skill.levels[skillLevel - 1] : skill.levels[0];

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{skill.name[shortLanguageCode] ?? skill.name.en}</span>);
    if (skillLevel != undefined) {
        out.push(`  Lv. ${skillLevel}`);
    }

    if (skill.element != "none") {
        out.push(`\nElement: ${skill.element}`);
    }

    if (levelProp.consumedMP != undefined) {
        out.push(`\nMP: ${levelProp.consumedMP}`);
    }

    if (levelProp.consumedFP != undefined) {
        out.push(`\nFP: ${levelProp.consumedFP}`);
    }

    for (const requirement of skill.requirements) {
        const req = Utils.getSkillById(requirement.skill);
        const playerLevel = Context.player.skillLevels[requirement.skill];

        if (playerLevel == undefined || playerLevel < requirement.level) {
            out.push(<span style={{ color: "#ff0000" }}><br />{req.name[shortLanguageCode] ?? req.name.en} skill level {requirement.level} is needed.</span>);
        }
        else {
            out.push(`\n${req.name[shortLanguageCode] ?? req.name.en} skill level ${requirement.level} is needed.`);
        }
    }

    if (Context.player.level < skill.level) {
        out.push(<span style={{ color: "#ff0000" }}><br />Character Level: {skill.level}</span>);
    }
    else {
        out.push(`\nCharacter Level: ${skill.level}`);
    }

    const statsStyle = { fontWeight: 800 };

    // Attack
    if (levelProp.maxAttack != undefined && levelProp.maxAttack > 0) {
        out.push(<span style={statsStyle}><br />Base Damage: {levelProp.minAttack} ~ {levelProp.maxAttack}</span>);
    }

    // TODO: Scales for pvp vs pve?

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "attack" && scale.maximum == undefined) {
                out.push(<span style={statsStyle}><br />Attack Scaling: {scale.stat} x {scale.scale}</span>);
            }
        }
    }

    // Heal
    if (levelProp.abilities != undefined) {
        for (const ability of levelProp.abilities) {
            if (ability.parameter == "hp") {
                out.push(<span style={statsStyle}><br />Base Heal: {ability.add}</span>);
                break;
            }
        }
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "hp") {
                out.push(<span style={statsStyle}><br />Heal Scaling: {scale.stat} x {scale.scale}</span>);
            }
        }
    }

    // Time
    if (levelProp.duration != undefined) {
        const secs = levelProp.duration % 60;
        const mins = Math.floor(levelProp.duration / 60);
        out.push(<span style={statsStyle}><br />Base Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "duration") {
                out.push(<span style={statsStyle}><br />Time Scaling: {scale.stat} x {scale.scale}</span>);
            }
        }
    }

    // TODO: Get rid of the limits and floors and show the real value directly from the API, such as seconds below 1

    // Casting time
    if (levelProp.casting != undefined && levelProp.casting >= 1) {
        const secs = levelProp.casting % 60;
        const mins = Math.floor(levelProp.casting / 60);
        out.push(<span style={statsStyle}><br />Casting Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    // Cooldown
    // TODO: PvP cooldown seems to be missing from the API, check Holycross for example
    if (levelProp.cooldown != undefined) {
        const secs = Math.ceil(levelProp.cooldown) % 60;
        const mins = Math.floor(Math.ceil(levelProp.cooldown) / 60);
        out.push(<span style={statsStyle}><br />Cooldown: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    // Range
    if (levelProp.spellRange != undefined) {
        out.push(<span style={statsStyle}><br />Spell Range: {levelProp.spellRange}</span>);

        if (skill.target == "party") {
            out.push(<span style={statsStyle}> (Party)</span>);
        }
        else if (skill.target == "area") {
            out.push(<span style={statsStyle}> (Around)</span>);
        }
    }

    // Probability
    if (levelProp.probability != undefined) {
        out.push(<span style={statsStyle}><br />Probability: {levelProp.probability}%</span>);

        if (levelProp.probabilityPVP != undefined && levelProp.probabilityPVP != levelProp.probability) {
            out.push(<span style={statsStyle}> / {levelProp.probabilityPVP}% (PVP & Giants)</span>);
        }
    }

    // TODO: wallLives missing from elementor skill
    if (levelProp.wallLives != undefined) {
        out.push(<span style={statsStyle}><br />Number of Lives: {levelProp.wallLives}</span>);
    }

    // Reflex hit
    if (levelProp.reflectedDamagePVE != undefined && levelProp.reflectedDamagePVP != undefined) {
        out.push(<span style={statsStyle}><br />Reflected Damage: {levelProp.reflectedDamagePVE}% / {levelProp.reflectedDamagePVP}% (PVP)</span>);
    }

    // Damage over time
    if (levelProp.dotTick != undefined) {
        out.push(<span style={statsStyle}><br />DoT Tick: {levelProp.dotTick} Seconds</span>);
    }

    // Combo
    if (skill.combo != "general") {
        out.push(<span style={statsStyle}><br />Combo: {skill.combo}</span>);
    }

    if (!skill.flying) {
        out.push(<span style={statsStyle}><br />Flying: No</span>);
    }

    // Stats
    if (levelProp.abilities != undefined) {
        for (const ability of levelProp.abilities) {
            const abilityStyle = { color: "#6161ff" };
            let add = ability.add;
            let extra = 0;

            if (levelProp.scalingParameters != undefined) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        let bufferStat = 0;
                        switch (scale.stat) {
                            case "int":
                                bufferStat = Context.player.bufferInt;
                                break;
                            case "str":
                                bufferStat = Context.player.bufferStr;
                                break;
                            case "dex":
                                bufferStat = Context.player.bufferDex;
                                break;
                            default:
                                bufferStat = Context.player.bufferSta;
                                break;
                        }
    
                        extra = Math.floor(Math.min(scale.scale * bufferStat, scale.maximum));
                    }
                }
            }

            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{ability.set != undefined ? "=" : "+"}{ability.set != undefined ? ability.set : add + extra}{ability.rate && "%"}</span>);
            if (extra > 0) {
                out.push(<span style={{ color: "#ffaa00" }}> ({add}+{extra})</span>)
            }
        }

        if (levelProp.scalingParameters != undefined) {
            for (const ability of levelProp.abilities) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        out.push(<span style={{ color: "#ffaa00" }}><br />
                            {scale.parameter} Scaling: +{scale.scale * 25}{ability.rate && "%"} per 25 {scale.stat} (max {scale.maximum}{ability.rate && "%"})
                        </span>);
                    }
                }
            }
        }
    }

    out.push(`\n${skill.description[shortLanguageCode] ?? skill.description.en}`);

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given partySkill
 * @param {object} partySkill The partySkill property
 * @param {I18n} i18n Localization
 */
function setupPartySkill(partySkill, i18n) {
    const out = []
    var shortLanguageCode = 'en'
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0]
    }

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{partySkill.name[shortLanguageCode] ?? partySkill.name.en}</span>);
    out.push(`\n${partySkill.description[shortLanguageCode] ?? partySkill.description.en}`)

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given housingNpc
 * @param {object} housingNpc The housingNpc property
 * @param {I18n} i18n Localization
 */
function setupHousingNpc(housingNpc, i18n) {
    const out = [];
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{housingNpc.name[shortLanguageCode] ?? housingNpc.name.en}</span>);
    const abilityStyle = { color: "#6161ff" };
    for (const ability of housingNpc.abilities) {
        if (ability.rate) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}{"%"}</span>);
        } else {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}</span>);
        }
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}