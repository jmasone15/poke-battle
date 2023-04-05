// Status change moves
// Accuracy
// Evasion
// Ailments
// Unqiue category moves
// Move meta data (flinch, self-stat increase, effects)
// Abilities
// Weather
// Organize functions/files
// Learn about AI through computer getting smarter   

// NOTES FOR JORDAN
// Any functions that use loops/recursion and inquirer must have LETs for all variable declarations.

import inquirer from "inquirer";
import axios from "axios";
import { Pokemon, Stats, Move, Stat, StatChange } from "./classes.js";
import helpers from "./helpers.js";

// Program Entry Function
const init = async () => {
    console.clear();

    // Inquirer Pokemon Select
    let pokemon = await selectPokemon();

    // Pokemon Creation
    let userPokemon = await createPokemon(pokemon, false);
    let sysPokemon = await createPokemon("caterpie", true);

    // Pokemon Battle
    await battleSequence(userPokemon, sysPokemon);

    // End Game
    await endGame(userPokemon, sysPokemon);
};

// Pokemon Creation Sub-Functions
const createPokemon = async (pokemon, isSys) => {
    const data = await helpers.axiosGetData(axios, `https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    const moves = await selectMoves(data, isSys);

    return createPokeClass(data, moves);
}
const selectPokemon = async () => {
    const { pokemon } = await inquirer.prompt([
        {
            type: "list",
            name: "pokemon",
            choices: ["bulbasaur", "charmander", "squirtle"],
            message: "Please choose a starting pokemon.",
            validate: (input) => {
                if (!input) {
                    return "A selection is required."
                } else {
                    return true
                }
            }
        }
    ]);

    return pokemon
}
const selectMoves = async ({ moves }, autoSelect) => {
    let selectedMoves = [];
    const filteredMoves = helpers.filterMoveSet(moves);
    let refactoredMoves = filteredMoves.map(x => { return { name: x.move.name, value: x.move.url } });

    // System Pokemon Moves
    if (autoSelect) {
        let indexArray = [];

        if (refactoredMoves.length > 4) {
            for (let i = 0; i < 4; i++) {
                const idx = helpers.randomInt(refactoredMoves.length);

                if (!indexArray.includes(idx)) {
                    indexArray.push(idx)
                } else {
                    i--
                    continue
                }
            }

            for (let i = 0; i < indexArray.length; i++) {
                const newMove = await createMoveClass(refactoredMoves[indexArray[i]].value);
                selectedMoves.push(newMove)
            }

        } else {
            for (let i = 0; i < refactoredMoves.length; i++) {
                const newMove = await createMoveClass(refactoredMoves[i].value);
                selectedMoves.push(newMove)
            }
        }

        // User-Selected Pokemon Moves
    } else {
        for (let i = 0; i < 4; i++) {
            if (refactoredMoves.length > 0) {
                const { move } = await inquirer.prompt([
                    {
                        type: "list",
                        name: "move",
                        choices: refactoredMoves,
                        message: `Pokemon Move #${i + 1}`,
                        pageSize: 10,
                        loop: false,
                        validate: (input) => {
                            if (!input) {
                                return "A selection is required."
                            } else {
                                return true
                            }
                        }
                    }
                ]);

                const newMove = await createMoveClass(move);
                selectedMoves.push(newMove);
                helpers.findArrayElementByProp(refactoredMoves, "name", newMove.name, true);
            } else {
                break;
            }
        }
    }

    return selectedMoves;
}
const createMoveClass = async (url) => {
    const moveData = await helpers.axiosGetData(axios, url);
    const moveDesc = await helpers.findDescription("", "", moveData.flavor_text_entries);

    let statChangeArray = [];
    moveData.stat_changes.forEach(change => statChangeArray.push(new StatChange(change.change, change.stat.name)));

    return new Move(
        moveData.name,
        moveDesc,
        moveData.type.name,
        moveData.power,
        moveData.pp,
        moveData.damage_class.name,
        statChangeArray,
        moveData.accuracy,
        moveData.priority,
        moveData.meta.crit_rate,
        moveData.meta.category.name
    );
}
const createPokeClass = async ({ name, types, stats, species }, moves) => {
    const firstType = helpers.filterPokeType(types, 1);
    const secondType = helpers.filterPokeType(types, 2);
    const desc = await helpers.findDescription(axios, species.url);

    const chosenStats = new Stats();
    stats.forEach(({ base_stat, stat }) => {
        switch (stat.name) {
            case "hp":
                chosenStats.hp = base_stat;
                break;
            case "attack":
                chosenStats.attack = new Stat(base_stat);
                break;
            case "defense":
                chosenStats.defense = new Stat(base_stat);
                break;
            case "special-attack":
                chosenStats.specialAttack = new Stat(base_stat);
                break;
            case "special-defense":
                chosenStats.specialDefense = new Stat(base_stat);
                break;
            case "speed":
                chosenStats.speed = new Stat(base_stat);
                break;
            default:
                break;
        }
    });

    return new Pokemon(name, desc, firstType.type.name, !secondType ? "" : secondType.type.name, chosenStats, moves);
}

