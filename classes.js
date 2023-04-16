import helpers from "./helpers.js";

class Pokemon {
    constructor(name, description, typeOne, typeTwo, level, nature, stats, moves, ailments) {
        this.name = name;
        this.description = description;
        this.typeOne = typeOne;
        // Optional
        this.typeTwo = typeTwo;
        // Eventually will be 50 | 5 for initial setup
        this.level = level;
        this.nature = nature;
        this.stats = stats;
        this.moves = moves;
        this.ailments = [];
    }

    isType(type) {
        const isTypeOne = type === this.typeOne;
        const isTypeTwo = type === this.typeTwo;

        return isTypeOne || isTypeTwo
    }
}

class Stats {
    constructor(attack, defense, specialAttack, specialDefense, speed, hp) {
        this.attack = attack;
        this.defense = defense;
        this.specialAttack = specialAttack;
        this.specialDefense = specialDefense;
        this.speed = speed;
        this.hp = hp;
        this.accuracy = { stage: 0 };
        this.evasion = { stage: 0 };
    }
}

class Stat {
    constructor(base, value, iv, effort) {
        this.base = base;
        this.value = value;
        this.stage = 0;
        this.iv = iv;
        this.effort = effort;
        this.starting = value
    }
}

class Move {
    constructor(name, description, type, power, pp, damageClass, statChanges, accuracy, priority, critRate, category, ailment, effectChance) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.power = power;
        this.pp = pp;
        this.damageClass = damageClass;
        this.statChanges = statChanges;
        this.accuracy = accuracy;
        this.priority = priority;
        this.critRate = critRate;
        this.category = category;
        this.ailment = ailment;
        this.effectChance = effectChance;
    }
}

class StatChange {
    constructor(change, stat) {
        this.change = change;
        this.stat = stat;
        this.target = change > 0 ? "user" : "enemy"
    }
}

class Nature {
    constructor(name) {
        this.name = name;
    }

    changedStat(increase) {
        if (increase) {
            if (["Lonely", "Brave", "Adamant", "Naughty"].includes(this.name)) {
                return "attack"
            } else if (["Bold", "Relaxed", "Impish", "Lax"].includes(this.name)) {
                return "defense"
            } else if (["Timid", "Hasty", "Jolly", "Naive"].includes(this.name)) {
                return "speed"
            } else if (["Modest", "Mild", "Quiet", "Rash"].includes(this.name)) {
                return "specialAttack"
            } else if (["Calm", "Gentle", "Sassy", "Careful"].includes(this.name)) {
                return "specialDefense"
            } else {
                return ""
            }
        } else {
            if (["Bold", "Timid", "Modest", "Calm"].includes(this.name)) {
                return "attack"
            } else if (["Lonely", "Hasty", "Mild", "Gentle"].includes(this.name)) {
                return "defense"
            } else if (["Brave", "Relaxed", "Quiet", "Sassy"].includes(this.name)) {
                return "speed"
            } else if (["Adamant", "Impish", "Jolly", "Careful"].includes(this.name)) {
                return "specialAttack"
            } else if (["Naughty", "Lax", "Naive", "Rash"].includes(this.name)) {
                return "specialDefense"
            } else {
                return ""
            }
        }
    }
}

// Three Types of Status Conditions
// - Before Turn: [Freeze, Sleep, Infatuation, Flinch, Paralysis, Confusion]
// - During Turn: [Taunt]
// - After Turn: [Burn, Poison]
// - Other: [Can't Escape]
class Ailment {
    constructor(name, volatile, trapMoveName) {
        this.name = name;
        this.volatile = volatile;
        this.trapMoveName = trapMoveName;
        this.beforeTurn = ["freeze", "sleep", "paralysis", "confusion"].includes(name);
        this.duringTurn = ["taunt"].includes(name);
        this.afterTurn = ["burn", "poison", "trap", "curse", "yawn"].includes(name);
        this.other = ["can't escape"].includes(name);
        switch (this.name) {
            case "sleep":
                this.duration = Math.floor(Math.random() * 3) + 1
                break;
            case "trap":
                this.duration = Math.floor(Math.random() * 2) + 4
                break;
            case "confusion":
                this.duration = Math.floor(Math.random() * 4) + 1
                break;
            default:
                break;
        }
        this.initial = this.name === "yawn"
    }

    // Also need to update that physical damage is halved when burned
    burnAilment(pokemon) {
        let damage = Math.floor(pokemon.stats.hp.starting / 16);
        if (damage < 1) {
            damage = 1
        }

        console.log(`${pokemon.name} was hurt by it's burn!`);
        pokemon.stats.hp.value = pokemon.stats.hp.value - damage;

        return;
    }

