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
var _ = require('lodash');
const os = require('os');

var isAwake    = true;
var controller = buildController(process.env);

var bot = controller.spawn({
    token: process.env.slack_token
}).startRTM();

// @todo load from config
var validCommands = [
    { name: 'HelloBot', path: './Tasks/HelloBot'},
    { name: 'Playbook', path: './Tasks/ansible-playbook'},
    { name: 'cpu', path: 'D:\\devPrivate\\autobot-config\\commands\\win\\cpu.ps1', executable: 'powershell.exe'},
];

controller.hears(['help'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    var commandList = _.map(validCommands, 'name').join(os.EOL);
    bot.reply(message, 'Available commands:');
    bot.reply(message, commandList);
    
});

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

        if (InputValidator.isValidCommand(commands.command, validCommands)) {
            // @todo more validation
            // @todo try to split this up more
            bot.reply(message, 'Output: ' );

            var spawn = null;
            var child = null;
            var commandConfig = _.find(validCommands, { 'name': commands.command });
            var commandPath = commandConfig.path;

            if (commandConfig.executable) {
                spawn = require("child_process").spawn;

                commandPath = commandConfig.executable;
                commands.args.unshift(commandConfig.path);

            } else {
                spawn = require("child_process").execFile;
            }

            console.log(commands.command);
            console.log(commandPath);
            console.log(commands.args);

            //@todo make configurable
            child = spawn(commandPath, commands.args);

            child.stdout.on("data", function(data){
                var StringDecoder= require('string_decoder').StringDecoder;
                
                var decoder = new StringDecoder("utf-8");
                var output = decoder.write(data);
                //bot.reply(message, output); @todo not working for me
                var theData = String(data);
                bot.reply(message, theData);
                console.log("Data: " + output);
            });

            child.stderr.on("data",function(data){
                console.log("Errors: " + data);
            });

            child.on("close",function(){
                processDone = true;
                bot.reply(message, "Script finished");
                console.log("Script finished");
            });
            
            child.stdin.end(); //end input
        } else {
            var msg = 'Can not run :' + commands['command'] +" as it's not in the whitelist" 
            console.error(msg);
            bot.reply(message, "Sorry, this command is not in the whitelist");
            processDone = true;
        }
        // @todo remove any special chars from the command. 
        // @todo make sure command is present in _our_ path and executable

    } catch(e) {
        console.error(e);

        switch (e.name) {
            case 'MessageEmpty':
                bot.reply(message, "I'm sorry, you haven't told me what you want me to do");
                processDone = true;
            break;
            case 'ZeroArguments':                
                bot.reply(message, "I'm not sure what you want me to do: Try one of the following:");
                bot.reply(message, usage());
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