# Change Log

## [Unreleased]

### Added

- New `fixinator.configFile` setting for specifying the path to a
  `.fixinator.json` configuration file use when using CommandBox for scans
- New `fixinator.customBoxArgs` setting for specifying additional command line
  arguments to pass to the CommandBox (`box`) binary when using it for scans
- `.fixinator.json` files are now registered with a JSON schema that gives the
  JSON LSP server information about the top-level properties of the file

### Changed

- If `fixinator.configFile` is specified and `fixinator.useCommandbox` is
  `false`, then the HTTPS scan now uses the contents of the configured
  `.fixinator.json` file as the configuration to put in the payload of the
  request

## 2024-06-11
- Cleaning up the output so we dont focus on the output window
- Added a scan all files function

## Initial Release
- Added a function to scan a file against a fixinator server
- Added the api key to scan against api.fixinator.app
