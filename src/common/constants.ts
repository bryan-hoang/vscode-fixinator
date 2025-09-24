import * as path from 'path';

const folderName = path.basename(__dirname);

/**
 * Path to the root directory of this extension.
 */
export const EXTENSION_ROOT_DIR =
  folderName === 'common'
    ? path.dirname(path.dirname(__dirname))
    : path.dirname(__dirname);
