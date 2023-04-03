// Move/Pokemon Descriptions
// Status change moves
// Ailments
// Unqiue category moves
// Move meta data (flinch, self-stat increase, effects)
// Abilities
// Weather
// Learn about AI through computer getting smarter   

// NOTES FOR JORDAN
// Any functions that use loops/recursion and inquirer must have LETs for all variable declarations.

import inquirer from "inquirer";
import axios from "axios";
import { Pokemon, Stats, Move } from "./classes.js";
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
    return new Move(
        moveData.name,
        moveData.type.name,
        moveData.power,
        moveData.pp,
        moveData.damage_class.name,
        moveData.accuracy,
        moveData.priority,
        moveData.meta.crit_rate
    );
}
const createPokeClass = async ({ name, types, stats, species }, moves) => {
    const firstType = helpers.filterPokeType(types, 1);
    const secondType = helpers.filterPokeType(types, 2);
    const desc = await helpers.pokeDescription(axios, species.url);

    const chosenStats = new Stats();
    stats.forEach(({ base_stat, stat }) => {
        switch (stat.name) {
            case "hp":
                chosenStats.hp = base_stat;
                break;
            case "attack":
                chosenStats.attack = base_stat;
                break;
            case "defense":
                chosenStats.defense = base_stat;
                break;
            case "special-attack":
                chosenStats.specialAttack = base_stat;
                break;
            case "special-defense":
                chosenStats.specialDefense = base_stat;
                break;
            case "speed":
                chosenStats.speed = base_stat;
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
        console.clear();
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
        if (user.stats.speed == system.stats.speed) {
            userFirst = !!helpers.randomInt(2);
        } else {
            userFirst = user.stats.speed > system.stats.speed
        }
    } else {
        userFirst = userMove.priority > systemMove.priority;
    }

    return userFirst
}
const calculateDamage = (attackPoke, defendPoke, move) => {
    const attackNum = move.damageClass === "physical" ? attackPoke.stats.attack : attackPoke.stats.specialAttack;
    const defenseNum = move.damageClass === "physical" ? defendPoke.stats.defense : defendPoke.stats.specialDefense;
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
const executeMove = async (attackPoke, defendPoke, move) => {
    const { totalDamage, damageObject } = calculateDamage(attackPoke, defendPoke, move);

    console.log(`${attackPoke.name} used ${move.name}!`);
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
    move.pp--

    console.log(`${defendPoke.name} took ${totalDamage} damage!`);
    await helpers.delay(1500);
    console.log(`${defendPoke.name} has ${remainingHealth} hp remaining.`);
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
                "Attack": pokemon.stats.attack,
                "Defense": pokemon.stats.defense,
                "Special Attack": pokemon.stats.specialAttack,
                "Special Defense": pokemon.stats.specialDefense,
                "Speed": pokemon.stats.speed
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