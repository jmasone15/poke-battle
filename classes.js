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
    constructor(name, volatile) {
        this.name = name;
        this.volatile = volatile;
        this.beforeTurn = ["freeze", "sleep", "paralysis", "confusion"].includes(name);
        this.duringTurn = ["taunt"].includes(name);
        this.afterTurn = ["burn", "poison"].includes(name);
        this.other = ["can't escape"].includes(name);
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

    ailmentFunc(pokemon, move) {
        switch (this.name) {
            case "burn":
                return this.burnAilment(pokemon)
            case "freeze":
                return this.freezeAilment(pokemon, move)
            case "paralysis":
                return this.paralysisAilment(pokemon)
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