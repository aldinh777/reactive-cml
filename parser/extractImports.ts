export type ImportsResult = [query: string, from: string];

enum ImportFlag {
    start,
    from,
    find
}
enum ModeFlag {
    none,
    import,
    require
}

export default function extractImports(source: string): [number, ImportsResult[]] {
    let endIndex: number = 0;
    let imports: ImportsResult[] = [];
    let flag: ImportFlag = ImportFlag.start;
    let mode: ModeFlag = ModeFlag.none;
    let imp: string = '';
    let impos: string = '';
    for (let i = 0; i < source.length; i++) {
        const chr = source[i];
        if (mode === ModeFlag.import) {
            if (chr.match(/\s/)) {
                if (!imp) {
                    continue;
                }
                if (flag === ImportFlag.start) {
                    if (imp === 'from') {
                        flag = ImportFlag.from;
                    } else {
                        impos += imp;
                    }
                } else if (flag === ImportFlag.from) {
                    const from = imp.match(/((['"`])(.+)\2)/);
                    if (from) {
                        imports.push([impos, from[1]]);
                        flag = ImportFlag.start;
                        mode = ModeFlag.none;
                        endIndex = i;
                        impos = '';
                        imp = '';
                    } else {
                        return [endIndex, imports];
                    }
                }
                imp = '';
            } else {
                imp += chr;
            }
        } else if (mode === ModeFlag.require) {
            if (flag === ImportFlag.start) {
                if (chr === '=') {
                    flag = ImportFlag.find;
                } else {
                    impos += chr;
                }
            } else if (flag === ImportFlag.find) {
                if (chr.match(/\s/)) {
                    continue;
                } else if (chr.match(/[A-Za-z]/)) {
                    imp += chr;
                } else if (imp === 'require') {
                    flag = ImportFlag.from;
                    imp = chr;
                } else {
                    return [endIndex, imports];
                }
            } else if (flag === ImportFlag.from) {
                if (chr.match(/[\n\r;]/)) {
                    const from = imp.match(/\(\s*((['"])(.+)\2)\s*\)/);
                    if (from) {
                        imports.push([impos, from[1]]);
                        flag = ImportFlag.start;
                        mode = ModeFlag.none;
                        endIndex = i;
                        impos = '';
                        imp = '';
                    } else {
                        return [endIndex, imports];
                    }
                } else {
                    imp += chr;
                }
            }
        } else {
            if (chr.match(/[\s;]/)) {
                if (!imp) {
                    continue;
                }
                if (imp === 'import') {
                    mode = ModeFlag.import;
                } else if (imp === 'const') {
                    mode = ModeFlag.require;
                } else {
                    return [endIndex, imports];
                }
                imp = '';
            } else {
                imp += chr;
            }
        }
    }
    return [endIndex, imports];
}
