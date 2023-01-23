import { join, relative, dirname } from 'path';
import { processRC } from '../core';
import { Preprocessor } from '../common/types';
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
const DEFAULT_RENDER_PATH = '@aldinh777/reactive-cml/core/render';
const LOCAL_COMPONENT_PATH = join(__dirname, '../dom/components');
const LOCAL_RENDER_PATH = join(__dirname, '../dom');

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
            const domifiedPath = options?.localDebug
                ? pathify(options?.filepath, LOCAL_RENDER_PATH)
                : DEFAULT_RENDER_PATH;
            addImport([domifiedPath, ['render']]);
            outputScript = `return render(${rcJson}, {${fullparams.join()}}, component, true)`;
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
