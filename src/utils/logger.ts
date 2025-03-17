import * as vscode from 'vscode';

class Logger {
    loggerName: string;
    outputChannel: vscode.OutputChannel | undefined;

    constructor(loggerName: string, outputChannel?: vscode.OutputChannel) {
        this.loggerName = loggerName;
        this.outputChannel = outputChannel;
    }

    log(message: string | any | any[]) {
        // shortcut
        this.info(message);
    }

    info(message: string | any | any[]) {

        const title = `${this.loggerName} [INFO]:`;
        console.info(title, message);
        this.channelAppend(title, message);
    }

    warn(message: string | any | any[]) {
        const title = `${this.loggerName} [WARN]:`;
        console.warn(this.loggerName, message);
        this.channelAppend(title, message);
    }

    error(message: string | any | any[]) {
        const title = `${this.loggerName} [ERROR]:`;
        console.error(this.loggerName, message);
        this.channelAppend(title, message);
    }

    private channelAppend(title: string, message: any) {
        if (!this.outputChannel) {
            return;
        }
        this.outputChannel.appendLine(`${title} ${JSON.stringify(message, null, 2)}`);
        this.outputChannel.show();
    }
}

export default Logger;