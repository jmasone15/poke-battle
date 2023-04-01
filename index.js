// User picks a pokemon - DONE
// System creates user/sys pokemon objects - DONE
// Battle starts
// User/Sys selects move.
// Order Determination
// Move Execution
// Health Check
// Return to Select Move
// Once all health gone, award winner.

import inquirer from "inquirer";
import axios from "axios";
import { Pokemon, Stats, Move } from "./classes.js";
// import { filterMoveSet, removeArrayElementByProperty, axiosGetData, randomInt, delay, colorLog } from "./helpers.js";
import helpers from "./helpers.js";

// Program Entry Function
const init = async () => {

    // Inquirer Pokemon Select
    const pokemon = await selectPokemon();

    // Pokemon Creation
    const userPokemon = await createPokemon(pokemon, false);
    const sysPokemon = await createPokemon("caterpie", true);

    // Pokemon Battle
    await startBattle(userPokemon, sysPokemon);
    await battleMovePrompt(userPokemon.moves);
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
                helpers.removeArrayElementByProperty(refactoredMoves, "name", newMove.name);
            } else {
                break;
            }
        }
    }

    return selectedMoves;
}
const createMoveClass = async (url) => {
    const moveData = await helpers.axiosGetData(axios, url);
    return new Move(moveData.name, moveData.type.name, moveData.power, moveData.pp, moveData.damage_class.name, moveData.accuracy);
}
const createPokeClass = ({ name, types, stats }, moves) => {
    const firstType = types.filter(x => x.slot == 1)[0];
    const secondType = types.filter(x => x.slot == 2)[0];

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

    return new Pokemon(name, firstType.type.name, !secondType ? "" : secondType.type.name, chosenStats, moves);
}

// Pokemon Battle Sub-Functions
const startBattle = async (user, system) => {
    const userNameText = helpers.colorLog("User", "green", false);
    const sysNameText = helpers.colorLog("System", "red", true);
    const userPokeName = helpers.colorLog(helpers.pascalCase(user.name), "magenta", false);
    const sysPokeName = helpers.colorLog(helpers.pascalCase(system.name), "magenta", false);

    const textArray = [
        "Pokemon Battle!",
        `${userNameText} vs. ${sysNameText}`,
        `Go ${userPokeName}!`,
        `${sysNameText} sends out ${sysPokeName}`
    ];
    for (let i = 0; i < textArray.length; i++) {
        console.log(textArray[i]);
        await helpers.delay(1500);
    }


}
const battleMovePrompt = async (moves) => {
    let moveArray = [];

    for (let i = 0; i < moves.length; i++) {
        moveArray.push({
            name: `${helpers.pascalCase(moves[i].name)} [${moves[i].type}]`,
            value: moves[i].name
        })
    }

    const { selection } = await inquirer.prompt([
        {
            type: "list",
            name: "selection",
            message: "Select a Move",
            choices: moveArray,
            validate: (input) => {
                if (!input) {
                    return "A selection is required."
                } else {
                    return true
                }
            }
        }
    ]);

    console.log(selection);
}

init();