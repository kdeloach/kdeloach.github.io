class Token {
    public Name: string;
    public Value: string;
    public Line: number;

    constructor(args: { Name: string; Value: string; Line: number }) {
        this.Name = args.Name;
        this.Value = args.Value;
        this.Line = args.Line;
    }

    isEOL(): boolean {
        return this.Name === "EOL";
    }

    isEOF(): boolean {
        return this.Name === "EOF";
    }
}

class NodeList extends Array<FunctionNode> {
    constructor(...items: FunctionNode[]) {
        super(...items);
        Object.setPrototypeOf(this, NodeList.prototype);
    }

    static fromArray(array: FunctionNode[]): NodeList {
        return new NodeList(...array);
    }

    merge(list2: NodeList): NodeList {
        for (const item of list2) {
            this.push(item);
        }
        return this;
    }

    lastNonEmptyLineIndex(): number {
        let j = this.length - 1;
        for (; j >= 0; j--) {
            if (!this[j].isEmpty() && !this[j].isComment()) {
                break;
            }
        }
        return j;
    }

    nextNonEmptyLineIndex(start: number): number {
        for (let i = start; i < this.length; i++) {
            if (this[i].isEmpty() || this[i].isComment()) {
                continue;
            }
            return i;
        }
        return -1;
    }

    write(w: StringWriter) {
        for (const node of this) {
            node.write(w);
            w.writeString("\n");
        }
    }
}

class CondNode {
    public Test: FunctionNode;
    public Negate: boolean;

    constructor(args: { Test: FunctionNode; Negate: boolean }) {
        this.Test = args.Test;
        this.Negate = args.Negate;
    }
}

class IfNode {
    public Label: string;
    public Cond: CondNode;
    public Body: NodeList;
    public ElseIf: IfNode[];
    public Else: NodeList;

    constructor(args: { Label: string; Cond: CondNode; Body: NodeList; ElseIf: IfNode[]; Else: NodeList }) {
        this.Label = args.Label;
        this.Cond = args.Cond;
        this.Body = args.Body;
        this.ElseIf = args.ElseIf;
        this.Else = args.Else;
    }
}

class WhileNode {
    public Label: string;
    public Cond: CondNode;
    public Body: NodeList;
    public Endless: boolean;

    constructor(args: { Label: string; Cond: CondNode; Body: NodeList; Endless: boolean }) {
        this.Label = args.Label;
        this.Cond = args.Cond;
        this.Body = args.Body;
        this.Endless = args.Endless;
    }
}

class DoNode {
    public Label: string;
    public Cond: CondNode;
    public Body: NodeList;
    public Endless: boolean;

    constructor(args: { Label: string; Cond: CondNode; Body: NodeList; Endless: boolean }) {
        this.Label = args.Label;
        this.Cond = args.Cond;
        this.Body = args.Body;
        this.Endless = args.Endless;
    }
}

class FunctionNode {
    public Name: string;
    public Arguments: ValueNode[];
    public Comment: ValueNode[];

    constructor(args: { Name: string; Arguments: ValueNode[]; Comment: ValueNode[] }) {
        this.Name = args.Name;
        this.Arguments = args.Arguments;
        this.Comment = args.Comment;
    }

    isEmpty(): boolean {
        return this.Name == "";
    }

    isComment(): boolean {
        switch (this.Name) {
            case "NOTE":
            case ";":
            case "@REP":
            case "@END":
                return true;
        }
        return false;
    }

    write(w: StringWriter) {
        w.writeString(this.Name);
        if (this.Arguments.length > 0) {
            for (const arg of this.Arguments) {
                w.writeString(" ");
                arg.write(w);
            }
        }
        if (this.Comment.length > 0) {
            w.writeString(" ;");
            for (const comment of this.Comment) {
                w.writeString(" ");
                comment.write(w);
            }
        }
    }
}

class ValueNode {
    public Name: string;
    public Value: string;

    constructor(args: { Name: string; Value: string }) {
        this.Name = args.Name;
        this.Value = args.Value;
    }

    write(w: StringWriter) {
        w.writeString(this.Value);
    }
}

var emptyBody = new NodeList();
var emptyValueNode = new ValueNode({ Name: "", Value: "" });
var emptyToken = new Token({ Name: "", Value: "", Line: 0 });
var emptyFunctionNode = new FunctionNode({ Name: "", Arguments: [], Comment: [] });
var emptyCondNode = new CondNode({ Test: emptyFunctionNode, Negate: false });
var emptyIfNode = new IfNode({ Label: "", Cond: emptyCondNode, Body: emptyBody, ElseIf: [], Else: emptyBody });
var emptyDoNode = new DoNode({ Label: "", Cond: emptyCondNode, Body: emptyBody, Endless: false });
var emptyWhileNode = new WhileNode({ Label: "", Cond: emptyCondNode, Body: emptyBody, Endless: false });