    poisonAilment(pokemon) {
        let damage = Math.floor(pokemon.stats.hp.starting / 8);
        if (damage < 1) {
            damage = 1
        }

        console.log(`${pokemon.name} is hurt by it's poison!`);
        pokemon.stats.hp.value = pokemon.stats.hp.value - damage;

        return;
    }

    freezeAilment(pokemon, move) {
        // 20% chance to be unthawed
        const random = Math.floor(Math.random() * 5) + 1;
        const isThawed = random === 1;
        const useableMove = ["fusion-flare", "flame-wheel", "sacred-fire", "flare-blitz", "scald", "steam-eruption"].includes(move.name);

        if (isThawed) {
            pokemon.ailments = pokemon.ailments.filter(x => x.name !== "freeze");
            console.log(`${pokemon.name} thawed out!`);
        } else if (useableMove) {
            return true
        } else {
            console.log(`${pokemon.name} is frozen solid!`);
        }


        return isThawed
    }

    paralysisAilment(pokemon) {
        // 25% for move to not execute
        const random = helpers.randomInt(100) + 1;
        const moveExecution = random > 25

        if (!moveExecution) {
            console.log(`${pokemon.name} is paralyzed!`);
        }

        return moveExecution
    }

    sleepAilment(pokemon) {
        if (this.duration === 0) {
            console.log(`${pokemon.name} woke up!`);
            return true
        } else {
            this.duration--
            console.log(`${pokemon.name} is fast asleep!`);
            return false
        }
    }

    trapAilment(pokemon) {
        // If usr that uses the binding move faints, the trap ailment is removed.
        // Cannot be switched out if trapped unless Ghost-type.

        if (this.duration == 0) {
            console.log(`${pokemon.name} was freed from ${this.trapMoveName}`);
        } else {
            this.duration--

            let damage = Math.floor(pokemon.stats.hp.starting / 8);
            if (damage < 1) {
                damage = 1
            }

            console.log(`${pokemon.name} is hurt by ${this.trapMoveName}!`);
            pokemon.stats.hp.value = pokemon.stats.hp.value - damage;
        }

        return;
    }

    confusionAilment(pokemon, move) {
        if (this.duration == 0) {
            console.log(`${pokemon.name} snapped out of confusion!`);
        } else {
            const random = helpers.randomInt(100) + 1;
            this.duration--

            console.log(`${pokemon.name} is confused!`);

            if (random <= 33) {
                const attackNum = helpers.determineStatStage(pokemon.stats.attack);
                const defenseNum = helpers.determineStatStage(pokemon.stats.defense);
                let finalAttackNum;
                const filteredAilments = pokemon.ailments.filter(x => x.name === "burn");

                if (filteredAilments.length > 0 && move.damageClass === "physical") {
                    finalAttackNum = Math.floor(attackNum * 0.5);
                } else {
                    finalAttackNum = attackNum
                }
                let damage = (((pokemon.level * 2) / 5) + 2 * 40 * (finalAttackNum / defenseNum) / 50) + 2;
                if (damage < 1) {
                    damage = 1
                }

                console.log("It hurt itself in confusion!");
                pokemon.stats.hp.value = pokemon.stats.hp.value - damage;

                return false
            }
        }

        return true
    }

    curseAilment(pokemon) {
        let damage = Math.floor(pokemon.stats.hp.starting / 4);
        if (damage < 1) {
            damage = 1
        }

        console.log(`${pokemon.name} was hurt by it's curse!`);
        pokemon.stats.hp.value = pokemon.stats.hp.value - damage;

        return;
    }

    yawnAilment(pokemon) {
        if (this.initial) {
            this.initial = false;
            console.log(`${pokemon.name} is getting sleepy!`);
        } else {
            pokemon.ailments.push(new Ailment("sleep", false, ""));

            const filteredAilments = pokemon.ailments.filter(x => x.name !== "yawn");
            pokemon.ailments = filteredAilments

            console.log(`${pokemon.name} fell asleep!`);
        }

        return;
    }

    ailmentFunc(pokemon, move) {
        switch (this.name) {
            case "burn":
                return this.burnAilment(pokemon)
            case "freeze":
                return this.freezeAilment(pokemon, move)
            case "paralysis":
                return this.paralysisAilment(pokemon)
            case "poison":
                return this.poisonAilment(pokemon)
            case "sleep":
                return this.sleepAilment(pokemon)
            case "trap":
                return this.trapAilment(pokemon)
            case "confusion":
                return this.confusionAilment(pokemon)
            case "curse":
                return this.curseAilment(pokemon)
            case "yawn":
                return this.yawnAilment(pokemon)
            default:
                console.log("Pokemon does not have an ailment.");
                break;
        }
    }
}

export {
    Pokemon,
    Stats,
    Stat,
    Move,
    StatChange,
    Nature,
    Ailment
}