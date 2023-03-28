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

const init = async () => {
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
    console.log(pokemon);
};

init();