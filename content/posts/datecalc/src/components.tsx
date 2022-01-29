import { tokenize, parse, resolve, formatTokens, formatAst } from "./datecalc";
import React, { useState, useEffect } from "react";

const dateFmt: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    hourCycle: "h23",
};

interface DateCalcFormProps {
    initial: string;
}

export const DateCalcForm: React.FC<DateCalcFormProps> = ({ initial }) => {
    const [state, setState] = useState(initial);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(e.target.value);
    };
    const onClick = (value: string) => {
        setState(value);
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
            <h2 id="examples">Examples</h2>
            <ul>
                <li>
                    What is the date 30 days from now?{" "}
                    <DateCalcLink
                        value="12/30/2021 + 30 days"
                        onClick={onClick}
                    />
                </li>
                <li>
                    How many days between 2 dates?{" "}
                    <DateCalcLink
                        value="12/25/2020 - 12/25/2021"
                        onClick={onClick}
                    />
                </li>
                <li>
                    How many hours in a week?{" "}
                    <DateCalcLink value="1 week as hours" onClick={onClick} />
                </li>
            </ul>
        </>
    );
};

interface DateCalcLinkProps {
    value: string;
    onClick: (value: string) => void;
}

const DateCalcLink: React.FC<DateCalcLinkProps> = ({ value, onClick }) => {
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick(value);
            }}
        >
            {value}
        </a>
    );
};
