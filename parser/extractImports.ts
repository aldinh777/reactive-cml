export type ImportsResult = [query: string, from: string];

type ImportFlag = 'start' | 'from' | 'find';
type ModeFlag = 'none' | 'import' | 'require';

export default function extractImports(source: string): [number, ImportsResult[]] {
    let sourceImportEndIndex: number = 0;
    let importResults: ImportsResult[] = [];
    let importFlag: ImportFlag = 'start';
    let importMode: ModeFlag = 'none';
    let textComparator: string = '';
    let expectedImport: string = '';
    for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex++) {
        const currentCharacter = source[sourceIndex];
        if (importMode === 'import') {
            if (!currentCharacter.match(/\s/)) {
                textComparator += currentCharacter;
                continue;
            }
            if (!textComparator) {
                continue;
            }
            if (importFlag === 'start') {
                if (textComparator === 'from') {
                    importFlag = 'from';
                    continue;
                }
                expectedImport += textComparator;
            } else if (importFlag === 'from') {
                const matchedImport = textComparator.match(/(['"`])(.+)\1/);
                if (!matchedImport) {
                    return [sourceImportEndIndex, importResults];
                }
                importResults.push([expectedImport, matchedImport[2]]);
                importFlag = 'start';
                importMode = 'none';
                sourceImportEndIndex = sourceIndex;
                expectedImport = '';
                textComparator = '';
            }
            textComparator = '';
        } else if (importMode === 'require') {
            if (importFlag === 'start') {
                if (currentCharacter === '=') {
                    importFlag = 'find';
                    continue;
                }
                expectedImport += currentCharacter;
            } else if (importFlag === 'find') {
                if (currentCharacter.match(/\s/)) {
                    continue;
                }
                if (currentCharacter.match(/[A-Za-z]/)) {
                    textComparator += currentCharacter;
                } else if (textComparator === 'require') {
                    importFlag = 'from';
                    textComparator = currentCharacter;
                } else {
                    return [sourceImportEndIndex, importResults];
                }
            } else if (importFlag === 'from') {
                if (!currentCharacter.match(/[\n\r;]/)) {
                    textComparator += currentCharacter;
                    continue;
                }
                const matchedImport = textComparator.match(/\(\s*(['"])(.+)\1\s*\)/);
                if (!matchedImport) {
                    return [sourceImportEndIndex, importResults];
                }
                importResults.push([expectedImport, matchedImport[2]]);
                importFlag = 'start';
                importMode = 'none';
                sourceImportEndIndex = sourceIndex;
                expectedImport = '';
                textComparator = '';
            }
        } else {
            if (currentCharacter.match(/[\s;]/)) {
                if (!textComparator) {
                    continue;
                }
                if (textComparator === 'import') {
                    importMode = 'import';
                } else if (textComparator === 'const') {
                    importMode = 'require';
                } else {
                    return [sourceImportEndIndex, importResults];
                }
                textComparator = '';
            } else {
                textComparator += currentCharacter;
            }
        }
    }
    return [sourceImportEndIndex, importResults];
}
