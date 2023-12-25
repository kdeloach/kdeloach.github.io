import React, { useState, useRef, useEffect } from "react";
import { compile } from "./exapunks";

const defaultInput = `REPL CLONE

; SEND FILE CONTENTS TO CLONE
GRAB 200
WHILE NOT EOF
  COPY F M
LOOP
COPY 0 M
HALT

; COPY DATA TO NEW FILE
MARK CLONE
MAKE
DO
  COPY M T
  BREAK IFFALSE
  COPY T F
  X += T
LOOP WHILE X < 100
KILL

IF X >= 100
  LINK 800
ELSE IF X >= 50
  LINK 801
ELSE
  LINK 802
END`;

const defaultOutput = `REPL CLONE

; SEND FILE CONTENTS TO CLONE
GRAB 200
MARK WHILE_0
TEST EOF
TJMP WHILE_0_END
COPY F M
JUMP WHILE_0
MARK WHILE_0_END
COPY 0 M
HALT

; COPY DATA TO NEW FILE
MARK CLONE
MAKE
MARK DO_1
COPY M T
FJMP DO_1_END ; BREAK
COPY T F
ADDI X T X
TEST X < 100
TJMP DO_1
MARK DO_1_END
KILL

TEST X < 100
TJMP L0
LINK 800
JUMP IF_2_END
MARK L0
TEST X < 50
TJMP L1
LINK 801
JUMP IF_2_END
MARK L1
LINK 802
MARK IF_2_END`;

export function CodeEditor() {
    const [input, setInput] = useState(defaultInput);
    const [lastOutput, setOutput] = useState(defaultOutput);
    const [lastErr, setError] = useState("");

    useEffect(() => {
        const [output, err] = compile(input);
        if (err != null) {
            setError(err.message);
        } else {
            setOutput(output);
            setError("");
        }
    }, [input]);

    return (
        <div id="editor">
            <div id="split">
                <textarea id="input" value={input} onChange={(e) => setInput(e.target.value)} />
                <pre id="output">{lastOutput}</pre>
            </div>
            {(lastErr && <div id="error">{lastErr}</div>) || ""}
        </div>
    );
}
