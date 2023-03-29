class Pokemon {
    constructor(name, typeOne, typeTwo, stats, moves) {
        this.name = name;
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
    constructor(name, type, power, pp, damageClass, accuracy) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.pp = pp;
        this.damageClass = damageClass;
        this.accuracy = accuracy;
    }
}

const typeObject = {
    // Numbers in strong/weak arrays refer to indexes of types in the key array.
    key: ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"],
    normal: {
        strong: [],
        weak: [12, 16],
        noEffect: [13]
    },
    fire: {
        strong: [4, 5, 11, 16],
        weak: [1, 2, 12, 14],
        noEffect: []
    },
    water: {
        strong: [1, 8, 12],
        weak: [2, 4, 14],
        noEffect: []
    },
    electric: {
        strong: [2, 9],
        weak: [3, 4, 14],
        noEffect: [8]
    },
    grass: {
        strong: [2, 8, 12],
        weak: [1, 4, 7, 9, 11, 14, 16],
        noEffect: []
    },
    ice: {
        strong: [4, 8, 9, 14],
        weak: [1, 2, 5, 16],
        noEffect: []
    },
    fighting: {
        strong: [0, 5, 12, 15, 16],
        weak: [7, 9, 10, 11, 17],
        noEffect: [13]
    },
    poison: {
        strong: [4, 17],
        weak: [7, 8, 12, 13],
        noEffect: [16]
    },
    ground: {
        strong: [1, 3, 7, 12, 16],
        weak: [4, 11],
        noEffect: [9]
    },
    flying: {
        strong: [4, 6, 11],
        weak: [3, 12, 16],
        noEffect: []
    },
    psychic: {
        strong: [6, 7],
        weak: [10, 16],
        noEffect: [15]
    },
    bug: {
        strong: [4, 10, 15],
        weak: [1, 6, 7, 9, 13, 16, 17],
        noEffect: []
    },
    rock: {
        strong: [1, 5, 9, 11],
        weak: [6, 8, 16],
        noEffect: []
    },
    ghost: {
        strong: [10, 13],
        weak: [15],
        noEffect: [0]
    },
    dragon: {
        strong: [14],
        weak: [16],
        noEffect: [17]
    },
    dark: {
        strong: [10, 13],
        weak: [6, 15, 17],
        noEffect: []
    },
    steel: {
        strong: [5, 12, 17],
        weak: [1, 2, 3, 16],
        noEffect: []
    },
    fairy: {
        strong: [6, 14, 15],
        weak: [1, 7, 16],
        noEffect: []
    }
}

const typeMatrix = (typeOne, typeTwo) => {
    const typeOneFiltered = typeObject[typeOne];
    const typeTwoIndex = typeObject.key.indexOf(typeTwo);

    if (typeOneFiltered.strong.includes(typeTwoIndex)) {
        return 2
    } else if (typeOneFiltered.weak.includes(typeTwoIndex)) {
        return 0.5
    } else if (typeOneFiltered.noEffect.includes(typeTwoIndex)) {
        return 0
    } else {
        return 1
    }
}

export default {
    Pokemon,
    Stats,
    Move,
    typeObject,
    typeMatrix
}