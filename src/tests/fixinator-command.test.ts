
import { add, FixinatorCommand } from '../utils/FixinatorCommand';

// Write  atest to run the command
test('FixinatorCommand results() should return the results', async () => {
    const fixinatorCommand = new FixinatorCommand();
    const results = fixinatorCommand.results;
    expect(results).toContain('categories');


});
