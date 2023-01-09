import { join, relative, dirname } from 'path';
import { processRC } from '../src';
import { Preprocessor } from '../util-type';
import { DEFAULT_COMPONENT_SET } from './constants';

import preprocessExtract from '../common/preprocessor/extract';
import preprocessBinding from '../common/preprocessor/binding';
import preprocessChildren from './preprocessor/children';
import preprocessSlot from './preprocessor/slot';
import preprocessComponent from './preprocessor/component';
import preprocessControl from './preprocessor/control';
import preprocessDestruct from './preprocessor/destruct';
import preprocessList from './preprocessor/list';

const DEFAULT_COMPONENT_PATH = '@aldinh777/reactive-cml/dom/components';
const DEFAULT_INTODOM_PATH = '@aldinh777/reactive-cml/dom';
const DEFAULT_SIMPLEDON_PATH = '@aldinh777/reactive-cml/dom/dom-util';
const LOCAL_COMPONENT_PATH = join(__dirname, '../dom/components');
const LOCAL_INTODOM_PATH = join(__dirname, '../dom');
const LOCAL_SIMPLEDOM_PATH = join(__dirname, '../dom/dom-util');

function pathify(target: string | void, source: string): string {
    return './' + (target ? relative(dirname(target), source) : source).replace(/\\/g, '/');
}

export default function (options?: { localDebug?: boolean; filepath: string }): Preprocessor {
    return {
        buildScript(cmlRoot, [dependencies, params], addImport) {
            /** add internal dependencies to import */
            const internalComponents = dependencies.filter((dep: string) =>
                DEFAULT_COMPONENT_SET.includes(dep)
            );
            for (const component of internalComponents) {
                const componentPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_COMPONENT_PATH)
                    : DEFAULT_COMPONENT_PATH;
                addImport([`${componentPath}/${component}`, component]);
            }

            const rcResult = processRC(cmlRoot);
            const fullparams = params.concat(dependencies);
            const rcJson = JSON.stringify(rcResult, null, 2);
            let outputScript: string;
            if (fullparams.length > 0) {
                const domifiedPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_INTODOM_PATH)
                    : DEFAULT_INTODOM_PATH;
                addImport([domifiedPath, ['intoDom']]);
                outputScript = `return intoDom(${rcJson}, {${fullparams.join()}}, component, true)`;
            } else {
                const domifiedPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_SIMPLEDOM_PATH)
                    : DEFAULT_SIMPLEDON_PATH;
                addImport([domifiedPath, ['simpleDom']]);
                outputScript = `return simpleDom(${rcJson}, component)`;
            }
            return outputScript;
        },
        relativeBlacklist: DEFAULT_COMPONENT_SET,
        preprocessors: [
            preprocessChildren,
            preprocessSlot,
            preprocessControl,
            preprocessList,
            preprocessDestruct,
            preprocessComponent,
            preprocessExtract,
            preprocessBinding
        ]
    };
}