function tokenize(input: string): Token[] {
    const tokens: Token[] = [];

    input = input.toUpperCase();
    const lines = input.split("\n");

    let lineNum = 1;

    for (const line of lines) {
        // Split on line comment character first, to avoid syntax errors if ";"
        // is not surrounded by whitespace, since we're not doing
        // character-by-character tokenization.
        const [lineWithoutComment, comment, hasComment] = splitLineWithComment(line);
        const trimmedLine = lineWithoutComment.trim();
        const words = trimmedLine.split(/\s+/); // Split by whitespace
        for (const word of words) {
            if (word.length === 0) {
                continue;
            }
            const token = new Token({ Name: "LITERAL", Value: word, Line: lineNum });
            tokens.push(token);
        }
        if (hasComment) {
            const trimmedComment = comment.trim();
            const semicolonToken = new Token({ Name: "LITERAL", Value: ";", Line: lineNum });
            tokens.push(semicolonToken);
            const commentToken = new Token({ Name: "LITERAL", Value: trimmedComment, Line: lineNum });
            tokens.push(commentToken);
        }
        const eolToken = new Token({ Name: "EOL", Value: "EOL", Line: lineNum });
        tokens.push(eolToken);
        lineNum++;
    }

    const eofToken = new Token({ Name: "EOF", Value: "EOF", Line: lineNum });
    tokens.push(eofToken);

    return tokens;
}

function splitLineWithComment(line: string): [string, string, boolean] {
    const commentIndex = line.indexOf(";");
    if (commentIndex !== -1) {
        const lineWithoutComment = line.slice(0, commentIndex);
        const comment = line.slice(commentIndex + 1);
        return [lineWithoutComment, comment, true];
    }
    return [line, "", false];
}

class Parser {
    private labelID: number;
    private labelStack: string[];
    private tokens: Token[];

    constructor(tokens: Token[]) {
        this.labelID = 0;
        this.labelStack = [];
        this.tokens = tokens;
    }

    private current(): Token {
        return this.tokens[0];
    }

    private peek(): Token {
        if (this.tokens.length > 1) {
            return this.tokens[1];
        }
        return emptyToken;
    }

    private pop(): [Token, Error] {
        if (this.tokens.length === 0) {
            return [emptyToken, new Error("unexpected end of program")];
        }
        const token = this.tokens[0];
        this.tokens = this.tokens.slice(1);
        return [token, null];
    }

    private expect(value: string): [Token, Error] {
        const [token, err] = this.pop();
        if (err !== null) {
            return [emptyToken, err];
        }
        if (token.Value !== value) {
            return [emptyToken, new Error(`expected ${value} but got '${token.Value}' on line ${token.Line}`)];
        }
        return [token, null];
    }

    private expectNotEmpty(): [Token, Error] {
        const [token, err] = this.pop();
        if (err !== null) {
            return [emptyToken, err];
        }
        if (token.Value === "EOL") {
            return [emptyToken, new Error("unexpected EOL")];
        }
        return [token, null];
    }

    private isEndOfBody(): boolean {
        return (
            this.current().Value === "END" ||
            this.current().Value === "ELSE" ||
            this.current().Value === "LOOP" ||
            this.current().isEOF()
        );
    }

    private isEOL(): boolean {
        return this.current().isEOL() || this.current().isEOF();
    }

    private isStartOfComment(): boolean {
        return this.current().Value === ";";
    }

    private parseArguments(n: number): [ValueNode[], Error] {
        const args: ValueNode[] = [];
        while (!this.isEOL() && !this.isStartOfComment()) {
            const [token, err] = this.expectNotEmpty();
            if (err !== null) {
                return [[], new Error(`error parsing argument: ${err.message}`)];
            }
            args.push(new ValueNode({ Name: "LITERAL", Value: token.Value }));
        }
        if (n > 0 && args.length !== n) {
            return [[], new Error(`expected ${n} arguments but got ${args.length}`)];
        }
        return [args, null];
    }

    private parseValue(): [ValueNode, Error] {
        const [token, err] = this.expectNotEmpty();
        if (err !== null) {
            return [emptyValueNode, new Error(`error parsing value: ${err.message}`)];
        }
        return [new ValueNode({ Name: "LITERAL", Value: token.Value }), null];
    }

    private parseOperator(): [ValueNode, Error] {
        const [token, err] = this.expectNotEmpty();
        if (err !== null) {
            return [emptyValueNode, new Error(`error parsing value: ${err.message}`)];
        }
        return [new ValueNode({ Name: "OPERATOR", Value: token.Value }), null];
    }

