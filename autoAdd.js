
// @ts-check
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const config = require('./src/config');
const { forStrictNullCheckEligibleFiles } = require('./src/getStrictNullCheckEligibleFiles');

const vscodeRoot = path.join(process.cwd(), process.argv[2]);
const srcRoot = path.join(vscodeRoot, 'src');

const buildCompletePattern = /Found (\d+) errors?\. Watching for file changes\./gi;

forStrictNullCheckEligibleFiles(vscodeRoot, () => { }).then(async (files) => {
    const tsconfigPath = path.join(srcRoot, config.targetTsconfig);

    const child = child_process.spawn('tsc', ['-p', tsconfigPath, '--watch']);
    for (const file of files) {
        await tryAutoAddStrictNulls(child, tsconfigPath, file);
    }
    child.kill();
});

function tryAutoAddStrictNulls(child, tsconfigPath, file) {
    return new Promise(resolve => {
        const relativeFilePath = path.relative(srcRoot, file);
        console.log(`Trying to auto add '${relativeFilePath}'`);

        const originalConifg = JSON.parse(fs.readFileSync(tsconfigPath).toString());
        originalConifg.files = Array.from(new Set(originalConifg.files.sort()));

        // Config on accept
        const newConfig = Object.assign({}, originalConifg);
        newConfig.files = Array.from(new Set(originalConifg.files.concat('./' + relativeFilePath).sort()));
        writeFile(tsconfigPath, newConfig);

        const listener = (data) => {
            const textOut = data.toString();
            const match = buildCompletePattern.exec(textOut);
            if (match) {
                const errorCount = +match[1];
                if (errorCount === 0) {
                    console.log(`👍`);
                    writeFile(tsconfigPath, newConfig);
                }
                else {
                    console.log(`💥 - ${errorCount}`);
                    writeFile(tsconfigPath, originalConifg);
                }
                resolve();
                child.stdout.removeListener('data', listener);
            }
        };
        child.stdout.on('data', listener);
    });
}

function writeFile(tsconfigPath, config) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + '\n');
}
