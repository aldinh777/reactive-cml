import { CMLObject, CMLTree } from '@aldinh777/cml-parser';

export interface Properties<T = unknown> {
    [key: string]: T;
}

export interface Preprocessor {
    buildScript(
        cmlRoot: CMLTree,
        identifiers: Identifiers,
        addImport: (item: ImportFormat) => any
    ): string;
    relativeBlacklist?: string[];
    preprocessors?: TreePreprocessor[];
}

export type FlatText = [name: string];
export type ImportFormat = [from: string, imports: string | string[]];

export type Identifiers = [dependencies: string[], params: string[], blacklist?: Set<string>];
export type TreePreprocessor = (node: CMLObject, ids: Identifiers, isRoot: boolean) => CMLObject;
