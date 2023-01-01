import { parseCML } from '@aldinh777/cml-parser';
import { join, relative, dirname } from 'path';
import { DEFAULT_COMPONENT_SET } from '../constants';
import { DEFAULT_PREPROCESSOR } from '../preprocess';
import { processRC } from '../src';
import extractImports from './extractImports';
import extractParams, { Preprocessor } from './extractParams';
import extractRelatives from './extractRelatives';

type ImportType = 'import' | 'require';

export interface RCMLParserOptions {
    mode?: ImportType;
    trimCML?: boolean;
    autoImports?: [from: string, imports: string | string[]][];
    relativeImports?: {
        filename: string;
        extensions?: string[];
        excludes?: string[];
        includes?: string[];
    };
    cmlPreprocessors?: {
        customPreprocessor?: Preprocessor[];
        disableDefault?: boolean;
    };
    _localDebug?: boolean;
}

const DEFAULT_COMPONENT_PATH = '@aldinh777/reactive-cml/components';
const DEFAULT_INTODOM_PATH = '@aldinh777/reactive-cml/dom';
const DEFAULT_SIMPLEDON_PATH = '@aldinh777/reactive-cml/dom/dom-util';
const LOCAL_COMPONENT_PATH = join(__dirname, '../components');
const LOCAL_INTODOM_PATH = join(__dirname, '../dom');
const LOCAL_SIMPLEDOM_PATH = join(__dirname, '../dom/dom-util');

function pathify(target: string | void, source: string): string {
    return './' + (target ? relative(dirname(target), source) : source).replace(/\\/g, '/');
}

function dependify(dep: string | string[]): string {
    if (typeof dep === 'string') {
        return dep;
    } else {
        return `{${dep.join(',')}}`;
    }
}

function importify(dep: string | string[], from: string, mode: ImportType): string {
    const dependencies = dependify(dep);
    if (mode === 'require') {
        return `const ${dependencies} = require('${from}')\n`;
    } else {
        return `import ${dependencies} from '${from}'\n`;
    }
}

function joinDependencies(mode: ImportType, dependencies: [string, string | string[]][]): string {
    return dependencies.map(([from, imports]) => importify(imports, from, mode)).join('');
}

export function parseReactiveCML(
    source: string,
    options: RCMLParserOptions = {},
    filepath?: string
): string {
    const mode = options.mode || 'import';
    const trimCML = !(options.trimCML === false);
    const autoImportsOpt = options.autoImports || [];
    const relativeImports = options.relativeImports;
    const cmlPreprocessors = options.cmlPreprocessors;

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
    const cmlTree = parseCML(cml, trimCML);
    const autoImports: [from: string, imports: string | string[]][] = [...autoImportsOpt];
    const preprocessors: Preprocessor[] = [];
    if (!cmlPreprocessors || !cmlPreprocessors.disableDefault) {
        preprocessors.push(...DEFAULT_PREPROCESSOR);
    }
    if (cmlPreprocessors && cmlPreprocessors.customPreprocessor) {
        preprocessors.push(...cmlPreprocessors.customPreprocessor);
    }
    const [dependencies, params] = extractParams(cmlTree, preprocessors);
    const fullparams = params.concat(dependencies);
    const rcResult = processRC(cmlTree);
    const rcJson = JSON.stringify(rcResult, null, 2);
    for (const [query, from] of imports) {
        autoImports.push([from, query]);
    }
    for (const dep of dependencies.filter((dep) => DEFAULT_COMPONENT_SET.has(dep))) {
        const componentPath = options._localDebug
            ? pathify(filepath, LOCAL_COMPONENT_PATH)
            : DEFAULT_COMPONENT_PATH;
        autoImports.push([`${componentPath}/${dep}`, dep]);
    }
    let outreturn: string;
    if (fullparams.length > 0) {
        const domifiedPath = options._localDebug
            ? pathify(filepath, LOCAL_INTODOM_PATH)
            : DEFAULT_INTODOM_PATH;
        autoImports.push([domifiedPath, ['intoDom']]);
        outreturn = `return intoDom(${rcJson}, {${fullparams.join()}}, component, true)`;
    } else {
        const domifiedPath = options._localDebug
            ? pathify(filepath, LOCAL_SIMPLEDOM_PATH)
            : DEFAULT_SIMPLEDON_PATH;
        autoImports.push([domifiedPath, ['simpleDom']]);
        outreturn = `return simpleDom(${rcJson}, component)`;
    }
    if (relativeImports) {
        const { filename, extensions, excludes, includes } = relativeImports;
        const currentImports: string[] = autoImports
            .map((imp) => imp[1])
            .filter((m) => typeof m === 'string') as string[];
        const deps = dependencies.filter((dep) => !DEFAULT_COMPONENT_SET.has(dep));
        const relativeDependencies = extractRelatives(filename, {
            dependencies: deps,
            exts: extensions || ['.rc', '.js'],
            excludes: excludes || [],
            includes: includes || [],
            existingImports: currentImports
        });
        autoImports.push(...relativeDependencies);
    }
    const importScript = joinDependencies(mode, autoImports);
    const exportScript = '\n' + (mode === 'require' ? 'module.exports = ' : 'export default ');
    const resultScript = `function(props={}, component={}, dispatch=()=>{}) {\n${script.trim()}\n${outreturn}\n}`;
    return importScript + exportScript + resultScript;
}