    private parseAssignExpr(): [FunctionNode, Error] {
        const [to, errTo] = this.parseValue();
        if (errTo !== null) {
            return [emptyFunctionNode, new Error(`error parsing assign register: ${errTo.message}`)];
        }

        const [, errEquals] = this.expect("=");
        if (errEquals !== null) {
            return [emptyFunctionNode, errEquals];
        }

        let [left, errLeft] = this.parseValue();
        if (errLeft !== null) {
            return [emptyFunctionNode, new Error(`error parsing assign value: ${errLeft.message}`)];
        }

        if (this.isEOL()) {
            return [new FunctionNode({ Name: "COPY", Arguments: [left, to], Comment: [] }), null];
        }

        let [op, errOp] = this.parseOperator();
        if (errOp !== null) {
            return [emptyFunctionNode, new Error(`error parsing assign operator: ${errOp.message}`)];
        }

        // Rewrite "X = RAND 1 10" to "X = 1 RAND 10"
        if (left.Value === "RAND") {
            [op, left] = [left, op];
        }

        switch (op.Value) {
            case "+":
                op.Value = "ADDI";
                break;
            case "-":
                op.Value = "SUBI";
                break;
            case "*":
                op.Value = "MULI";
                break;
            case "/":
                op.Value = "DIVI";
                break;
            case "%":
                op.Value = "MODI";
                break;
            case "SWIZ":
            case "RAND":
                // no change
                break;
            default:
                return [emptyFunctionNode, new Error(`invalid operator: ${op.Value}`)];
        }

        const [right, errRight] = this.parseValue();
        if (errRight !== null) {
            return [emptyFunctionNode, new Error(`error parsing assign operand: ${errRight.message}`)];
        }

        return [new FunctionNode({ Name: op.Value, Arguments: [left, right, to], Comment: [] }), null];
    }

    private parseShortAssignExpr(): [FunctionNode, Error] {
        const [to, errTo] = this.parseValue();
        if (errTo !== null) {
            return [emptyFunctionNode, new Error(`error parsing short assign register: ${errTo.message}`)];
        }

        const [op, errOp] = this.parseOperator();
        if (errOp !== null) {
            return [emptyFunctionNode, new Error(`error parsing short assign operator: ${errOp.message}`)];
        }

        switch (op.Value) {
            case "+=":
                op.Value = "ADDI";
                break;
            case "-=":
                op.Value = "SUBI";
                break;
            case "*=":
                op.Value = "MULI";
                break;
            case "/=":
                op.Value = "DIVI";
                break;
            case "%=":
                op.Value = "MODI";
                break;
            default:
                return [emptyFunctionNode, new Error(`invalid operator: ${op.Value}`)];
        }

        const [right, errRight] = this.parseValue();
        if (errRight !== null) {
            return [emptyFunctionNode, new Error(`error parsing short assign value: ${errRight.message}`)];
        }

        return [new FunctionNode({ Name: op.Value, Arguments: [to, right, to], Comment: [] }), null];
    }

    private parseCondExpr(): [CondNode, Error] {
        let negate = false;
        if (this.current().Value === "NOT") {
            const [, err] = this.expect("NOT");
            if (err !== null) {
                return [emptyCondNode, err];
            }
            negate = true;
        }

        const [left, errLeft] = this.parseValue();
        if (errLeft !== null) {
            return [emptyCondNode, new Error(`error parsing left operand: ${errLeft.message}`)];
        }

        if (left.Value === "EOF" || left.Value === "MRD") {
            const testEOF = new FunctionNode({ Name: "TEST", Arguments: [left], Comment: [] });
            return [new CondNode({ Test: testEOF, Negate: negate }), null];
        } else if (left.Value === "ISTRUE") {
            const istrue = new FunctionNode({ Name: "NOOP", Arguments: [left], Comment: [] });
            return [new CondNode({ Test: istrue, Negate: negate }), null];
        } else if (left.Value === "ISFALSE") {
            const isfalse = new FunctionNode({ Name: "NOOP", Arguments: [left], Comment: [] });
            return [new CondNode({ Test: isfalse, Negate: !negate }), null];
        }

        const [op, errOp] = this.parseOperator();
        if (errOp !== null) {
            return [emptyCondNode, new Error(`error parsing operator: ${errOp.message}`)];
        }

        const [right, errRight] = this.parseValue();
        if (errRight !== null) {
            return [emptyCondNode, new Error(`error parsing right operand: ${errRight.message}`)];
        }

        switch (op.Value) {
            case "=":
            case ">":
            case "<":
                // no change
                break;
            case "!=":
                op.Value = "=";
                negate = !negate;
                break;
            case ">=":
                op.Value = "<";
                negate = !negate;
                break;
            case "<=":
                op.Value = ">";
                negate = !negate;
                break;
            default:
                return [emptyCondNode, new Error(`invalid operator: ${op.Value}`)];
        }

        const testNode = new FunctionNode({ Name: "TEST", Arguments: [left, op, right], Comment: [] });
        return [new CondNode({ Test: testNode, Negate: negate }), null];
    }

    private parseElseIfExpr(): [IfNode, Error] {
        const label = `ELSEIF_${this.labelID}`;
        this.labelID++;

        const [, errElse] = this.expect("ELSE");
        if (errElse !== null) {
            return [emptyIfNode, errElse];
        }

        const [, errIf] = this.expect("IF");
        if (errIf !== null) {
            return [emptyIfNode, errIf];
        }

        const [cond, errCond] = this.parseCondExpr();
        if (errCond !== null) {
            return [emptyIfNode, new Error(`error parsing condition: ${errCond.message}`)];
        }

        const [, errEOL] = this.expect("EOL");
        if (errEOL !== null) {
            return [emptyIfNode, errEOL];
        }

        const [body, errBody] = this.parseBody();
        if (errBody !== null) {
            return [emptyIfNode, new Error(`error parsing body: ${errBody.message}`)];
        }

        return [new IfNode({ Label: label, Cond: cond, Body: body, ElseIf: [], Else: emptyBody }), null];
    }

