'use strict';
/*
 * 
 * 
 */ 
var InputValidator = function(){

};



/*
 * Normalises the message text and then ensures
 * that we can decode it
 */
InputValidator.normalizeMessage = function (message) {
    var unorm  = require('unorm');

    // normalize so we are comparing apples to apples
    // assumes utf8 or ascii shell
    // @todo check
    var text = unorm.nfc(message.text);
    text.trim();
    console.log('received the following from the remote' + text);

    if (!message.text) {
        throw { 
            name: 'MessageEmpty', 
            message:'Message Text is empty'
        }
    }

    message.text = text;
}

InputValidator.isValidCommand = function(command, validCommands) {
    if (!Array.isArray(validCommands)) {
        throw {
            name:'InvalidArgumentException', 
            message: 'validCommands must be an array' 
        }
    }

    // limit to only alpha-numeric
    // @todo
    return true;
};

/*
 * Parses a space separated list in the format
 * into an array with keys 
 *  [
 *      'command': 'foo'
 *      'args': [
 *          'bar',
 *          'grah'
 *       ]
 *  ]
 * 
 * <command> <arg1> <arg2> etc..
 */
InputValidator.parseMessage = function(msgText) {

    if (!msgText) {
        throw { name: 'MessageEmpty', message: "can't parse empty text" }
    }

    var args = msgText.split(' ');
    args.shift();

    if (args.length < 1) {
        throw { name: "ZeroArguments", message: "length of argument array is 0" }        
    }
    
    return {
        'command': args.shift(),
        'args': args
    };
};


module.exports = InputValidator;