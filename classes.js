class Pokemon {
    constructor(name, description, typeOne, typeTwo, stats, moves) {
        this.name = name;
        this.description= description;
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
        this.attack = attack;
        this.defense = defense;
        this.specialAttack = specialAttack;
        this.specialDefense = specialDefense;
        this.speed = speed;
        this.hp = hp;
    }
}

class Move {
    constructor(name, type, power, pp, damageClass, accuracy, priority, critRate) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.pp = pp;
        this.damageClass = damageClass;
        this.accuracy = accuracy;
        this.priority = priority;
        this.critRate = critRate;
    }
}

export {
    Pokemon,
    Stats,
    Move,
}