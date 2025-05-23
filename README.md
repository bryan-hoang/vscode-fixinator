# Fixinator Extension for VSCode

<!-- 
```
______ _______   _______ _   _   ___ _____ ___________ 
|  ___|_   _\ \ / /_   _| \ | | / _ \_   _|  _  | ___ \
| |_    | |  \ V /  | | |  \| |/ /_\ \| | | | | | |_/ /
|  _|   | |  /   \  | | | . ` ||  _  || | | | | |    / 
| |    _| |_/ /^\ \_| |_| |\  || | | || | \ \_/ / |\ \ 
\_|    \___/\/   \/\___/\_| \_/\_| |_/\_/  \___/\_| \_| 
```
-->
<img src="https://raw.githubusercontent.com/cybersonic/vscode-fixinator/refs/heads/main/assets/icon.png" alt="Fixinator"/>

[Fixinator](https://fixinator.app/) makes it easy to find and fix security vulnerabilities in your CFML / ColdFusion source code.
---
## Description
The VScode-Fixinator allows you to scan and fix your cfml code directly. 

The extension runs with either the [Commandbox Fixinator CLI](https://forgebox.io/view/fixinator) (`box fixinator`) package or using the Fixinator API directly to scan your CFML code.  If you are a subscriber to Fixinator you can add your API key to the settings to use the API directly.  If you are not a subscriber you can still use the extension to run the Fixinator CLI but are limited in the number of scans you can run.


## Features
- VSCode Fixinator can scan your code via the command palette
- VSCode Fixinator can scan your code on save
- You can now scan all files in your workspace
- Problems are displayed in editor as well as in the problems tab
- If there are fix suggestions you can apply them directly from the editor
- If you are a subscriber to Fixinator you can add your API key to the settings to use the API directly


## Requirements
- Commandbox (https://www.ortussolutions.com/products/commandbox) (optional)
- Fixinator API Key (optional)
