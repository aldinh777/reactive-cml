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
        if (excludes.indexOf(side) !== -1) {
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

export default function extractRelatives(
    filename: string,
    opts: {
        dependencies: string[];
        exts: string[];
        excludes: string[];
        includes: string[];
        existingImports: string[];
        forceJSExtension: boolean;
    }
): [string, string][] {
    const { dependencies, exts, excludes, includes, existingImports, forceJSExtension } = opts;
    const result: [string, string][] = [];
    const currentDir = dirname(filename);
    includes.unshift(currentDir);
    for (const dep of dependencies) {
        if (existingImports.includes(dep)) {
            continue;
        }
        let depResult: string;
        for (const dir of includes) {
            depResult = recursiveFindRelative(dir, dep, exts, excludes);
            if (depResult) {
                break;
            }
        }
        if (depResult) {
            const path = relative(currentDir, depResult);
            const from = posixifyPath(path);
            result.push([forceJSExtension ? from.replace(/\.\w+$/, '.js') : from, dep]);
            continue;
        }
        throw CompileError.unresolvedDependency(dep, filename);
    }
    return result;
}

function posixifyPath(path: string) {
    return (path[0] === '.' ? path : './' + path).split(sep).join(posix.sep);
}
