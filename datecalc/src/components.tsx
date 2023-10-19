import React, { useState, useEffect } from "react";
import { tokenize, parse, resolve, formatTokens, formatAst } from "./datecalc";

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
    let formattedTokens = "";
    let formattedAst = "";

    try {
        if (state) {
            tokens = tokenize(state);
            ast = parse(tokens);
            result = resolve(ast);
            output = result instanceof Date ? result.toLocaleString("en-US", dateFmt) : result.toString();
            formattedTokens = formatTokens(tokens);
            formattedAst = formatAst(ast);
        }
    } catch (ex) {
        console.log(ex);
        err = ex.toString();
    }

    return (
        <>
            <div className="calc">
                <p className="label">Input:</p>
                <input type="text" autoComplete="off" value={state || ""} onChange={onChange} />
                <p className="label">Output:</p>
                <p className={"output" + ((err && " error") || "")}>{err || output || "(none)"}</p>
            </div>
            <h2 id="examples">Examples</h2>
            <ul>
                <li>
                    What is the date 30 days from today? <DateCalcLink value="today + 30 days" onClick={onClick} />
                </li>
                <li>
                    How many days between 2 dates? <DateCalcLink value="12/25/2020 - 12/25/2021" onClick={onClick} />
                </li>
                <li>
                    How many hours in a week? <DateCalcLink value="1 week as hours" onClick={onClick} />
                </li>
            </ul>
            <h2 id="debug">Debug</h2>
            <div className="tokens">
                <div className="col">
                    <span className="label">Tokens:</span>
                    <pre>{formattedTokens || "(none)"}</pre>
                </div>
                <div className="col">
                    <span className="label">AST:</span>
                    <pre>{formattedAst || "(none)"}</pre>
                </div>
            </div>
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
