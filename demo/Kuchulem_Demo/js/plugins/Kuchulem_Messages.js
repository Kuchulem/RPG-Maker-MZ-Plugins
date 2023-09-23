if (!Kuchulem) {
    throw new Error("Kuchulem_Npcs requires Kuchulem_Base plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Replaces the event message parsing system for control caracters 
 * (like \V[1] for variables).
 * @author Kuchulem
 *
 * @help Kuchulem_Messages.js
 *
 * TODO description
 * 
 * @command test
 * @Text Test
 * 
 */
//#region  Kuchulem_Messages_Parser_Match prototype definition
/**
 * Represent a parser match.
 * 
 * When a parser matches a control string it should return an instance of this
 * prototype.
 * 
 * @param {Kuchulem_Messages_Parser_Base} parser 
 * @param {any} parameter 
 */
function Kuchulem_Messages_Parser_Match(parser, parameter) {
    this._parser = parser;
    this._parameter = parameter;
}

/**
 * Gets the parser that had the match
 * 
 * @returns {Kuchulem_Messages_Parser_Base}
 */
Kuchulem_Messages_Parser_Match.prototype.parser = function() { return this._parser; };

/**
 * Gets the parameter in the match
 * 
 * @returns {string}
 */
Kuchulem_Messages_Parser_Match.prototype.parameter = function() { return this._parameter; };
//#endregion

//#region  Kuchulem_Messages_Parser_Base prototype definition
/**
 * Base prototype for a parser. All custom parsers should extend that prototype.
 */
function Kuchulem_Messages_Parser_Base() {
    throw new Error("This is an abstract prototype");
}

/**
 * Checks if the parser matches the control string passed as argument. If it 
 * matches, returns an instance of Kuchulem_Messages_Parser_Match. If not,
 * returns null or undefined. (false works too but let's try to be consistent).
 * 
 * A control string is the string composed of digits (0 to 9), letters (a to z 
 * and A to Z), brackets ([ and ]) dashes (-) and underscores (_) that directly
 * follows the "\\" in the message
 * ie:
 * 
 * Message: "Hello, I'm \Npc_firstName[1], let's talk"
 * 
 * Control string: Npc_firstName[1]
 * 
 * @param {string} controlString 
 * 
 * @returns {Kuchulem_Messages_Parser_Match}
 */
Kuchulem_Messages_Parser_Base.prototype.matches = function(controlString) {
    throw [
        "The prototype method is abstract", 
        "Kuchulem_Messages_Parser_Base.protype.matches", 
        "This method should be overriden by any prototype impleting Kuchulem_Messages_Parser_Base"];
}

/**
 * The callback called when the "matches()" method returns true.
 * 
 * By default  the "this" statement in the callback will refere to the parser 
 * instance.
 * 
 * If the "thisArg()" method returns an object, the "this" statement will 
 * refere to that object.
 * 
 * @returns {Function}
 */
Kuchulem_Messages_Parser_Base.prototype.callback = function() {
    throw [
        "The prototype method is abstract", 
        "Kuchulem_Messages_Parser_Base.protype.callback", 
        "This method should be overriden by any prototype impleting Kuchulem_Messages_Parser_Base"];
}

/**
 * The object to be used as the "this" statement in the function returned by 
 * the "callback()" method.
 * 
 * If this method returns "null" or is not overloaded then the "this" statement
 * of the callback will be the parser instance.
 * 
 * @returns {any}
 */
Kuchulem_Messages_Parser_Base.prototype.thisArg = function() {
    return null;
}
//#endregion

//#region  Kuchulem_Messages_Parser prototype definition
/**
 * Defines a custom parser to enhanse the Kuchulem_Message_Interpretor that 
 * parses messages to convert control characters with expected strings.
 * 
 * @param {string} controlCaracter The expected control character(s) with the 
 * leading "\\"
 * @param {boolean} hasParameter If a parameter is expected (will expect a 
 * string within brackets)
 * @param {Function} callback The callback that will take the 
 * Kuchulem_Message_Interpretor and the expected parameter (if any) as 
 * parameter.
 */
function Kuchulem_Messages_Parser(controlCaracter, hasParameter, callback, thisArg) {
    this.initialize(controlCaracter, hasParameter, callback, thisArg);
}

Kuchulem_Messages_Parser.prototype = Object.create(Kuchulem_Messages_Parser_Base.prototype);
Kuchulem_Messages_Parser.prototype.constructor = Kuchulem_Messages_Parser;

/**
 * 
 * @param {string} controlCaracter 
 * @param {boolean} hasParameter 
 * @param {Function} callback 
 */
Kuchulem_Messages_Parser.prototype.initialize = function(
    controlCaracter, 
    hasParameter, 
    callback, 
    thisArg
) {
    this._controlCaracter = controlCaracter;
    this._hasParameter = hasParameter;
    this._callback = callback;
    this._thisArg = thisArg;
    this._regExp = new RegExp(`^(${ this._controlCaracter })${ this._hasParameter ? "(\\[([\\w\\d_\\{\\}]+)\\])?" : ""}$`);
};

/**
 * The callback that will return the expected replacement string. It will 
 * receive the Kuchulem_Message_Interpretor instance as argument and the
 * parameter if hasParameter is set to true.
 * 
 * @returns {Function}
 */
Kuchulem_Messages_Parser.prototype.callback = function() { return this._callback; };

/**
 * The object to use as this statement in the callback.
 * 
 * @returns {any}
 */
Kuchulem_Messages_Parser.prototype.thisArg = function() { return this._thisArg; };

Kuchulem_Messages_Parser.prototype.matches = function(controlString) {
    if (!this._regExp.test(controlString)) {
        return null;
    }

    const match = this._regExp.exec(controlString);

    return new Kuchulem_Messages_Parser_Match(this, match[3] ?? null);
}
//#endregion

function Kuchulem_Messages_Interpreter() {
    this.initialize();
}

Kuchulem_Messages_Interpreter.prototype.initialize = function() {
    this._regExp = /\\(([\w\{\}]+)(\[([\w\{\}]+)\])?)/;
};

Kuchulem_Messages_Interpreter.prototype.parse = function(text) {
    const hasControlString = this._regExp.test(text);
    if (!hasControlString) {
        return text;
    }

    const controlMatches = this._regExp.exec(text);

    const controlString = controlMatches[1];

    const matchList = $messageParsers.parsers(controlString);

    if (matchList.length > 1) {
        throw ["ParsersConflict", controlString, `${matchList.length} parsers matches the control string`];
    }

    if (matchList.length === 0) {
        const index = text.indexOf(controlMatches[0]) + controlMatches[0].length;
        return text.substring(0, index) + this.parse(text.substring(index));
    } else {
        const parser = matchList[0].parser();
        const parameter = matchList[0].parameter();
        const thisArg = parser.thisArg() ?? this;
        const replace = parser.callback().call(thisArg, this, parameter);
        text = text.replace(this._regExp, this.parse(replace));

        return this.parse(text);
    }

};


(() => {

    //#region Kuchulem_Messages_Parsers prototype definition
    function Kuchulem_Messages_Parsers() {
        this.initialize();
    }

    Kuchulem_Messages_Parsers.prototype.initialize = function() {
        this._parsers = [];
    };

    Kuchulem_Messages_Parsers.prototype.registerParser = function(parser) {
        if (!(parser instanceof Kuchulem_Messages_Parser_Base)) {
            throw ["WrongParserType", typeof(parser), "The parser does not implement Kuchulem_Messages_Parser_Base"];
        }

        this._parsers.push(parser);
    };

    Kuchulem_Messages_Parsers.prototype.parsers = function(controlString) {
        return this._parsers.reduce((a, v) => {
            const matches = v.matches(controlString);
            if (matches instanceof Kuchulem_Messages_Parser_Match) {
                a.push(matches);
            }
    
            return a;
        }, []);
    }
    //#endregion

    //#region Game_Message prototype override
    const Game_Message_initialize_base = Game_Message.prototype.initialize;
    Game_Message.prototype.initialize = function() {
        Game_Message_initialize_base.call(this, ...arguments);
        this._messagesInterpreter = new Kuchulem_Messages_Interpreter();
    }

    const Game_Message_add_base = Game_Message.prototype.add;
    Game_Message.prototype.add = function(text) {
        text = this._messagesInterpreter.parse(text);
        Game_Message_add_base.call(this, text);
    }

    //#region $messageParsers initialization
    Kuchulem.createGameObject("$messageParsers", new Kuchulem_Messages_Parsers());
    //#endregion
})();