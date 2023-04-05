class Pokemon {
    constructor(name, description, typeOne, typeTwo, stats, moves) {
        this.name = name;
        this.description = description;
        this.typeOne = typeOne;
        // Optional
        this.typeTwo = typeTwo;
        // Eventually will be 50 | 5 for initial setup
        this.level = 5;
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

export {
    Pokemon,
    Stats,
    Stat,
    Move,
    StatChange
}