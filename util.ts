export type Properties = StaticProperties<any>;

export interface StaticProperties<T> {
    [key: string]: T;
}
export interface TextProp {
    name: string;
}

export function extractTextProps(text: string): (string | TextProp)[] {
    const result: (string | TextProp)[] = [];
    let stream = '';
    let propname = '';
    let flagProp = false;
    let flagPropname = false;
    let flagWhitespace = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (flagProp) {
            if (flagWhitespace) {
                if (c === '{') {
                    stream += '{' + propname;
                    propname = '';
                } else if (c === '}') {
                    flagProp = false;
                    flagWhitespace = false;
                    stream += '{' + propname + '}';
                } else if (c.match(/[^\s]/)) {
                    flagWhitespace = false;
                    flagPropname = true;
                    propname += c;
                } else {
                    propname += c;
                }
            } else if (flagPropname) {
                if (c === '{') {
                    const slash = text[i - 1] === '\\';
                    console.log({ slash });
                    flagPropname = false;
                    flagWhitespace = !slash;
                    flagProp = !slash;
                    stream +=
                        '{' + (slash ? propname.slice(0, propname.length - 1) + '{' : propname);
                    propname = '';
                } else if (c === '}' && propname.match(/^\s*[_$A-Za-z][_$\w]*/)) {
                    flagProp = false;
                    result.push(stream, { name: propname.trim() });
                    stream = '';
                    propname = '';
                } else if (c.match(/\s/)) {
                    flagPropname = false;
                    propname += c;
                } else if (c.match(/[_$\w]/)) {
                    propname += c;
                } else {
                    flagPropname = false;
                    flagProp = false;
                    stream += '{' + propname + c;
                    propname = '';
                }
            } else {
                if (c === '}' && propname.match(/^\s*[_$A-Za-z][_$\w]*/)) {
                    flagProp = false;
                    result.push(stream, { name: propname.trim() });
                    stream = '';
                    propname = '';
                } else if (c.match(/\s/)) {
                    propname += c;
                } else {
                    flagProp = false;
                    stream += '{' + propname + c;
                    propname = '';
                }
            }
        } else {
            if (c === '\\' && text[i + 1] === '{') {
                stream += '{';
                i++;
                continue;
            } else if (c === '{') {
                flagProp = true;
                flagWhitespace = true;
            } else {
                stream += c;
            }
        }
    }
    if (flagProp) {
        stream += '{' + propname;
    }
    if (stream) {
        result.push(stream);
    }
    return result;
}
