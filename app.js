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
var Botkit = require('BotKit');

// acrobot functionality
var acronyms = require('./acronym-finder.js')();
acronyms.ensureAcronymsBuilt();

var isAwake = true;
var controller = buildController(process.env);

var bot = controller.spawn({
    token: process.env.slack_token
}).startRTM();

controller.hears(['cpu'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    var processDone = false;
    //bot.reply(message, "one");
    //bot.reply(message, "two");
    var output = '';
    var spawn = require("child_process").spawn, child;
    child = spawn("powershell.exe",["D:\\devPrivate\\autobot-config\\commands\\win\\cpu.ps1"]);
    child.stdout.on("data",function(data){
        output += data;
        //bot.reply(message, "a little:");
        bot.reply(message, "data:" + data);
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
    //bot.reply(message, output);
/*
    var _flagCheck = setInterval(function() {
        if (processDone) {
            clearInterval(_flagCheck);
            bot.replay('all done')
            //theCallback(); // the function to run once all flags are true
        }
    }, 100); // interval set at 100 milliseconds
*/
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