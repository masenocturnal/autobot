/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A Slack Bot using Botkit

Exposes defined executable scripts / binaries to a network chat service
such as slack / mattermost / rocket.chat / HipChat 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

if (!process.env.slack_token ) {
    console.error('Error: Specify slack_token in environment');
    process.exit(1);
}

// 3rd party libs
var Botkit = require('botkit');

var isAwake    = true;
var controller = buildController(process.env);

var bot = controller.spawn({
    token: process.env.slack_token
}).startRTM();

controller.hears(['do'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    var processDone = false;
    var output = '';

    // We return a message here so that the user
    // has immediate feedback
    bot.reply(message, "OK boss.");
    
    try {

        var InputValidator = new require('./zdam/InputValidator'); 
        InputValidator.normalizeMessage(message);

        var commands = InputValidator.parseMessage(message.text);

        // @todo load from config
        var validCommands = [
            'HelloBot',
            'ansible-playbook'
        ];

        if (InputValidator.isValidCommand(commands['command'], validCommands)) {
            // @todo more validation
            // @todo try to split this up more
            var spawn = require("child_process").execFile, child;
            console.log(commands.command);
            console.log(commands.args);
            bot.reply(message, 'Output: ' );
            //@todo make configurable
            child = spawn("./Tasks/" +commands.command, commands.args );            
            child.stdout.on("data", function(data){
                var StringDecoder= require('string_decoder').StringDecoder;
                
                var decoder = new StringDecoder("utf-8");
                var output = decoder.write(data);
                bot.reply(message, output);
                console.log("Data: " + output);
            });

            child.stderr.on("data",function(data){
                console.log("Errors: " + data);
            });

            child.on("exit",function(){
                prcessDone = true;
                console.log("Script finished");
            });
            
            child.stdin.end(); //end input
        } else {
            var msg = 'Can not run :' + commands['command'] +" as it's not in the whitelist" 
            console.error(msg);
            bot.reply("Sorry, this command is not in the whitelist");
            processDone = true;
        }
        // @todo remove any special chars from the command. 
        // @todo make sure command is present in _our_ path and executable

    } catch(e) {
        console.error(e);

        switch (e.name) {
            case 'MessageEmpty':
                bot.reply("I'm sorry, you haven't told me what you want me to do");
                processDone = true;
            break;
            case 'ZeroArguments':                
                bot.reply("I'm not sure what you want me to do: Try one of the following:");
                bot.reply(usage());
                processDone = true;
            break;
        }        
    } 
});

controller.hears(['hello'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message, 'Hello Im alive');
    
});

controller.hears(['wake'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message, 'Good Morning');
    isAwake = true;
});

controller.hears(['sleep'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message, 'Night night');
    isAwake = false;
});

/**
 * Display Usage information
 */
function usage() {
    return "do <command> <arg1> <arg2> etc.. ";
};

function buildController(env) {
    var slackBotOptions = {
        debug: false
    };
    return Botkit.slackbot(slackBotOptions);
}