// Pokemon Battle Sub-Functions
const battleSequence = async (userPokemon, sysPokemon) => {

    const userNameText = helpers.colorLog("User", "green", false);
    const sysNameText = helpers.colorLog("System", "red", true);
    const userPokeName = helpers.colorLog(helpers.pascalCase(userPokemon.name), "magenta", false);
    const sysPokeName = helpers.colorLog(helpers.pascalCase(sysPokemon.name), "magenta", false);

    const textArray = [
        "Pokemon Battle!",
        `${userNameText} vs. ${sysNameText}`,
        `Go ${userPokeName}!`,
        `${sysNameText} sends out ${sysPokeName}`
    ];

    await helpers.delay(1500);
    console.clear();

    for (let i = 0; i < textArray.length; i++) {
        console.log(textArray[i]);
        await helpers.delay(1500);
    }

    while (true) {
        // console.clear();
        let { userMove, systemMove } = await battleMoves(userPokemon, sysPokemon.moves);
        let userFirst = doesUserMoveFirst(userPokemon, sysPokemon, userMove, systemMove);

        // First Move
        const moveOneResult = await executeMove(
            userFirst ? userPokemon : sysPokemon,
            userFirst ? sysPokemon : userPokemon,
            userFirst ? userMove : systemMove
        );
        await helpers.delay(1500);

        if (!moveOneResult) {
            break;
        }

        // Second Move
        const moveTwoResult = await executeMove(
            userFirst ? sysPokemon : userPokemon,
            userFirst ? userPokemon : sysPokemon,
            userFirst ? systemMove : userMove
        );
        await helpers.delay(1500);

        if (!moveTwoResult) {
            break;
        }
    }

    return;
}
const battleMoves = async (userPokemon, systemMoves) => {
    const userMoves = userPokemon.moves;
    let moveArray = [];

    for (let i = 0; i < userMoves.length; i++) {
        if (userMoves[i].pp > 0) {
            moveArray.push({
                name: `${helpers.pascalCase(userMoves[i].name)} [${userMoves[i].type}]`,
                value: userMoves[i].name
            })
        }
    }

    let { userMoveText } = await inquirer.prompt([
        {
            type: "list",
            name: "userMoveText",
            message: "Select a Move",
            choices: [...moveArray, new inquirer.Separator(), "View Pokemon Details"],
            validate: (input) => {
                if (!input) {
                    return "A selection is required."
                } else {
                    return true
                }
            }
        }
    ]);

    if (userMoveText === "View Pokemon Details") {

        await viewPokemonDetails(userPokemon, false);
        return battleMoves(userPokemon, systemMoves);

    } else {

        let userMove = helpers.findArrayElementByProp(userMoves, "name", userMoveText, false);
        let systemMove = systemMoves[helpers.randomInt(systemMoves.length)];

        return { userMove, systemMove }
    }
}
const doesUserMoveFirst = (user, system, userMove, systemMove) => {
    let userFirst;

    if (userMove.priority == systemMove.priority) {
        if (user.stats.speed.value == system.stats.speed.value) {
            userFirst = !!helpers.randomInt(2);
        } else {
            userFirst = user.stats.speed.value > system.stats.speed.value
        }
    } else {
        userFirst = userMove.priority > systemMove.priority;
    }

    return userFirst
}
const determineStatStage = ({ value, stage }) => {
    switch (stage) {
        case -6:
            return value * (2 / 8)
        case -5:
            return value * (2 / 7)
        case -4:
            return value * (2 / 6)
        case -3:
            return value * (2 / 5)
        case -2:
            return value * (2 / 4)
        case -1:
            return value * (2 / 3)
        case 1:
            return value * (3 / 2)
        case 2:
            return value * (4 / 2)
        case 3:
            return value * (5 / 2)
        case 4:
            return value * (6 / 2)
        case 5:
            return value * (7 / 2)
        case 6:
            return value * (8 / 2)
        default:
            return value
    }
}
const calculateStatDamage = (attackPoke, defendPoke, move) => {
    const isPhysical = move.damageClass === "physical";
    const attackStat = isPhysical ? attackPoke.stats.attack : attackPoke.stats.specialAttack;
    const defenseStat = isPhysical ? defendPoke.stats.defense : defendPoke.stats.specialDefense;

    return { attackNum: determineStatStage(attackStat), defenseNum: determineStatStage(defenseStat) }
}
const calculateDamage = (attackPoke, defendPoke, move) => {
    const { attackNum, defenseNum } = calculateStatDamage(attackPoke, defendPoke, move);
    const typeOneMod = helpers.typeMatrix(move.type, defendPoke.typeOne);
    const typeTwoMod = !defendPoke.typeTwo ? 1 : helpers.typeMatrix(move.type, defendPoke.typeTwo);

    const damageObject = {
        baseDamage: (((attackPoke.level * 2) / 5) + 2 * move.power * (attackNum / defenseNum) / 50) + 2,
        // 4.17% || 12.5%
        critMod: helpers.randomInt(move.critRate == 0 ? 24 : 8) == 0 ? 1.5 : 1,
        randomMod: helpers.randomIntRange(85, 100) / 100,
        // Same Type Attack Bonus
        stabMod: move.type === attackPoke.typeOne || move.type === attackPoke.typeTwo ? 1.5 : 1,
        typeMod: typeOneMod * typeTwoMod
    }

    return {
        totalDamage: Math.ceil(damageObject.baseDamage * damageObject.critMod * damageObject.randomMod * damageObject.stabMod * damageObject.typeMod),
        damageObject
    }
}
const updateStatChange = (attackPoke, defendPoke, { target, stat, change }) => {
    const targetPokemon = target === "user" ? attackPoke : defendPoke;
    let targetStat;

    if (stat === "special-attack" || stat === "special-defense") {
        targetStat = targetPokemon.stat[stat === "special-attack" ? "specialAttack" : "specialDefense"]
    } else {
        targetStat = targetPokemon.stats[stat]
    }

    if (targetStat.stage == 6 || targetStat.stage == -6) {
        console.log(`${targetPokemon.name}'s ${stat} won't go any ${change < 0 ? "lower" : "higher"}!`);
    } else {
        targetStat.stage = targetStat.stage + change;
        let message;

        if (target === "user") {
            switch (change) {
                case 1:
                    message = "rose!"
                    break;
                case 2:
                    message = "rose sharply!"
                    break;
                default:
                    message = "rose drastically!"
                    break;
            }
        } else {
            switch (change) {
                case -1:
                    message = "fell!"
                    break;
                case -2:
                    message = "harshly fell!"
                    break;
                default:
                    message = "severely fell!"
                    break;
            }
        }

        console.log(`${targetPokemon.name}'s ${stat} ${message}`);
    }
}
const executeMove = async (attackPoke, defendPoke, move) => {

    console.log(`${attackPoke.name} used ${move.name}!`);
    move.pp--

    if (move.damageClass !== "status") {
        const { totalDamage, damageObject } = calculateDamage(attackPoke, defendPoke, move);

        await helpers.delay(1500);

        if (totalDamage == 0) {
            console.log("The move had no effect...");
            return true;
        }

        if (damageObject.critMod !== 1) {
            console.log("Critical Hit!");
            await helpers.delay(1500);
        }
        if (damageObject.typeMod !== 1) {
            if (damageObject.typeMod > 1) {
                console.log("It's super effective!");
                await helpers.delay(1500);
            } else {
                console.log("It's not very effective.");
                await helpers.delay(1500);
            }
        }

        const remainingHealth = defendPoke.stats.hp - totalDamage

        if (remainingHealth <= 0) {
            defendPoke.stats.hp = 0;

            console.log(`${defendPoke.name} has fainted!`);
            await helpers.delay(1500);

            return false;
        }

        defendPoke.stats.hp = remainingHealth;

        console.log(`${defendPoke.name} took ${totalDamage} damage!`);
        await helpers.delay(1500);
        console.log(`${defendPoke.name} has ${remainingHealth} hp remaining.`);
    }

    if (move.statChanges.length !== 0) {
        for (let i = 0; i < move.statChanges.length; i++) {
            updateStatChange(attackPoke, defendPoke, move.statChanges[i]);
            await helpers.delay(1500);
        }
    }

    return true;
}
const viewPokemonDetails = async (pokemon, moveData) => {

    console.clear();

    if (moveData) {

        console.log("Move Data");
        pokemon.moves.forEach(({ name, type, power, pp, damageClass, accuracy }) => {
            console.log("\n");
            console.table({
                "Name": helpers.pascalCase(name),
                "Type": helpers.pascalCase(type),
                "Power": power,
                "PP": pp,
                "Damage Class": helpers.pascalCase(damageClass),
                "Accuracy": accuracy
            })
        });

    } else {

        console.log("Pokemon Data");
        console.table(
            {
                "Name": helpers.pascalCase(pokemon.name),
                "Type": `${helpers.pascalCase(pokemon.typeOne)}${!pokemon.typeTwo ? "" : " | " + helpers.pascalCase(pokemon.typeTwo)}`,
                "Level": pokemon.level,
                "HP": pokemon.stats.hp
            }
        );
        console.log("\n");
        console.log("Pokemon Stats");
        console.table(
            {
                "Attack": pokemon.stats.attack.value,
                "Defense": pokemon.stats.defense.value,
                "Special Attack": pokemon.stats.specialAttack.value,
                "Special Defense": pokemon.stats.specialDefense.value,
                "Speed": pokemon.stats.speed.value
            }
        );
        console.log("\n");
    }

    const { selection } = await inquirer.prompt([
        {
            type: "list",
            name: "selection",
            choices: [moveData ? "View Pokemon Data" : "View Move Data", "Go Back"],
            message: "What would you like to do?",
            validate: (input) => {
                if (!input) {
                    return "A selection is required."
                } else {
                    return true
                }
            }
        }
    ]);

    if (selection === "Go Back") {
        console.clear();
        return;
    } else {
        return viewPokemonDetails(pokemon, moveData ? false : true)
    }
}

// Ending Sub-Functions
const endGame = async (userPokemon, sysPokemon) => {
    console.clear();
    const winner = [userPokemon, sysPokemon].filter(x => x.stats.hp !== 0)[0];

    console.log(`${winner.name} has won the battle!`);
    await helpers.delay(1500);
    const { again } = await inquirer.prompt([
        {
            type: "confirm",
            name: "again",
            message: "Play again?",
            choices: ["Yes", "No"]
        }
    ]);

    if (again) {
        init();
    } else {
        console.log("Goodbye!");
        return;
    }
}

init();