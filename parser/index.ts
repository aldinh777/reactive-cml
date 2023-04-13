import { parseCML } from '@aldinh777/cml-parser';
import { ImportFormat, Preprocessor } from '../common/types';
import extractImports from './extractImports';
import extractParams from './extractParams';
import extractRelatives from './extractRelatives';
import domPreprocessor from '../dom/preprocess';

type ImportType = 'import' | 'require';

export interface RCMLParserOptions {
    mode?: ImportType;
    trimCML?: boolean;
    autoImports?: ImportFormat[];
    relativeImports?: {
        filename: string;
        extensions?: string[];
        excludes?: string[];
        includes?: string[];
        forceJSExtension?: boolean;
    };
    cmlPreprocessors: Preprocessor;
}

function dependify(dep: string | string[]): string {
    return typeof dep === 'string' ? dep : `{${dep.join(',')}}`;
}

function importify(dep: string | string[], from: string, mode: ImportType): string {
    const dependencies = dependify(dep);
    return mode === 'require'
        ? `const ${dependencies} = require('${from}')\n`
        : `import ${dependencies} from '${from}'\n`;
}

function stringifyImports(mode: ImportType, imports: ImportFormat[]): string {
    return imports.map(([from, imports]) => importify(imports, from, mode)).join('');
}

export function parseReactiveCML(source: string, options?: RCMLParserOptions): string {
    /** Options initialization */
    const mode = options?.mode || 'import';
    const trimCML = !(options?.trimCML === false);
    const autoImportsOpt = options?.autoImports || [];
    const relativeImports = options?.relativeImports;
    const cmlPreprocessor = options?.cmlPreprocessors || domPreprocessor();

    /** Spliting [imports, script, cml] respectively */
    const [importIndex, imports] = extractImports(source);
    let separatorIndex: number = source.length;
    const matchResult = source.match(/(div|span|component)(\s+.*=".*")*\s*</);
    if (matchResult) {
        const matchIndex = matchResult.index;
        if (typeof matchIndex === 'number') {
            separatorIndex = matchIndex;
        }
    }
    const [script, cml] = [
        source.substring(importIndex, separatorIndex),
        source.substring(separatorIndex)
    ];

    /** Preparing automatic imports & script imports */
    const autoImports: ImportFormat[] = [];
    const isUsed = (source: string, name: string) => source.match(RegExp(`\\b${name}\\b`));
    for (const [from, imports] of autoImportsOpt) {
        if (typeof imports === 'string') {
            if (isUsed(script, imports) || isUsed(cml, imports)) {
                autoImports.push([from, imports]);
            }
        } else {
            const usedDependencies: string[] = [];
            for (const dependency of imports) {
                if (isUsed(script, dependency) || isUsed(cml, dependency)) {
                    usedDependencies.push(dependency);
                }
            }
            if (usedDependencies.length > 0) {
                autoImports.push([from, usedDependencies]);
            }
        }
    }
    const addImport = (...item: ImportFormat[]): any => autoImports.push(...item);
    for (const [query, from] of imports) {
        addImport([from, query]);
    }

    /** Preprocessing CML Tree */
    const cmlTree = parseCML(cml, trimCML);
    const [dependencies, params] = extractParams(cmlTree, cmlPreprocessor.preprocessors || []);

    /** Recursively check related file to import */
    if (relativeImports) {
        const { filename, extensions, excludes, includes, forceJSExtension } = relativeImports;
        const currentImports: string[] = autoImports
            .map((imp) => imp[1])
            .filter((m) => typeof m === 'string') as string[];
        const componentDependencies = dependencies.filter(
            (dependency) => !cmlPreprocessor.relativeBlacklist?.includes(dependency)
        );
        const relativeDependencies = extractRelatives(filename, {
            dependencies: componentDependencies,
            exts: extensions || ['.rc', '.js'],
            excludes: excludes || [],
            includes: includes || [],
            existingImports: currentImports,
            forceJSExtension: forceJSExtension || false
        });
        addImport(...relativeDependencies);
    }

    /** Parsing CML */
    const outputScript = cmlPreprocessor.buildScript(cmlTree, [dependencies, params], addImport);
    const importScript = stringifyImports(mode, autoImports);
    const exportScript = '\n' + (mode === 'require' ? 'module.exports = ' : 'export default ');
    const resultScript = `async function(props={}, component={}, dispatch=()=>{}) {\n${script.trim()}\n${outputScript}\n}`;
    return importScript + exportScript + resultScript;
}
