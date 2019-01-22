require('dotenv').config()
var inquirer = require("inquirer");
const fs = require('fs');
const login = function() {
  inquirer.prompt([{
    type: "input",
    name: "username",
    message: "Welcome...\n\nEnter the name you want to be known as."
  }]).then(function(answers) {
    fs.appendFileSync(process.cwd() + '/.env', "\nUSERNAME=" + answers.username);
  })
}
if (!process.env.PRIVATE_KEY) {
  inquirer.prompt([{
    type: "input",
    name: "key",
    message: "Please Enter Private Key (It will be stored under .env file)"
  }]).then(function(answers) {
    fs.appendFileSync(process.cwd() + '/.env', "\nPRIVATE_KEY=" + answers.key);
  }).then(login)
} else {
  login()
}
