// Ailments
// All move categories
// Unqiue category moves
// Move meta data (flinch, self-stat increase, effects)
// Abilities
// Weather
// Teams
// Organize functions/files
// Learn about AI through computer getting smarter

// NOTES FOR JORDAN
// Any functions that use loops/recursion and inquirer must have LETs for all variable declarations.

import inquirer from "inquirer";
import axios from "axios";
import { Pokemon, Stats, Move, Stat, StatChange, Nature, Ailment } from "./classes.js";
import helpers from "./helpers.js";

// Program Entry Function
const init = async () => {
    console.clear();

    // Inquirer Pokemon Select
    // let pokemon = await selectPokemon();

    // Pokemon Creation
    let userPokemon = await createPokemon("grotle", false);
    let sysPokemon = await createPokemon("turtwig", true);

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
const createStatClass = ({ base_stat, effort, stat }, level, nature) => {
    const iv = helpers.randomInt(32);
    const statCalculation = ((2 * base_stat + iv + (effort / 4)) * level);
    const natureStats = { increase: nature.changedStat(true), decrease: nature.changedStat(false) };
    let statValue;

    if (stat.name === "hp") {
        statValue = (statCalculation / 100) + level + 10;
    } else {
        const value = (statCalculation / 100) + 5;
        if (stat.name === natureStats.increase) {
            statValue = value * 1.1
        } else if (stat.name === natureStats.decrease) {
            statValue = value * 0.9
        } else {
            statValue = value
        }
    }

    return new Stat(base_stat, Math.floor(statValue), iv, effort)
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
        moveData.meta.category.name,
        moveData.meta.ailment.name,
        moveData.effect_chance
    );
}
const createPokeClass = async ({ name, types, stats, species }, moves) => {
    const firstType = helpers.filterPokeType(types, 1);
    const secondType = helpers.filterPokeType(types, 2);
    const desc = await helpers.findDescription(axios, species.url);
    const nature = new Nature(helpers.determineNature());
    const level = 5;

    const chosenStats = new Stats();
    stats.forEach((stat) => {

        let statName = stat.stat.name;
        const statClass = createStatClass(stat, level, nature);

        if (statName.startsWith("special")) {
            if (statName === "special-attack") {
                statName = "specialAttack"
            } else {
                statName = "specialDefense"
            }
        }

        chosenStats[statName] = statClass;
    });

    return new Pokemon(
        name,
        desc,
        firstType.type.name,
        !secondType ? "" : secondType.type.name,
        level,
        nature,
        chosenStats,
        moves
    );
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
        let { userMove, systemMove } = await battleMoves(userPokemon, sysPokemon.moves);
        let userFirst = doesUserMoveFirst(userPokemon, sysPokemon, userMove, systemMove);

        // Before Ailment
        // Returns true if pokemon can move
        const ailmentOneResultBefore = await executeBeforeAilment(userFirst ? userPokemon : sysPokemon, userFirst ? userMove : systemMove);

        // First Move
        if (ailmentOneResultBefore) {
            const moveOneResult = await executeMove(
                userFirst ? userPokemon : sysPokemon,
                userFirst ? sysPokemon : userPokemon,
                userFirst ? userMove : systemMove
            );
            await helpers.delay(1500);

            if (!moveOneResult) {
                break;
            }
        } else {
            const target = userFirst ? userPokemon : sysPokemon;
            if (target.stats.hp.value <= 0) {

                if (target === userPokemon) {
                    userPokemon.stats.hp.value = 0;
                } else {
                    sysPokemon.stats.hp.value = 0;
                }

                console.log(`${target.name} has fainted!`);
                await helpers.delay(1500);

                return false
            }
        }

        // Before Ailment
        // Returns true if pokemon can move
        const ailmentTwoResultBefore = await executeBeforeAilment(userFirst ? sysPokemon : userPokemon, userFirst ? systemMove : userMove);

        // Second Move
        if (ailmentTwoResultBefore) {
            const moveTwoResult = await executeMove(
                userFirst ? sysPokemon : userPokemon,
                userFirst ? userPokemon : sysPokemon,
                userFirst ? systemMove : userMove
            );
            await helpers.delay(1500);

            if (!moveTwoResult) {
                break;
            }
        } else {
            const target = userFirst ? sysPokemon : userPokemon;
            if (target.stats.hp.value <= 0) {

                if (target === userPokemon) {
                    userPokemon.stats.hp.value = 0;
                } else {
                    sysPokemon.stats.hp.value = 0;
                }

                console.log(`${target.name} has fainted!`);
                await helpers.delay(1500);

                return false
            }
        }

        const ailmentOneResult = await executeAfterAilment(userFirst ? userPokemon : sysPokemon, userFirst ? systemMove : userMove);
        if (!ailmentOneResult) {
            break;
        }

        const ailmentTwoResult = await executeAfterAilment(userFirst ? sysPokemon : userPokemon, userFirst ? userMove : systemMove);
        if (!ailmentTwoResult) {
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
const determinePokeSpeed = (pokemon) => {
    let speedStatValue = pokemon.stats.speed.value;
    const filteredAilments = pokemon.ailments.filter(x => x.name === "paralysis");

    if (filteredAilments.length > 0) {
        speedStatValue = speedStatValue * 0.5;
    }

    return Math.floor(speedStatValue)
}
const doesUserMoveFirst = (user, system, userMove, systemMove) => {
    let userFirst;
    const userSpeed = determinePokeSpeed(user);
    const sysSpeed = determinePokeSpeed(system);

    if (userMove.priority == systemMove.priority) {
        if (userSpeed == sysSpeed) {
            userFirst = !!helpers.randomInt(2);
        } else {
            userFirst = userSpeed > sysSpeed
        }
    } else {
        userFirst = userMove.priority > systemMove.priority;
    }

    return userFirst
}
const calculateStatDamage = (attackPoke, defendPoke, move) => {
    const isPhysical = move.damageClass === "physical";
    const attackStat = isPhysical ? attackPoke.stats.attack : attackPoke.stats.specialAttack;
    const defenseStat = isPhysical ? defendPoke.stats.defense : defendPoke.stats.specialDefense;

    return { attackNum: helpers.determineStatStage(attackStat), defenseNum: helpers.determineStatStage(defenseStat) }
}
const calculateDamage = (attackPoke, defendPoke, move) => {
    const { attackNum, defenseNum } = calculateStatDamage(attackPoke, defendPoke, move);
    const typeOneMod = helpers.typeMatrix(move.type, defendPoke.typeOne);
    const typeTwoMod = !defendPoke.typeTwo ? 1 : helpers.typeMatrix(move.type, defendPoke.typeTwo);
    let finalAttackNum;

    const filteredAilments = defendPoke.ailments.filter(x => x.name === "burn");

    if (filteredAilments.length > 0 && move.damageClass === "physical") {
        finalAttackNum = Math.floor(attackNum * 0.5);
    } else {
        finalAttackNum = attackNum
    }

    const damageObject = {
        baseDamage: (((attackPoke.level * 2) / 5) + 2 * move.power * (finalAttackNum / defenseNum) / 50) + 2,
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
const doesMoveHit = (accuracy, evasion, moveAccuracy) => {

    if (moveAccuracy === null) {
        return true;
    }

    const combinedStage = accuracy - evasion;
    let convertedStage;

    if (combinedStage > 6) {
        convertedStage = (9 / 3)
    } else if (combinedStage < -6) {
        convertedStage = (3 / 9)
    } else {
        switch (combinedStage) {
            case -6:
                convertedStage = (3 / 9);
                break;
            case -5:
                convertedStage = (3 / 8);
                break;
            case -4:
                convertedStage = (3 / 7);
                break;
            case -3:
                convertedStage = (3 / 6)
                break;
            case -2:
                convertedStage = (3 / 5)
                break;
            case -1:
                convertedStage = (3 / 4)
                break;
            case 1:
                convertedStage = (4 / 3)
                break;
            case 2:
                convertedStage = (5 / 3)
                break;
            case 3:
                convertedStage = (6 / 3)
                break;
            case 4:
                convertedStage = (7 / 3)
                break;
            case 5:
                convertedStage = (8 / 3)
                break;
            case 6:
                convertedStage = (9 / 3)
                break;
            default:
                convertedStage = (3 / 3)
                break;
        }
    }

    const hitChance = Math.floor(moveAccuracy * convertedStage);
    const random = helpers.randomInt(100) + 1;

    return random <= hitChance
}
const executeMove = async (attackPoke, defendPoke, move) => {

    console.log(`${attackPoke.name} used ${move.name}!`);
    move.pp--

    // Accuracy/Evasion Calculation
    if (!doesMoveHit(attackPoke.stats.accuracy.stage, defendPoke.stats.evasion.stage, move.accuracy)) {
        await helpers.delay(1500);
        if (attackPoke.stats.accuracy < 0 || move.accuracy < 100) {
            console.log("The attack missed!");
        } else {
            console.log(`${defendPoke.name} evaded the attack!`);
        }

        return true;
    }

    await helpers.delay(1500);

    switch (move.category) {
        case "damage":
            await damageMove(attackPoke, defendPoke, move);
            break;

        case "ailment":
            await ailmentMoveOrChange(defendPoke, move);
            break;

        case "net-good-stats":
            await statusMoveOrChange(attackPoke, defendPoke, move);
            break;

        case "heal":
            console.log("heal");
            break;

        case "damage+ailment":
            await damageMove(attackPoke, defendPoke, move);
            await ailmentMoveOrChange(defendPoke, move);
            break;

        case "swagger":
            console.log("swagger");
            break;

        case "damage+lower":
            await damageMove(attackPoke, defendPoke, move);
            await statusMoveOrChange(attackPoke, defendPoke, move);
            break;

        case "damage+raise":
            await damageMove(attackPoke, defendPoke, move);
            await statusMoveOrChange(attackPoke, defendPoke, move);
            break;

        case "damage+heal":
            await damageMove(attackPoke, defendPoke, move);
            break;

        case "ohko":
            console.log("ohko");
            break;

        case "whole-field-effect":
            console.log("whole-field-effect");
            break;

        case "field-effect":
            console.log("field-effect");
            break;

        case "force-switch":
            console.log("force-switch");
            break;

        default:
            await uniqueMove(attackPoke, defendPoke, move);
            break;
    }

    if (defendPoke.stats.hp.value <= 0) {
        defendPoke.stats.hp.value = 0;

        console.log(`${defendPoke.name} has fainted!`);
        await helpers.delay(1500);

        return false;
    }

    return true;
}
const damageMove = async (attackPoke, defendPoke, move) => {
    const { totalDamage, damageObject } = calculateDamage(attackPoke, defendPoke, move);

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

    const remainingHealth = defendPoke.stats.hp.value - totalDamage
    defendPoke.stats.hp.value = remainingHealth;
    console.log(`${defendPoke.name} took ${totalDamage} damage!`);

    const ailmentNames = defendPoke.ailments.map(x => x.name);
    const thawingMove = ["fusion-flare", "flame-wheel", "sacred-fire", "flare-blitz", "scald", "steam-eruption"].includes(move.name);

    // Side Effects
    if (ailmentNames.includes("freeze") && thawingMove) {
        defendPoke.ailments = defendPoke.ailments.filter(x => x.name !== "freeze");
        await helpers.delay(1500);
        console.log(`${defendPoke.name} was thawed out!`);
    }
}
const statusMoveOrChange = async (attackPoke, defendPoke, move) => {
    let boolStatChange = true;

    if (move.effect_chance !== null) {
        boolStatChange = helpers.randomInt(100) + 1 <= 100;
    }

    if (boolStatChange) {
        for (let i = 0; i < move.statChanges.length; i++) {
            const { target, stat, change } = move.statChanges[i];
            const targetPokemon = target === "user" ? attackPoke : defendPoke;
            const convertedStat = stat === "special-attack" || stat === "special-defense" ? stat === "special-attack" ? "specialAttack" : "specialDefense" : stat;
            const targetStat = targetPokemon.stats[convertedStat];

            if (targetStat.stage == 6 || targetStat.stage == -6) {
                console.log(`${targetPokemon.name}'s ${stat} won't go any ${change < 0 ? "lower" : "higher"}!`);
            } else {
                if (targetPokemon === attackPoke) {
                    attackPoke.stats[convertedStat].stage = attackPoke.stats[convertedStat].stage + change
                } else {
                    defendPoke.stats[convertedStat].stage = defendPoke.stats[convertedStat].stage + change
                }

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

            await helpers.delay(1500);
        }

    }
}
const ailmentMoveOrChange = async (defendPoke, move) => {
    let boolAilmentChange;

    if (defendPoke.stats.hp.value <= 0) {
        return;
    }

    if (move.effect_chance === null || move.effect_chance === undefined) {
        boolAilmentChange = true
    } else {
        boolAilmentChange = helpers.randomInt(100) + 1 <= move.effect_chance;
    }

    if (boolAilmentChange) {

        // Pokemon can only be affected by one non-volatile ailment at a time.
        const nonVolatileAilment = defendPoke.ailments.filter(x => x.volatile === false)[0];
        const existingAilment = defendPoke.ailments.filter(x => x.name === move.ailment);

        // Speciality Cases
        let specialityCase = false;
        switch (move.ailment) {
            case "freeze":
                // Ice Type Pokemon cannot be frozen
                if (defendPoke.isType("ice")) {
                    specialityCase = true
                }

                break;
            case "burn":
                // Fire Type Pokemon cannot be burned
                if (defendPoke.isType("fire")) {
                    specialityCase = true
                }

                break;
            case "paralysis":
                // Electric Type Pokemon cannot be paralyzed
                if (defendPoke.isType("electric")) {
                    specialityCase = true
                }

                break;
            case "poison":
                // Poison and Steel Type Pokemon cannot be poisoned
                if (defendPoke.isType("poison") || defendPoke.isType("steel")) {
                    specialityCase = true
                }

                break;
            default:
                break;
        }


        if (nonVolatileAilment || existingAilment.length !== 0) {
            if (move.category === "ailment") {
                console.log("But it failed!");
            }

            return;
        }

        if (specialityCase) {
            if (move.category === "ailment") {
                console.log("It had no effect.");
            }

            return;
        }

        const newAilment = new Ailment(
            move.ailment,
            !["burn", "freeze", "paralysis", "poison", "sleep"].includes(move.ailment),
            move.ailment === "trap" ? move.name : ""
        )

        defendPoke.ailments.push(
            newAilment
        );

        console.log(newAilment);

        switch (move.ailment) {
            case "burn":
                console.log(`${defendPoke.name} was burned!`);
                break;
            case "freeze":
                console.log(`${defendPoke.name} was frozen!`);
                break;
            case "paralysis":
                console.log(`${defendPoke.name} was paralyzed!`);
                break;
            case "poison":
                console.log(`${defendPoke.name} was poisoned!`);
                break;
            case "sleep":
                console.log(`${defendPoke.name} fell asleep!`);
                break;
            case "trap":
                console.log(`${defendPoke.name} was trapped by ${move.name}!`);
                break;
            case "confusion":
                console.log(`${defendPoke.name} was confused!`);
                break;
            default:
                break;
        }

        await helpers.delay(1500);
    }
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
                "HP": `${pokemon.stats.hp.value}/${pokemon.stats.hp.starting}`
            }
        );
        console.log("\n");
        console.log("Pokemon Stats");
        console.table(
            {
                "Attack": helpers.determineStatStage(pokemon.stats.attack),
                "Defense": helpers.determineStatStage(pokemon.stats.defense),
                "Special Attack": helpers.determineStatStage(pokemon.stats.specialAttack),
                "Special Defense": helpers.determineStatStage(pokemon.stats.specialDefense),
                "Speed": helpers.determineStatStage(pokemon.stats.speed)
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
const executeAfterAilment = async (pokemon, move) => {
    const anyAilments = pokemon.ailments.filter(x => x.afterTurn);

    if (anyAilments.length !== 0) {

        for (let i = 0; i < anyAilments.length; i++) {
            const ailment = anyAilments[i];

            ailment.ailmentFunc(pokemon, move);
            await helpers.delay(1500);

            if (pokemon.stats.hp.value <= 0) {
                pokemon.stats.hp.value = 0;

                console.log(`${pokemon.name} has fainted!`);
                await helpers.delay(1500);

                return false
            }
        }
    }

    return true
}
const executeBeforeAilment = async (pokemon, move) => {
    const anyAilments = pokemon.ailments.filter(x => x.beforeTurn);

    if (anyAilments.length !== 0) {
        for (let i = 0; i < anyAilments.length; i++) {
            const ailment = anyAilments[i];
            const result = ailment.ailmentFunc(pokemon, move);

            await helpers.delay(1500);

            if (!result) {
                return false
            }
        }
    }

    return true
}
const uniqueMove = async (attackPoke, defendPoke, move) => {
    switch (move.name) {
        case "curse":
            if (attackPoke.isType("ghost")) {
                const filteredAilments = defendPoke.ailments.filter(x => x.name === "curse");

                if (filteredAilments.length == 0) {
                    // Cannot be blocked by protection moves

                    // User takes half it's max health in damage
                    const damage = Math.floor(attackPoke.stats.hp.starting / 2);
                    attackPoke.stats.hp.value = attackPoke.stats.hp.value - damage;

                    // Target loses 1/4 max health each turn            
                    defendPoke.ailments.push(new Ailment("curse", true, ""));
                    console.log(`${defendPoke.name} was cursed!`);

                } else {
                    console.log("But it failed!");
                }
            } else {
                const statArray = ["speed", "attack", "defense"]

                for (let i = 0; i < statArray.length; i++) {
                    const targetStat = statArray[i];
                    if (targetStat === "speed") {
                        if (targetStat.stage == -6) {
                            console.log(`${attackPoke.name}'s speed won't go any lower!`);
                        } else {
                            attackPoke.stats[targetStat].stage--
                            console.log(`${attackPoke.name}'s speed fell!`);
                        }
                    } else {
                        if (targetStat.stage == 6) {
                            console.log(`${attackPoke.name}'s ${targetStat} won't go any higher!`);
                        } else {
                            attackPoke.stats[targetStat].stage++
                            console.log(`${attackPoke.name}'s ${targetStat} rose!`);
                        }
                    }

                    if (i !== 2) {
                        await helpers.delay(1500);
                    }
                }
            }
            break;

        default:
            break;
    }
}

// Ending Sub-Functions
const endGame = async (userPokemon, sysPokemon) => {
    console.clear();
    const winner = [userPokemon, sysPokemon].filter(x => x.stats.hp.value !== 0)[0];

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