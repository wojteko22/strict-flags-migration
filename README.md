Scripts to help [migrate project to use strict flags based on the solution from VS Code](https://github.com/Microsoft/vscode/issues/60565)

## Usage

```bash
$ npm install
```

Adjust `targetTsconfig` of target repo in `src/config.js`. Scripts imply that `targetTsconfig` is in `src` directory 
of target repo.

Make sure that typescript version is aligned with typescript version in target repository.

Eligible files are files that don't import any other files than files which are already in `targetTsconfig`.

**index.js**

Prints eligible files.

Fixing some of printed files will be sufficient to add this file to `targetTsconfig`. It won't require fixing any other
files as this file won't import any file which isn't already strictly checked.

Results are printed with a number representing files which depend on given file. Fixing the file with the biggest
number of dependent files will make the biggest difference (will reduce the biggest number of import dependencies on 
file with errors).

```bash
$ node index.js /path/to/target/repo
```

**autoAdd.js**

Tries to automatically add any eligible file to the `targetTsconfig`. This iteratively compiles `targetTsconfig` with 
just that file added. If there are no errors, it is added to `targetTsconfig`.

```bash
$ node autoAdd.js /path/to/target/repo
```
