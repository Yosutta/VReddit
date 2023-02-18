import fs from "fs";
import chalk from "chalk";

function logStatementToConsole(type, fileName, err) {
  const localeDate = new Date().toLocaleDateString();
  const localeTime = new Date().toLocaleTimeString();
  const location = `${chalk.blueBright(fileName.toUpperCase())}`;
  const timeAndLocation = `[${localeTime} - ${localeDate}:${location}]`;
  const errName = `${err.name}:`;

  let statement;

  switch (type) {
    case "error":
      statement = `${chalk.black.bgWhiteBright(timeAndLocation)} ${chalk.redBright(errName)} ${chalk.red(err.message)}`;
      break;
    case "warn":
      statement = `${chalk.black.bgWhiteBright(timeAndLocation)} ${chalk.yellowBright(errName)} ${chalk.yellow(
        err.message
      )}`;
      break;
    case "info":
      statement = `${chalk.black.bgWhiteBright(timeAndLocation)} ${chalk.cyanBright(errName)} ${chalk.cyan(
        err.message
      )}`;
      break;
  }

  return statement;
}

function stackLoggingToFile(type, err) {
  const localeDate = new Date().toLocaleDateString();
  const localeTime = new Date().toLocaleTimeString();

  const loggingPromise = new Promise((resolve) => {
    let loggingStatement = `[${localeTime}; ${localeDate}; ${err}\n`;
    switch (type) {
      case "error":
        loggingStatement = `[${localeTime}; ${localeDate}; ${err}\n`;
        break;
      case "warn":
        loggingStatement = `[${localeTime}; ${localeDate}; ${err}\n`;
        break;
      case "info":
        loggingStatement = `[${localeTime}; ${localeDate}; ${err}\n`;
        break;
    }
    resolve(loggingStatement);
  });
  loggingPromise.then((log) => {
    fs.writeFileSync(`./logs/${type}_log.txt`, log, { flag: "a" });
  });
}

export default {
  debug: (fileName, err) => {},
  error: (fileName, err) => {
    console.log(logStatementToConsole("error", fileName, err));
    stackLoggingToFile("error", err);
  },

  warn: (fileName, err) => {
    console.log(logStatementToConsole("warn", fileName, err));
    stackLoggingToFile("warn", err);
  },

  info: (fileName, err) => {
    console.log(logStatementToConsole("info", fileName, err));
    stackLoggingToFile("info", err);
  },
};