    private parseIfExpr(): [IfNode, Error] {
        const label = `IF_${this.labelID}`;
        this.labelID++;

        const [, errIf] = this.expect("IF");
        if (errIf !== null) {
            return [emptyIfNode, errIf];
        }

        const [cond, errCond] = this.parseCondExpr();
        if (errCond !== null) {
            return [emptyIfNode, new Error(`error parsing condition: ${errCond.message}`)];
        }

        const [, errEOL] = this.expect("EOL");
        if (errEOL !== null) {
            return [emptyIfNode, errEOL];
        }

        const [body, errBody] = this.parseBody();
        if (errBody !== null) {
            return [emptyIfNode, new Error(`error parsing body: ${errBody.message}`)];
        }

        const elseIfList: IfNode[] = [];
        while (this.current().Value === "ELSE" && this.peek().Value === "IF") {
            const [elseIfNode, errElseIf] = this.parseElseIfExpr();
            if (errElseIf !== null) {
                return [emptyIfNode, new Error(`error parsing ELSE IF clause: ${errElseIf.message}`)];
            }
            elseIfList.push(elseIfNode);
        }

        let elseBody = new NodeList();
        if (this.current().Value === "ELSE") {
            const [, errElse] = this.expect("ELSE");
            if (errElse !== null) {
                return [emptyIfNode, errElse];
            }
            const [, errEOL] = this.expect("EOL");
            if (errEOL !== null) {
                return [emptyIfNode, errEOL];
            }
            const [parsedElseBody, errElseBody] = this.parseBody();
            if (errElseBody !== null) {
                return [emptyIfNode, new Error(`error parsing ELSE clause: ${errElseBody.message}`)];
            }
            elseBody = parsedElseBody;
        }

        const [, errEnd] = this.expect("END");
        if (errEnd !== null) {
            return [emptyIfNode, errEnd];
        }

        return [{ Label: label, Cond: cond, Body: body, ElseIf: elseIfList, Else: elseBody }, null];
    }

