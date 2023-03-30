// User picks a pokemon
// System creates user/sys pokemon objects
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
import { filterMoveSet, removeArrayElementByProperty } from "./helpers.js"

// Program Entry Function
const init = async () => {

    const pokemon = await selectPokemon();
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    const moves = await selectMoves(data);
    const chosenPokemon = createPokeClass(data, moves);

    console.log(chosenPokemon);
};

// Sub Functions
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
const selectMoves = async ({ moves }) => {
    let selectedMoves = [];
    const filteredMoves = filterMoveSet(moves);
    let refactoredMoves = filteredMoves.map(x => { return { name: x.move.name, value: x.move.url } });

    for (let i = 0; i < 4; i++) {
        const { move } = await inquirer.prompt([
            {
                type: "list",
                name: "move",
                choices: refactoredMoves,
                message: "Select the first pokemon move.",
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

        const { data } = await axios.get(move);
        const newMove = new Move(data.name, data.type.name, data.power, data.pp, data.damage_class.name, data.accuracy);

        selectedMoves.push(newMove);
        removeArrayElementByProperty(refactoredMoves, "name", newMove.name);
    }

    return selectedMoves;
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

init();