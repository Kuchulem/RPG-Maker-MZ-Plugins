if (!Kuchulem) {
    throw new Error("Kuchulem_Convos requires Kuchulem_Base plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Relies on Kuchulem_Npcs plugin to change conversations images.
 * @author Kuchulem
 * 
 * @help Kuchulem_Convos.js
 * 
 * @command setSpeakerToNPC
 * @text Set NPC as speaker
 * @desc The next messages will have the event's attached NPC face and name
 *       displayed instead of those configured.
 *       To reset the speaker call the resetSpeakerToDefault command.
 * 
 * @command resetSpeakerToDefault
 * @text Reset the speaker
 * @desc Resets the speaker for the next messages. The default from the message
 *       configuration will be displayed.
 */
(() => {
    const pluginName = "Kuchulem_Convos";

    const Game_Interpreter_command101_base = Game_Interpreter.prototype.command101;
    Game_Interpreter.prototype.command101 = function(params) {
        const event = $gameMap.event(this.eventId());
        if (event.isNpcSpeaker() && event.npc()) { 
            const npcSpeaker = event.npc()
            params[0] = npcSpeaker.faceName;
            params[1] = npcSpeaker.faceIndex;
            params[4] = npcSpeaker.firstName + ' ' + npcSpeaker.lastName;
        }
        return Game_Interpreter_command101_base.call(this, params);
    }

    /**
     * Checks if the speaker should be the NPC
     * 
     * @returns {boolean}
     */
    Game_Event.prototype.isNpcSpeaker = function() {
        return !!this._npcSpeaker;
    }

    /**
     * Set the NPC as speaker
     */
    Game_Event.prototype.setNpcSpeaker = function() {
        this._npcSpeaker = true;
    }

    /**
     * Unset the NPC as speaker
     */
    Game_Event.prototype.resetNpcSpeaker = function() {
        this._npcSpeaker = false;
    }

    const setSpeakerToNPC = function() {
        const event = $gameMap.event(this.eventId());

        if (event) {
            event.setNpcSpeaker();
        }
    }

    const resetSpeakerToDefault = function() {
        const event = $gameMap.event(this.eventId());

        if (event) {
            event.resetNpcSpeaker();
        }
    }

    PluginManager.registerCommand(pluginName, "setSpeakerToNPC", setSpeakerToNPC);
    PluginManager.registerCommand(pluginName, "resetSpeakerToDefault", resetSpeakerToDefault);
})();