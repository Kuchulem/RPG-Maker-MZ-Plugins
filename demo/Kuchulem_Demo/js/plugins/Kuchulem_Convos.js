if (!Kuchulem) {
    throw new Error("Kuchulem_Convos requires Kuchulem_Base plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Relies on Kuchulem_Npcs plugin to change conversations images.
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * @base Kuchulem_Events
 * @base Kuchulem_Npcs
 * 
 * @help Kuchulem_Convos.js
 * Relies on Kuchulem_Npcs plugin.
 * Provides commands to automatically set the face and name of message to
 * a NPC or actor.
 * 
 * @command setEventNpcAsSpeaker
 * @text Set attached NPC as speaker
 * @desc The next messages will have the event's attached NPC face and name
 *       displayed instead of those configured.
 *       To reset the speaker call the resetSpeakerToDefault command.
 * 
 * @command setNpcAsSpeaker
 * @text Set an NPC as speaker
 * @desc The next messages will have the selected NPC face and name displayed
 *       instead of those configured.
 *       To reset the speaker call the resetSpeakerToDefault command.
 * 
 * @arg npcId
 * @text Npc ID
 * @type number
 * @min 0
 * @desc The ID of the NPC to use as speaker.
 * 
 * @command setActorAsSpeaker
 * @text Set actor as speaker
 * @desc The next messages will have the selected actor face and name displayed
 *       instead of those configured.
 *       To reset the speaker call the resetSpeakerToDefault command.
 * 
 * @arg actorId
 * @text Actor
 * @type actor
 * @desc The actor to use as speaker.
 * 
 * @command resetSpeakerToDefault
 * @text Reset the speaker
 * @desc Resets the speaker for the next messages. The default from the message
 *       configuration will be displayed.
 */
/**
 * Defines a speaker
 * 
 * @param {string} faceName 
 * @param {number} faceIndex 
 * @param {string} name 
 */
function Speaker(faceName, faceIndex, name) {
    this.initialize(faceName, faceIndex, name);
}

/**
 * Initializes a speaker
 * 
 * @param {string} faceName 
 * @param {number} faceIndex 
 * @param {string} name 
 */
Speaker.prototype.initialize = function(faceName, faceIndex, name) {
    this.faceName = faceName;
    this.faceIndex = faceIndex;
    this.name = name;
};

(() => {
    const pluginName = "Kuchulem_Convos";

    //#region Game interpreter overloading 
    const Game_Interpreter_command101_base = Game_Interpreter.prototype.command101;
    Game_Interpreter.prototype.command101 = function(params) {
        const event = $gameMap.event(this.eventId());
        const speaker = event.speaker();
        if (!!speaker) { 
            params[0] = speaker.faceName;
            params[1] = speaker.faceIndex;
            params[4] = speaker.name;
        }
        return Game_Interpreter_command101_base.call(this, params);
    };
    //#endregion

    //#region Game_Event overloading
    /**
     * Set the NPC as speaker
     */
    Game_Event.prototype.setNpcSpeaker = function(npc) {
        this._speaker = new Speaker(
            npc.faceName, 
            npc.faceIndex, 
            (`${npc.firstName} ${npc.lastName}`).trim()
        );
    };

    /**
     * Set the NPC as speaker
     */
    Game_Event.prototype.setActorSpeaker = function(actor) {
        this._speaker = new Speaker(
            actor.faceName(), 
            actor.faceIndex(), 
            actor.name());
    };

    /**
     * Unset the NPC as speaker
     */
    Game_Event.prototype.resetSpeaker = function() {
        delete(this._speaker);
    };

    /**
     * Unset the NPC as speaker
     */
    Game_Event.prototype.speaker = function() {
        return this._speaker;
    };
    //#endregion

    //#region commands
    const setEventNpcAsSpeaker = function() {
        const event = $gameMap.event(this.eventId());

        if (event) {
            event.setNpcSpeaker(event.npc());
        }
    };

    const resetSpeakerToDefault = function() {
        const event = $gameMap.event(this.eventId());

        if (event) {
            event.resetSpeaker();
        }
    };

    const setNpcAsSpeaker = function(args) {
        const event = $gameMap.event(this.eventId());
        const npcId = Number(args.npcId);

        if (event) {
            event.setNpcSpeaker($gameNpcs.npc(npcId));
        }

    }

    const setActorAsSpeaker = function(args) {
        const event = $gameMap.event(this.eventId());
        const actorId = Number(args.actorId);

        if (event) {
            event.setActorSpeaker($gameActors.actor(actorId));
        }
    }

    PluginManager.registerCommand(pluginName, "setEventNpcAsSpeaker", setEventNpcAsSpeaker);
    PluginManager.registerCommand(pluginName, "setNpcAsSpeaker", setNpcAsSpeaker);
    PluginManager.registerCommand(pluginName, "setActorAsSpeaker", setActorAsSpeaker);
    PluginManager.registerCommand(pluginName, "resetSpeakerToDefault", resetSpeakerToDefault);
    //#endregion
})();