import { parseCML } from '@aldinh777/cml-parser';
import { processRC } from '..';
import extractImports from './extractImports';
import extractParams from './extractParams';
import extractRelatives from './extractRelatives';

type ImportType = 'import' | 'require';

interface RCMLParserOptions {
    mode?: ImportType;
    trimCML?: boolean;
    autoImport?: [string, string | string[]][];
    relativeImport?: {
        filename: string;
        extensions?: string[];
        excludes?: string[];
    };
}

function dependify(dep: string | string[]): string {
    if (typeof dep === 'string') {
        return dep;
    } else {
        return `{ ${dep.join(',')} }`;
    }
}

function importify(dep: string | string[], from: string, mode: ImportType): string {
    const dependencies = dependify(dep);
    if (mode === 'import') {
        return `import ${dependencies} from ${from}\n`;
    } else {
        return `const ${dependencies} = require(${from})\n`;
    }
}

export function parseReactiveCML(
    source: string,
    options: RCMLParserOptions = {
        mode: 'import',
        trimCML: true
    }
): string {
    const [importIndex, imports] = extractImports(source);
    let separatorIndex: number = source.length;
    const matchResult = source.match(/(div|span)(\s+.*=".*")*\s*</);
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
    const cmlTree = parseCML(cml, options.trimCML);
    const { dependencies, params } = extractParams(cmlTree);
    const fullparams = params.concat(dependencies);
    const rcResult = processRC(cmlTree);
    const rcJson = JSON.stringify(rcResult, null, 2);
    const controlComp = new Set([
        'Children',
        'ControlBasic',
        'ControlState',
        'DestructBasic',
        'DestructCollect',
        'DestructState',
        'LoopBasic',
        'LoopCollect',
        'LoopState'
    ]);
    const baseCompPath = '@aldinh777/reactive-cml/dom/components';
    const autoImports: [string, string | string[]][] = [];
    const componentImports: [string, string][] = dependencies
        .filter((dep) => controlComp.has(dep))
        .map((dep) => [`'${baseCompPath}/${dep}'`, dep]);
    let outreturn: string;
    if (fullparams.length > 0) {
        autoImports.push(["'@aldinh777/reactive-cml/dom'", ['intoDom']]);
        outreturn = `return intoDom(${rcJson}, {${fullparams.join()}}, _children)`;
    } else if (rcResult.length > 0) {
        autoImports.push(["'@aldinh777/reactive-cml/dom/dom-util'", ['simpleDom']]);
        outreturn = `return simpleDom(${rcJson})`;
    } else {
        outreturn = '';
    }
    const { autoImport, relativeImport } = options;
    if (autoImport) {
        autoImports.push(...autoImport);
    }
    if (relativeImport) {
        const { filename, extensions, excludes } = relativeImport;
        const deps = dependencies.filter((dep) => !controlComp.has(dep));
        const relativeDependencies = extractRelatives(filename, {
            dependencies: deps,
            exts: extensions || ['.rc', '.js'],
            excludes: excludes || []
        });
        componentImports.push(...relativeDependencies);
    }
    const importMode = options.mode === 'require' ? 'require' : 'import';
    const importScript = joinDependencies(importMode, autoImports, componentImports, imports);
    const resultScript = `function(props={}, _children, dispatch=()=>{}) {\n${script.trim()}\n${outreturn}\n}`;
    return importScript + resultScript;
}

function joinDependencies(mode: ImportType, ...dependencieses: [string, string | string[]][][]) {
    dependencieses
        .map(
            (deps) => deps.map(([from, imports]) => importify(imports, from, mode)).join('') + '\n'
        )
        .join('') + (mode === 'require' ? '\nmodule.exports = ' : '\nexport default ');
}
