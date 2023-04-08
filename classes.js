class Pokemon {
    constructor(name, description, typeOne, typeTwo, level, nature, stats, moves) {
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
    constructor(name, description, type, power, pp, damageClass, statChanges, accuracy, priority, critRate, category) {
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

export {
    Pokemon,
    Stats,
    Stat,
    Move,
    StatChange,
    Nature
}