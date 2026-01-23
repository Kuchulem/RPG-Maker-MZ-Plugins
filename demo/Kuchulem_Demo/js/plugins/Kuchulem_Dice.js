if (!Kuchulem) {
    throw new Error("Kuchulem_Events requires Kuchulem plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Runs dices in the form 2d6 + 3 (2 six-faced dices + 3).
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * @base Kuchulem_Messages
 * @base Kuchulem_Events
 *
 * @help Kuchulem_Dice.js
 *
 * This plugins adds dice throwing capabilities to RPG Maker MZ.
 * 
 * @command throwDice
 * @text Throw a dice
 * @desc Throws a dice in the form XdY + Z (X Y-faced dices + Z)
 * 
 * @arg diceExpression
 * @type string
 * @text Dice expression
 * @desc The dice expression to throw, in the form XdY + Z (X Y-faced dices + Z).
 * 
 * @arg resultVar
 * @type variable
 * @text Result variable
 * @desc The variable where to store the result of the dice throw
 */

(() => {
    const pluginName = "Kuchulem_Dice";

    PluginManager.registerCommand(pluginName, "throwDice", function (args) {
        const expression = args.diceExpression;
        const resultVarId = Number(args.resultVar);
        const result = Kuchulem.Dice.throwDice(expression);
        $gameVariables.setValue(resultVarId, result.total);
    });

    /**
     * Namespace for dice related functions
     */
    Kuchulem.Dice = {}; 
    /**
     * Throws a dice based on the given expression
     * @param {string} expression The dice expression in the form XdY + Z (X Y-faced dices + Z)
     * @returns {object} The result of the dice throw, including individual dice and total
     */
    Kuchulem.Dice.throwDice = function (expression) {
        expression = $messageInterpreter.parse(expression);
        const dicePattern = /(\d*)d(\d+)(\s*[+\-*/]\s*(\d+))?/i;
        const match = expression.match(dicePattern);
        if (!match) {
            throw new Error(`Invalid dice expression: ${expression}`);
        }
        const numDice = match[1] ? parseInt(match[1], 10) : 1;
        const numFaces = parseInt(match[2], 10);
        const modifier = match[4] ? parseInt(match[4], 10) : 0;
        const operator = match[3] ? match[3].trim().charAt(0) : '+';
        let total = 0;
        var result = {dies: [], total: 0};
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * numFaces) + 1;
            total += roll;
            result.dies.push(roll);
        }

        switch (operator) {
            case '+':
                total += modifier;
                break;
            case '-':
                total -= modifier;
                break;
            case '*':
                total *= modifier;
                break;
            case '/':
                total = Math.floor(total / modifier);
                break;
        }
        result.total = total;
        return result;
    };
})();