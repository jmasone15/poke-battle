class Pokemon {
    constructor(name, description, typeOne, typeTwo, nature, stats, moves) {
        this.name = name;
        this.description = description;
        this.typeOne = typeOne;
        // Optional
        this.typeTwo = typeTwo;
        // Eventually will be 50 | 5 for initial setup
        this.level = 5;
        this.nature = nature;
        this.stats = stats;
        this.moves = moves;
    }
}

class Stats {
    constructor(attack, defense, specialAttack, specialDefense, speed, hp) {
        this.attack = new Stat(attack);
        this.defense = new Stat(defense);
        this.specialAttack = new Stat(specialAttack);
        this.specialDefense = new Stat(specialDefense);
        this.speed = new Stat(speed);
        this.hp = hp;
    }
}

class Stat {
    constructor(value) {
        this.value = value;
        this.stage = 0;
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