import { join, relative, dirname } from 'path';
import { renderCML } from '../core';
import { Preprocessor } from '../common/types';
import { BASE_COMPONENT_SET } from '../common/constants';
import { DOM_COMPONENT_SET } from './constants';

import basePreprocessors from '../common/base-preprocessors';
import preprocessControlledIf from './preprocessor/controlled-if';
import preprocessControlledDestruct from './preprocessor/controlled-destruct';
import preprocessControlledForeach from './preprocessor/controlled-foreach';

const COMMON_COMPONENT_PATH = '@aldinh777/reactive-cml/common/components';
const DEFAULT_COMPONENT_PATH = '@aldinh777/reactive-cml/dom/components';
const DEFAULT_RENDER_PATH = '@aldinh777/reactive-cml/core/render';
const DEFAULT_SIMPLE_RENDER_PATH = '@aldinh777/reactive-cml/dom/slimify/render';
const LOCAL_COMPONENT_PATH = join(__dirname, '../dom/components');
const LOCAL_RENDER_PATH = join(__dirname, '../core/render');
const LOCAL_SIMPLE_RENDER_PATH = join(__dirname, '../dom/slimify/render');
const INTERNAL_COMPONENT_SET = BASE_COMPONENT_SET.concat(DOM_COMPONENT_SET);

function pathify(target: string | void, source: string): string {
    return './' + (target ? relative(dirname(target), source) : source).replace(/\\/g, '/');
}

export default function (options?: { localDebug?: boolean; filepath: string }): Preprocessor {
    return {
        buildScript(cmlRoot, [dependencies, params], addImport) {
            /** add internal dependencies to import */
            const internalComponents = dependencies.filter((dep: string) =>
                INTERNAL_COMPONENT_SET.includes(dep)
            );
            for (const component of internalComponents) {
                const componentPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_COMPONENT_PATH)
                    : BASE_COMPONENT_SET.includes(component)
                    ? COMMON_COMPONENT_PATH
                    : DEFAULT_COMPONENT_PATH;
                addImport([`${componentPath}/${component}`, component]);
            }

            /** component rendering process */
            const flatResult = renderCML(cmlRoot);
            const fullparams = params.concat(dependencies);
            const stringifiedResult = JSON.stringify(flatResult, null, 2);
            let outputScript: string;
            if (fullparams.length > 0) {
                const domifiedPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_RENDER_PATH)
                    : DEFAULT_RENDER_PATH;
                addImport([domifiedPath, ['render']]);
                outputScript = `return render(${stringifiedResult}, {${fullparams.join()}}, component, true)`;
            } else {
                const domifiedPath = options?.localDebug
                    ? pathify(options?.filepath, LOCAL_SIMPLE_RENDER_PATH)
                    : DEFAULT_SIMPLE_RENDER_PATH;
                addImport([domifiedPath, ['simpleRender']]);
                outputScript = `return simpleRender(${stringifiedResult}, component, true)`;
            }
            return outputScript;
        },
        relativeBlacklist: INTERNAL_COMPONENT_SET,
        preprocessors: [
            preprocessControlledIf,
            preprocessControlledDestruct,
            preprocessControlledForeach,
            ...basePreprocessors
        ]
    };
}
