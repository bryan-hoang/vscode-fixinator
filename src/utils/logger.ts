import * as util from 'node:util';
import * as vscode from 'vscode';

class Logger {
    loggerName: string;
    outputChannel: vscode.LogOutputChannel;

    /**
     * Whether the extension is running in a CI environment.
     */
    private readonly isCI = process.env.CI === "true";

    /**
     * Logs messages to the console if the extension is running in a CI environment.
     */
    private logForCI(...messages: unknown[]): void {
        if (this.isCI) {
            console.log(...messages);
        }
    }

    constructor(loggerName: string, outputChannel: vscode.LogOutputChannel = vscode.window.createOutputChannel("Fixinator", { log: true })) {
        this.loggerName = loggerName;
        this.outputChannel = outputChannel;
    }

    trace(...messages: unknown[]) {
        const title = `${this.loggerName} [TRACE]:`;
        this.logForCI(title, ...messages);
        this.outputChannel.trace(util.format(title, ...messages));
    }

    debug(...messages: unknown[]): void {
        const title = `${this.loggerName} [DEBUG]:`;
        this.logForCI(title, ...messages);
        this.outputChannel.debug(util.format(title, ...messages));
    }

    info(...messages: unknown[]) {
        const title = `${this.loggerName} [INFO]:`;
        this.logForCI(title, ...messages);
        this.outputChannel.info(util.format(title, ...messages));
    }

    warn(...messages: unknown[]) {
        const title = `${this.loggerName} [WARN]:`;
        this.logForCI(title, ...messages);
        this.outputChannel.warn(util.format(title, ...messages));
    }

    error(...messages: unknown[]) {
        const title = `${this.loggerName} [ERROR]:`;
        this.logForCI(title, ...messages);
        this.outputChannel.error(util.format(title, ...messages));
    }
}

export default Logger;
