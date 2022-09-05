import { existsSync, readdirSync, statSync } from 'fs';
import { dirname, join, posix, relative, sep } from 'path';
import CompileError from '../error/CompileError';

function recursiveFindRelative(
    dirname: string,
    name: string,
    exts: string[],
    excludes: string[]
): string {
    for (const ext of exts) {
        const filename = join(dirname, name + ext);
        if (existsSync(filename)) {
            return filename;
        }
    }
    const relatives = readdirSync(dirname);
    for (const side of relatives) {
        if (excludes.includes(side)) {
            continue;
        }
        const relative = join(dirname, side);
        const stat = statSync(relative);
        if (stat.isDirectory()) {
            const result = recursiveFindRelative(relative, name, exts, excludes);
            if (result) {
                return result;
            }
        }
    }
    return '';
}

export default function extractRelatives(opts: {
    file: string;
    dependencies: string[];
    exts: string[];
    excludes: string[];
}): [string, string][] {
    const { file, dependencies, exts, excludes } = opts;
    const result: [string, string][] = [];
    const currentDir = dirname(file);
    for (const dep of dependencies) {
        const depResult = recursiveFindRelative(currentDir, dep, exts, excludes);
        if (!depResult) {
            CompileError.unresolvedDependency(dep, file);
        }
        const path = relative(currentDir, depResult);
        const upath = './' + path.split(sep).join(posix.sep);
        result.push([dep, upath]);
    }
    return result;
}
