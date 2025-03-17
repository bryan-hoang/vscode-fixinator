// Runs the commands for fixinator. 
const path = require('path');
import Logger from './logger';
import { readFileSync } from 'fs';
import * as vscode from 'vscode';

export class FixinatorCommand {
    private logger: Logger;



    // string path = "." (A file or directory to scan)
    // string resultFile (A file path to write the results to - see resultFormat)
    // string resultFormat = "" (The format to write the results in [json,html,pdf,junit,findbugs,sast,csv,sarif])
    // boolean verbose = "true" (When false limits the output)
    // string listBy = "type" (Show results by type or file)
    // string severity = "default" (The minimum severity warn, low, medium or high)
    // string confidence = "default" (The minimum confidence level none, low, medium or high)
    // string ignoreScanners = "" (A comma separated list of scanner ids to ignore)
    // autofix = "off" (Use either off, prompt or automatic)
    // boolean failOnIssues = "true" (Determines if an exit code is set to 1 when issues are found.)
    // boolean debug = "false" (Enable debug mode)
    // boolean listScanners = "false" (List the types of scanners that are enabled, enabled automatically when verbose=true)
    // string ignorePaths = "" (A globber paths pattern to exclude)
    // string ignoreExtensions = "" (A list of extensions to exclude)
    // boolean gitLastCommit = "false" (Scan only files changed in the last git commit)
    // boolean gitChanged = "false" (Scan only files changed since the last commit in the working copy)
    // string engines = "" (A list of engines your code runs on, eg: lucee@5,adobe@2023 default any)
    // string includeScanners = "" (A comma separated list of scanner ids to scan, all others ignored)
    // string configFile = "" (A path to a .fixinator.json file to use)
    // string goals = "security" (A list of goals for scanning [compatibility,security], default: security)
    // path: string = ".";  //(A file or directory to scan)
    // resultFile: string;  //(A file path to write the results to - see resultFormat)
    // resultFormat: string = "";  //(The format to write the results in [json,html,pdf,junit,findbugs,sast,csv,sarif])
    // verbose: boolean = true;  //(When false limits the output)
    // listBy: string = "type";  //(Show results by type or file)
    // severity: string = "default";  //(The minimum severity warn, low, medium or high)
    // confidence: string = "default";  //(The minimum confidence level none, low, medium or high)
    // ignoreScanners: string = "";  //(A comma separated list of scanner ids to ignore)
    // failOnIssues: boolean = true;  //(Determines if an exit code is set to 1 when issues are found.)
    // debug: boolean = false;  //(Enable debug mode)
    // listScanners: boolean = false;  //(List the types of scanners that are enabled, enabled automatically when verbose=true)
    // ignorePaths: string = "";  //(A globber paths pattern to exclude)
    // ignoreExtensions: string = "";  //(A list of extensions to exclude)
    // gitLastCommit: boolean = false;  //(Scan only files changed in the last git commit)
    // gitChanged: boolean = false;  //(Scan only files changed since the last commit in the working copy)
    // engines: string = "";  //(A list of engines your code runs on, eg: lucee@5,adobe@2023 default any)
    // includeScanners: string = "";  //(A comma separated list of scanner ids to scan, all others ignored)
    // configFile: string = "";  //(A path to a .fixinator.json file to use)
    // goals: string = "security";  //(A list of goals for scanning [compatibility,security], default: security)
    // 

    constructor() {
        this.logger = new Logger('[Fixinator]');
    }
    async run() {

        // create a unique identifier for the command
        const commandId = 'vscode-fixinator.scan' + Math.random().toString(36).substring(7);

        this.logger.info(`Running the command: ${commandId}`);


    }

    get binary() {
        if (vscode.workspace.getConfiguration("fixinator").get("boxBinary")) {
            return vscode.workspace.getConfiguration("fixinator").get("boxBinary");
        }
        return 'box';
    }

    get results() {
        // Read the file so we can do the parsing and then we can do whatever
        const jsonString = readFileSync("/Users/markdrew/Code/DistroKid/VSCode/vscode-fixinator/extension_workspace/fixinator.json").toString();
        return JSON.parse(jsonString);
        return {};
    }
}

export function add(a: number, b: number): number {
    return a + b;
}