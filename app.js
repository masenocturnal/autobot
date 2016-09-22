/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A Slack Bot using Botkit

Acrobot listens for any acronyms that it knows about and provides
a link to wikipedia for the said acronym. 

You can also ask acrobot to ignore an acronym using the ignore command.
e.g. @acrobot ignore xmpp

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

if (!process.env.slack_token ) {
    console.log('Error: Specify slack_token in environment');
    process.exit(1);
}

// 3rd party libs
var Botkit = require('botkit');
var unorm  = require('unorm');

// acrobot functionality
var acronyms = require('./acronym-finder.js')();
acronyms.ensureAcronymsBuilt();

var isAwake = true;
var controller = buildController(process.env);

var bot = controller.spawn({
    token: process.env.slack_token
}).startRTM();

controller.hears(['do'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    var processDone = false;
    //bot.reply(message, "one");
    //bot.reply(message, "two");
    var output = '';

    message = validateInput(message);
    if (!message.text) {

        bot.reply("Sorry, I don't understand that");
        processDone = true;
    }

    var args = message.text.split(' ');
    args.shift();

    if (args.length < 0) {
        bot.reply("I'm not sure what you want me to do: Try one of the following:");
        // usage();
        processDone = true;
    }
    bot.reply(message, "Ok, I'll go fetch the punch cards");

    var command = './'+ (args.shift());

    // @todo remove any special chars from the command. 
    // @todo make sure command is present in _our_ path and executable
    var params  = args;

    // @todo respond with an ack straight away

    var spawn = require("child_process").spawn, child;
    child = spawn(command, params );
    child.stdout.on("data", function(data){
        output += data;
        bot.reply(message, "Output: \n" + data);
        console.log("Powershell Data: " + data);
    });
    child.stderr.on("data",function(data){
        console.log("Powershell Errors: " + data);
    });
    child.on("exit",function(){
        prcessDone = true;
        //bot.reply(message, output);
        //bot.reply(message, "end");
        console.log("Powershell Script finished");
    });
    child.stdin.end(); //end input 
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

/*
controller.hears(['ignore (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    if (isAwake) {
        var acronymToIgnore = message.match[1].toLowerCase();
        acronyms.addToBlacklist(acronymToIgnore, bot, message, controller);        
    }        
});

controller.hears(['(.*)'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    if (isAwake) {
        acronyms.findAcronyms(bot, message, controller);
    }
});
*/

function validateInput(message) {
    
    // normalize so we are comparing apples to apples
    // assumes utf8 or ascii shell
    // @todo check
    var text = unorm.nfc(message.text);

    console.log('received the following from the remote' + text);

    message.text = text;
    return message;
}

function buildController(env) {
    var slackBotOptions = {
        debug: false
    };
    
    // Hook up Firebase storage if it has been configured
    if (env.firebase_url && env.firebase_url.length > 0) {
        var firebaseConfig = {
            firebase_uri: process.env.firebase_url, 
            firebase_secretToken: process.env.firebase_token
        }
        
        var firebaseStorageProvider = require('./firebase-storage.js')(firebaseConfig);
        slackBotOptions.storage = firebaseStorageProvider;
    }
    
    return Botkit.slackbot(slackBotOptions);    
}