    transformIfExpr(ifNode: IfNode, parentEndLabel: ValueNode): NodeList {
        const label = new ValueNode({ Name: "LITERAL", Value: ifNode.Label });
        const nextLabel = new ValueNode({ Name: "LITERAL", Value: ifNode.Label + "_NEXT" });
        const endLabel = new ValueNode({ Name: "LITERAL", Value: ifNode.Label + "_END" });

        const nodes: NodeList = new NodeList();
        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [label], Comment: [] }));

        if (ifNode.Cond.Test.Name !== "NOOP") {
            nodes.push(ifNode.Cond.Test);
        }

        if (ifNode.Cond.Negate) {
            nodes.push(new FunctionNode({ Name: "TJMP", Arguments: [nextLabel], Comment: [] }));
        } else {
            nodes.push(new FunctionNode({ Name: "FJMP", Arguments: [nextLabel], Comment: [] }));
        }

        nodes.push(...ifNode.Body);

        if (parentEndLabel.Value !== "") {
            nodes.push(new FunctionNode({ Name: "JUMP", Arguments: [parentEndLabel], Comment: [] }));
        } else {
            nodes.push(new FunctionNode({ Name: "JUMP", Arguments: [endLabel], Comment: [] }));
        }

        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [nextLabel], Comment: [] }));

        for (const elseIfNode of ifNode.ElseIf) {
            const elseIfNodes = this.transformIfExpr(elseIfNode, endLabel);
            nodes.push(...elseIfNodes);
        }

        nodes.push(...ifNode.Else);
        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [endLabel], Comment: [] }));

        return nodes;
    }

    parseWhileExpr(): [WhileNode, Error | null] {
        const label = `WHILE_${this.labelID}`;
        this.labelStack.push(label);
        this.labelID++;

        const [whileToken, whileErr] = this.expect("WHILE");
        if (whileErr) {
            return [emptyWhileNode, whileErr];
        }

        let endless = true;

        // Parse optional condition
        let cond: CondNode | null;
        if (!this.isEOL() && !this.isStartOfComment()) {
            endless = false;
            const [condResult, condErr] = this.parseCondExpr();
            if (condErr) {
                return [emptyWhileNode, new Error(`error parsing condition: ${condErr.message}`)];
            }
            cond = condResult;
        }

        const [eolToken, eolErr] = this.expect("EOL");
        if (eolErr) {
            return [emptyWhileNode, eolErr];
        }

        const [body, bodyErr] = this.parseBody();
        if (bodyErr) {
            return [emptyWhileNode, new Error(`error parsing body: ${bodyErr.message}`)];
        }

        const [loopToken, loopErr] = this.expect("LOOP");
        if (loopErr) {
            return [emptyWhileNode, loopErr];
        }

        return [new WhileNode({ Label: label, Cond: cond, Body: body, Endless: endless }), null];
    }

    transformWhileExpr(whileNode: WhileNode): NodeList {
        const label = new ValueNode({ Name: "LITERAL", Value: whileNode.Label });
        const endLabel = new ValueNode({ Name: "LITERAL", Value: whileNode.Label + "_END" });

        const nodes = new NodeList();
        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [label], Comment: [] }));

        if (!whileNode.Endless) {
            if (whileNode.Cond.Test.Name !== "NOOP") {
                nodes.push(whileNode.Cond.Test);
            }
            if (whileNode.Cond.Negate) {
                nodes.push(new FunctionNode({ Name: "TJMP", Arguments: [endLabel], Comment: [] }));
            } else {
                nodes.push(new FunctionNode({ Name: "FJMP", Arguments: [endLabel], Comment: [] }));
            }
        }

        nodes.push(...whileNode.Body);
        nodes.push(new FunctionNode({ Name: "JUMP", Arguments: [label], Comment: [] }));
        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [endLabel], Comment: [] }));

        return nodes;
    }

    parseDoExpr(): [DoNode, Error | null] {
        const label = `DO_${this.labelID}`;
        this.labelStack.push(label);
        this.labelID++;

        const [token, err] = this.expect("DO");
        if (err) {
            return [emptyDoNode, err];
        }

        const [, errEOL] = this.expect("EOL");
        if (errEOL) {
            return [emptyDoNode, errEOL];
        }

        const [body, errBody] = this.parseBody();
        if (errBody) {
            return [emptyDoNode, errBody];
        }

        const [loopToken, errLoop] = this.expect("LOOP");
        if (errLoop) {
            return [emptyDoNode, errLoop];
        }

        let endless = true;
        let cond: CondNode | null;

        if (this.current().Value === "WHILE") {
            endless = false;
            const [, errWhile] = this.expect("WHILE");
            if (errWhile) {
                return [emptyDoNode, errWhile];
            }

            const [parsedCond, errCond] = this.parseCondExpr();
            if (errCond) {
                return [emptyDoNode, errCond];
            }

            cond = parsedCond;
        }

        const node: DoNode = {
            Label: label,
            Cond: cond,
            Body: body,
            Endless: endless,
        };

        return [node, null];
    }

    transformDoExpr(doNode: DoNode): NodeList {
        const label = new ValueNode({ Name: "LITERAL", Value: doNode.Label });
        const endLabel = new ValueNode({ Name: "LITERAL", Value: doNode.Label + "_END" });

        const nodes = new NodeList();
        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [label], Comment: [] }));
        nodes.push(...doNode.Body);

        if (doNode.Endless) {
            nodes.push(new FunctionNode({ Name: "JUMP", Arguments: [label], Comment: [] }));
        } else {
            if (doNode.Cond.Test.Name !== "NOOP") {
                nodes.push(doNode.Cond.Test);
            }
            if (doNode.Cond.Negate) {
                nodes.push(new FunctionNode({ Name: "FJMP", Arguments: [label], Comment: [] }));
            } else {
                nodes.push(new FunctionNode({ Name: "TJMP", Arguments: [label], Comment: [] }));
            }
        }

        nodes.push(new FunctionNode({ Name: "MARK", Arguments: [endLabel], Comment: [] }));

        return nodes;
    }

    parseBody(): [NodeList, Error] {
        const nodes = new NodeList();

        while (!this.isEndOfBody()) {
            switch (this.current().Value) {
                case "EOL":
                    const resultEOL = this.pop();
                    if (resultEOL[1] !== null) {
                        return [null, resultEOL[1]];
                    }
                    // Preserve blank lines
                    nodes.push(emptyFunctionNode);
                    continue;
                case "HALT":
                case "KILL":
                case "MODE":
                case "MAKE":
                case "DROP":
                case "WIPE":
                case "NOOP":
                case "@END":
                    // Parse function with 0 arguments
                    const resultZeroArgs = this.pop();
                    if (resultZeroArgs[1] !== null) {
                        return [null, resultZeroArgs[1]];
                    }
                    const nodeZeroArgs = new FunctionNode({
                        Name: resultZeroArgs[0].Value,
                        Arguments: [],
                        Comment: [],
                    });
                    nodes.push(nodeZeroArgs);
                    break;
                case "BREAK":
                    const resultBreak = this.pop();
                    if (resultBreak[1] !== null) {
                        return [null, resultBreak[1]];
                    }
                    if (this.labelStack.length === 0) {
                        return [null, new Error(`BREAK called outside of loop on line ${resultBreak[0].Line}`)];
                    }

                    // Pop label from stack
                    const label = this.labelStack.pop();
                    const labelVal = new ValueNode({ Name: "LITERAL", Value: `${label}_END` });
                    const commentVal = new ValueNode({ Name: ";", Value: "BREAK" });

                    let jump = "JUMP";
                    if (this.current().Value === "IFTRUE") {
                        const resultIFTRUE = this.expect("IFTRUE");
                        if (resultIFTRUE[1] !== null) {
                            return [null, resultIFTRUE[1]];
                        }
                        jump = "TJMP";
                    } else if (this.current().Value === "IFFALSE") {
                        const resultIFFALSE = this.expect("IFFALSE");
                        if (resultIFFALSE[1] !== null) {
                            return [null, resultIFFALSE[1]];
                        }
                        jump = "FJMP";
                    }

                    const breakNode = new FunctionNode({
                        Name: jump,
                        Arguments: [labelVal],
                        Comment: [commentVal],
                    });
                    nodes.push(breakNode);
                    break;
                case "CONTINUE":
                    const resultContinue = this.pop();
                    if (resultContinue[1] !== null) {
                        return [null, resultContinue[1]];
                    }
                    if (this.labelStack.length === 0) {
                        return [null, new Error(`CONTINUE called outside of loop on line ${resultContinue[0].Line}`)];
                    }

                    const continueLabel = this.labelStack[this.labelStack.length - 1];

                    const continueLabelVal = new ValueNode({ Name: "LITERAL", Value: continueLabel });
                    const continueCommentVal = new ValueNode({ Name: ";", Value: "CONTINUE" });

                    let continueJump = "JUMP";
                    if (this.current().Value === "IFTRUE") {
                        const resultIFTRUE = this.expect("IFTRUE");
                        if (resultIFTRUE[1] !== null) {
                            return [null, resultIFTRUE[1]];
                        }
                        continueJump = "TJMP";
                    } else if (this.current().Value === "IFFALSE") {
                        const resultIFFALSE = this.expect("IFFALSE");
                        if (resultIFFALSE[1] !== null) {
                            return [null, resultIFFALSE[1]];
                        }
                        continueJump = "FJMP";
                    }

                    const continueNode = new FunctionNode({
                        Name: continueJump,
                        Arguments: [continueLabelVal],
                        Comment: [continueCommentVal],
                    });
                    nodes.push(continueNode);
                    break;
                case "NOTE":
                case ";":
                    // Parse 0 or more arguments
                    const resultNote = this.pop();
                    if (resultNote[1] !== null) {
                        return [null, resultNote[1]];
                    }
                    const argsResult = this.parseArguments(-1);
                    if (argsResult[1] !== null) {
                        return [
                            null,
                            new Error(`invalid arguments on line ${resultNote[0].Line}: ${argsResult[1].message}`),
                        ];
                    }
                    const noteNode = new FunctionNode({
                        Name: resultNote[0].Value,
                        Arguments: argsResult[0],
                        Comment: [],
                    });
                    nodes.push(noteNode);
                    break;
                case "LINK":
                case "GRAB":
                case "MARK":
                case "JUMP":
                case "TJMP":
                case "FJMP":
                case "FILE":
                case "SEEK":
                case "VOID":
                case "REPL":
                case "HOST":
                case "@REP":
                    // Parse function with 1 argument
                    const resultOneArg = this.pop();
                    if (resultOneArg[1] !== null) {
                        return [null, resultOneArg[1]];
                    }
                    const oneArgResult = this.parseArguments(1);
                    if (oneArgResult[1] !== null) {
                        return [
                            null,
                            new Error(`invalid arguments on line ${resultOneArg[0].Line}: ${oneArgResult[1].message}`),
                        ];
                    }
                    const oneArgNode = new FunctionNode({
                        Name: resultOneArg[0].Value,
                        Arguments: oneArgResult[0],
                        Comment: [],
                    });
                    nodes.push(oneArgNode);
                    break;
                case "COPY":
                    // Parse function with 2 arguments
                    const resultTwoArgs = this.pop();
                    if (resultTwoArgs[1] !== null) {
                        return [null, resultTwoArgs[1]];
                    }
                    const twoArgsResult = this.parseArguments(2);
                    if (twoArgsResult[1] !== null) {
                        return [
                            null,
                            new Error(
                                `invalid arguments on line ${resultTwoArgs[0].Line}: ${twoArgsResult[1].message}`,
                            ),
                        ];
                    }
                    const twoArgsNode = new FunctionNode({
                        Name: resultTwoArgs[0].Value,
                        Arguments: twoArgsResult[0],
                        Comment: [],
                    });
                    nodes.push(twoArgsNode);
                    break;
                case "TEST":
                    // Parse function with 3 arguments
                    const resultTest = this.pop();
                    if (resultTest[1] !== null) {
                        return [null, resultTest[1]];
                    }
                    const condResult = this.parseCondExpr();
                    if (condResult[1] !== null) {
                        return [
                            null,
                            new Error(`syntax error on line ${resultTest[0].Line}: ${condResult[1].message}`),
                        ];
                    }
                    if (condResult[0].Test.Name !== "NOOP") {
                        nodes.push(condResult[0].Test);
                        if (condResult[0].Negate) {
                            const one = new ValueNode({ Name: "LITERAL", Value: "1" });
                            const t = new ValueNode({ Name: "LITERAL", Value: "T" });
                            nodes.push(new FunctionNode({ Name: "SUBI", Arguments: [one, t, t], Comment: [] }));
                        }
                    }
                    break;
                case "ADDI":
                case "SUBI":
                case "MULI":
                case "DIVI":
                case "MODI":
                case "SWIZ":
                case "RAND":
                    // Parse function with 3 arguments
                    const resultThreeArgs = this.pop();
                    if (resultThreeArgs[1] !== null) {
                        return [null, resultThreeArgs[1]];
                    }
                    const threeArgsResult = this.parseArguments(3);
                    if (threeArgsResult[1] !== null) {
                        return [
                            null,
                            new Error(
                                `invalid arguments on line ${resultThreeArgs[0].Line}: ${threeArgsResult[1].message}`,
                            ),
                        ];
                    }
                    const threeArgsNode = new FunctionNode({
                        Name: resultThreeArgs[0].Value,
                        Arguments: threeArgsResult[0],
                        Comment: [],
                    });
                    nodes.push(threeArgsNode);
                    break;
                case "IF":
                    const ifToken = this.current();
                    const ifResult = this.parseIfExpr();
                    if (ifResult[1] !== null) {
                        return [null, new Error(`error parsing IF on line ${ifToken.Line}: ${ifResult[1].message}`)];
                    }
                    const ifNodeList = this.transformIfExpr(ifResult[0], emptyValueNode);
                    nodes.push(...ifNodeList);
                    break;
                case "WHILE":
                    const whileToken = this.current();
                    const whileResult = this.parseWhileExpr();
                    if (whileResult[1] !== null) {
                        return [
                            null,
                            new Error(`error parsing WHILE on line ${whileToken.Line}: ${whileResult[1].message}`),
                        ];
                    }
                    const whileNodeList = this.transformWhileExpr(whileResult[0]);
                    nodes.merge(whileNodeList);
                    break;
                case "DO":
                    const doToken = this.current();
                    const doResult = this.parseDoExpr();
                    if (doResult[1] !== null) {
                        return [null, new Error(`error parsing DO on line ${doToken.Line}: ${doResult[1].message}`)];
                    }
                    const doNodeList = this.transformDoExpr(doResult[0]);
                    nodes.merge(doNodeList);
                    break;
                default:
                    // Expect token to be a register
                    const token = this.current();
                    if (this.peek().Value === "=") {
                        const assignResult = this.parseAssignExpr();
                        if (assignResult[1] !== null) {
                            return [
                                null,
                                new Error(
                                    `invalid assignment expression on line ${token.Line}: ${assignResult[1].message}`,
                                ),
                            ];
                        }
                        nodes.push(assignResult[0]);
                    } else if (this.peek().Value.endsWith("=")) {
                        const shortAssignResult = this.parseShortAssignExpr();
                        if (shortAssignResult[1] !== null) {
                            return [
                                null,
                                new Error(
                                    `invalid short assignment expression on line ${token.Line}: ${shortAssignResult[1].message}`,
                                ),
                            ];
                        }
                        nodes.push(shortAssignResult[0]);
                    } else {
                        return [null, new Error(`unexpected token on line ${token.Line}: ${token.Value}`)];
                    }
            }

            // Parse optional trailing comment
            if (this.isStartOfComment()) {
                const commentToken = this.expect(";");
                if (commentToken[1] !== null) {
                    return [null, commentToken[1]];
                }
                const commentArgsResult = this.parseArguments(-1);
                if (commentArgsResult[1] !== null) {
                    return [
                        null,
                        new Error(`invalid arguments on line ${commentToken[0].Line}: ${commentArgsResult[1].message}`),
                    ];
                }
                // Attach comment to last node
                const fnNode = nodes[nodes.length - 1];
                if (!fnNode.Comment) {
                    fnNode.Comment = [];
                }
                fnNode.Comment.push(...commentArgsResult[0]);
            }

            const resultEOL = this.expect("EOL");
            if (resultEOL[1] !== null) {
                return [null, resultEOL[1]];
            }
        }

        return [NodeList.fromArray(nodes), null];
    }

    parse(): [NodeList, Error] {
        const [body, err1] = this.parseBody();
        if (err1 !== null) {
            return [new NodeList(), err1];
        }

        const [eofToken, err2] = this.expect("EOF");
        if (err2 !== null) {
            return [new NodeList(), err2];
        }

        return [body, null];
    }
}

