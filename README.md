# Autobot 

## A Slack Bot that rocks

Autobot does blah

---

## Installation

Grab this repository

```bash
git clone git@github.com:zdam/autobot.git
```

Install node dependencies

```bash
npm install
```
---

## Getting started 

After you've installed Autobot, the first thing you'll need to do is register your bot with Slack, and get a few configuration options set. This will allow your bot to connect, send and receive messages.

* Log into Slack, go to this url: https://MY-COMPANY-HERE.slack.com/apps/build/custom-integration
* Choose Bots
* Choose a Username for your bot (e.g. acrobot) then click Add bot Integration
* Take a copy of the API Token
* Click Save Integration

The API Token needs to be passed to node as the environment variable: slack_token

---

## Simple debugging Setup

VSCode is a free cross-platform editor that has excellent NodeJS debugging in just a couple of clicks.

This repository has a .vscode folder with an example-launch.json file ready to go.

* Rename example-launch.json to launch.json
* Fill out the SLACK_TOKEN environment variable and save launch.json
* Click the Debug Icon in VSCode and then press F5 to begin debugging your bot.

---

 