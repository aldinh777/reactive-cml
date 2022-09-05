import { parseCML } from '@aldinh777/cml-parser';
import { processRC } from '..';
import extractImports from './extractImports';
import extractParams from './extractParams';

type ImportType = 'import' | 'require';

interface RCMLParserOptions {
    mode?: ImportType;
    trimCML?: boolean;
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

    const autoDependencies: [string, string[]][] = [];
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
    const baseDependencies = dependencies.filter((dep) => controlComp.has(dep));

    let outreturn = '';
    if (fullparams.length > 0) {
        autoDependencies.push(["'@aldinh777/reactive-cml/dom'", ['intoDom']]);
        outreturn = `return intoDom(${rcJson}, {${fullparams.join()}}, _children)`;
    } else if (rcResult.length > 0) {
        autoDependencies.push(["'@aldinh777/reactive-cml/dom/dom-util'", ['simpleDom']]);
        outreturn = `return simpleDom(${rcJson})`;
    } else {
        outreturn = '';
    }

    let importScript = '';
    if (options.mode === 'import') {
        importScript =
            autoDependencies.map(([from, imports]) => importify(imports, from, 'import')).join('') +
            baseDependencies
                .map((dep) => importify(dep, `'${baseCompPath}/${dep}'`, 'import'))
                .join('') +
            `${imports.map(([q, f]) => importify(q, f, 'import')).join('')}\n` +
            `export default `;
    } else {
        importScript =
            autoDependencies
                .map(([from, imports]) => importify(imports, from, 'require'))
                .join('') +
            baseDependencies
                .map((dep) => importify(dep, `'${baseCompPath}/${dep}'`, 'require'))
                .join('') +
            `${imports.map(([q, f]) => importify(q, f, 'require')).join('')}\n` +
            `module.exports = `;
    }
    const resultScript = `function(props={}, _children, dispatch=()=>{}) {\n${script.trim()}\n${outreturn}\n}`;
    return importScript + resultScript;
}