function optimize(nodes: NodeList): [NodeList, number] {
    let iterations = 0;
    let changed = true;
    let labelID = 0;

    while (iterations < 100) {
        changed = false;
        const newNodes = new NodeList();

        const markIndex: Record<string, number> = {};
        const jumpLabelCount: Record<string, number> = {};

        // XXX: Fix debugger not showing correct values for second for loop
        var i: number;
        var node: FunctionNode;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            switch (node.Name) {
                case "JUMP":
                case "TJMP":
                case "FJMP":
                case "REPL":
                    const label = node.Arguments[0].Value;
                    jumpLabelCount[label] = (jumpLabelCount[label] || 0) + 1;
                    break;
                case "MARK":
                    const markLabel = node.Arguments[0].Value;
                    markIndex[markLabel] = i;
                    // XXX: Init jump count for labels to 0 to avoid null check
                    jumpLabelCount[markLabel] = jumpLabelCount[markLabel] || 0;
                    break;
            }
        }

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];

            // Don't optimize away empty lines and comments.
            if (node.isEmpty() || node.isComment()) {
                newNodes.push(node);
                continue;
            }

            // Remove unused labels (MARK with no corresponding JUMP/TJMP/FJMP/REPL).
            if (node.Name === "MARK" && jumpLabelCount[node.Arguments[0].Value] === 0) {
                changed = true;
                continue;
            }

            // Previous non-empty line in NEW nodes list
            const lastAddedIndex = newNodes.lastNonEmptyLineIndex();

            // Next non-empty line in OLD nodes list
            const nextIndex = nodes.nextNonEmptyLineIndex(i + 1);

            // Combine MARKS defined next to each other.
            // ---
            // Before:
            // TMP A
            // JUMP B
            // MARK A
            // MARK B <- redundant
            // ---
            // After:
            // TMP L0
            // JUMP L0
            // MARK L0
            if (node.Name === "MARK" && nextIndex !== -1 && nodes[nextIndex].Name === "MARK") {
                const label1 = node.Arguments[0].Value;
                const label2 = nodes[nextIndex].Arguments[0].Value;

                const newLabel = `L${labelID}`;
                labelID++;

                jumpLabelCount[newLabel] = (jumpLabelCount[label1] || 0) + (jumpLabelCount[label2] || 0);
                jumpLabelCount[label1] = 0;
                jumpLabelCount[label2] = 0;

                nodes[nextIndex].Arguments[0].Value = newLabel;

                for (let j = 0; j < nodes.length; j++) {
                    const other = nodes[j];
                    switch (other.Name) {
                        case "JUMP":
                        case "TJMP":
                        case "FJMP":
                        case "REPL":
                            if (other.Arguments[0].Value === label1 || other.Arguments[0].Value === label2) {
                                other.Arguments[0].Value = newLabel;
                            }
                            break;
                    }
                }
                for (let j = 0; j < newNodes.length; j++) {
                    const other = newNodes[j];
                    switch (other.Name) {
                        case "JUMP":
                        case "TJMP":
                        case "FJMP":
                        case "REPL":
                            if (other.Arguments[0].Value === label1 || other.Arguments[0].Value === label2) {
                                other.Arguments[0].Value = newLabel;
                            }
                            break;
                    }
                }
                changed = true;
                continue;
            }

            // Remove line preceded by a JUMP, unless it's a MARK or REPL,
            // because it's unreachable.
            // ---
            // JUMP A
            // COPY 0 X <- unreachable
            // MARK A
            if (lastAddedIndex !== -1 && newNodes[lastAddedIndex].Name === "JUMP") {
                if (node.Name !== "MARK" && node.Name !== "REPL") {
                    changed = true;
                    continue;
                }
            }

            // Remove useless JUMP/MARK pairs separated by 0 or more other
            // MARKS produced from generated code.
            // ---
            // JUMP A <- useless
            // MARK X
            // MARK A
            if (node.Name === "JUMP" && markIndex[node.Arguments[0].Value] > i) {
                let j = i + 1;
                for (; j < markIndex[node.Arguments[0].Value]; j++) {
                    if (nodes[j].Name === "MARK" || nodes[j].Name === "REPL") {
                        break;
                    }
                }
                if (j === markIndex[node.Arguments[0].Value]) {
                    // Remove all nodes up to but not including MARK
                    i = j - 1;
                    changed = true;
                    continue;
                }
            }

            newNodes.push(node);
        }

        if (!changed) {
            break;
        }

        nodes = newNodes;
        iterations++;
    }

    return [nodes, iterations];
}

class StringWriter {
    private content: string;

    constructor() {
        this.content = "";
    }

    writeString(str: string) {
        this.content += str;
    }

    toString(): string {
        return this.content;
    }
}

function serialize(nodes: NodeList): string {
    const sb = new StringWriter();
    nodes.write(sb);
    return sb.toString();
}

export function compile(input: string): [string, Error] {
    try {
        const tokens = tokenize(input.trim().toLocaleUpperCase());
        console.log(tokens);
        const parser = new Parser(tokens);
        const [nodes, err1] = parser.parse();
        if (err1 !== null) {
            return ["", new Error(`Parse error: ${err1.message}`)];
        }
        console.log(nodes);
        const [optimizedNodes] = optimize(nodes);
        console.log(optimizedNodes);
        const output = serialize(optimizedNodes);
        return [output, null];
    } catch (err2) {
        console.log(err2);
        return ["", new Error(`Compile error: ${err2.message}`)];
    }
}
