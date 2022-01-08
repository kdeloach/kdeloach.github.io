import { AppContext } from "../context";
import { ComponentMap } from "../types";
import { tokenize, parse, resolve, formatTokens, formatAst } from "./datecalc";
import React, { useState, useContext, useEffect } from "react";

interface DateCalcFormProps {
    initial: string;
}

interface Context {
    value: string;
}

const dateFmt: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    hourCycle: "h23",
};

const DateCalcForm: React.FC<DateCalcFormProps> = ({ initial }) => {
    const { state, setState } = useContext(AppContext);

    useEffect(() => {
        if (!state) {
            setState(initial);
        }
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(e.target.value);
    };

    let tokens, ast, result, output, err;

    try {
        if (state) {
            tokens = tokenize(state);
            ast = parse(tokens);
            result = resolve(ast);
            output =
                result instanceof Date
                    ? result.toLocaleString("en-US", dateFmt)
                    : result.toString();
        }
    } catch (ex) {
        err = ex.toString();
    }

    return (
        <>
            <div className="calc">
                <p className="label">Input:</p>
                <input
                    type="text"
                    autoComplete="off"
                    value={state || ""}
                    onChange={onChange}
                />
                <p className="label">Output:</p>
                <p className={"output" + ((err && " error") || "")}>
                    {output || err || "(none)"}
                </p>
            </div>
            <div className="tokens">
                <div className="col">
                    <p className="label">Tokens:</p>
                    <pre>{(tokens && formatTokens(tokens)) || "(none)"}</pre>
                </div>
                <div className="col">
                    <p className="label">AST:</p>
                    <pre>{(ast && formatAst(ast)) || "(none)"}</pre>
                </div>
            </div>
        </>
    );
};

interface DateCalcLinkProps {
    value: string;
}

const DateCalcLink: React.FC<DateCalcLinkProps> = ({ value }) => {
    const { setState } = useContext(AppContext);
    return (
        <a href="#" onClick={() => setState(value)}>
            {value}
        </a>
    );
};

export default function registerComponents(components: ComponentMap) {
    components["DateCalcForm"] = DateCalcForm;
    components["DateCalcLink"] = DateCalcLink;
}
