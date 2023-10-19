enum TokenType {
    Number = "NUMBER",
    Unit = "UNIT",
    Slash = "SLASH",
    Plus = "PLUS",
    Minus = "MINUS",
    As = "AS",
    Now = "NOW",
    Today = "TODAY",
}

class Token {
    constructor(
        public tokenType: TokenType,
        public value: string = "",
    ) {}

    toString() {
        if (this.value) {
            return `Token(${this.tokenType}, ${this.value})`;
        }
        return `Token(${this.tokenType})`;
    }
}

enum UnitType {
    Millisecond = "MILLISECOND",
    Second = "SECOND",
    Minute = "MINUTE",
    Hour = "HOUR",
    Day = "DAY",
    Week = "WEEK",
    Month = "MONTH",
    Year = "YEAR",
}

// Register unit keywords
const UNIT_TO_ENUM: { [key: string]: UnitType } = {
    seconds: UnitType.Second,
    minutes: UnitType.Minute,
    milliseconds: UnitType.Millisecond, // put after "minute" so "1 m" matches minute
    hours: UnitType.Hour,
    days: UnitType.Day,
    weeks: UnitType.Week,
    months: UnitType.Month,
    years: UnitType.Year,
};
// Register unit aliases (years -> year, yea, ye, y)
for (let k in UNIT_TO_ENUM) {
    for (let i = 0; i < k.length; i++) {
        const alias = k.substr(0, i + 1);
        UNIT_TO_ENUM[alias] = UNIT_TO_ENUM[k];
    }
}

const MILLISECOND = 1;
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30.436875;
const YEAR = DAY * 365.25;

function getConversionFactor(unit: UnitType): number {
    switch (unit) {
        case UnitType.Millisecond:
            return MILLISECOND;
        case UnitType.Second:
            return SECOND;
        case UnitType.Minute:
            return MINUTE;
        case UnitType.Hour:
            return HOUR;
        case UnitType.Day:
            return DAY;
        case UnitType.Week:
            return WEEK;
        case UnitType.Month:
            return MONTH;
        case UnitType.Year:
            return YEAR;
        default:
            throw new ParseError(`unexpected unit: ${unit}`);
    }
}

interface DateCalcNode {}

class DateNode implements DateCalcNode {
    constructor(
        public m: Token,
        public d: Token,
        public y: Token,
    ) {}

    toString(): string {
        return `DateNode(${this.m}, ${this.d}, ${this.y})`;
    }
}

class DeltaNode implements DateCalcNode {
    constructor(
        public amount: Token,
        public unit: Token,
    ) {}

    toString(): string {
        return `DeltaNode(${this.amount}, ${this.unit})`;
    }
}

class PlusNode implements DateCalcNode {
    constructor(
        public left: DateCalcNode,
        public right: DateCalcNode,
    ) {}

    toString(): string {
        return `PlusNode(${this.left}, ${this.right})`;
    }
}

class MinusNode implements DateCalcNode {
    constructor(
        public left: DateCalcNode,
        public right: DateCalcNode,
    ) {}

    toString(): string {
        return `MinusNode(${this.left}, ${this.right})`;
    }
}

class NowNode implements DateCalcNode {
    constructor() {}

    toString(): string {
        return `NowNode()`;
    }
}

class TodayNode implements DateCalcNode {
    constructor() {}

    toString(): string {
        return `TodayNode()`;
    }
}

interface Indexable<T> {
    [index: number]: T;
    length: number;
}

class Iterator<T> {
    index: number = -1;

    constructor(private source: Indexable<T>) {}

    hasNext(): boolean {
        return this.index < this.source.length - 1;
    }

    next(): T {
        return this.source[++this.index];
    }

    current(): T {
        return this.source[this.index];
    }

    peek(): T {
        return this.source[this.index + 1];
    }
}

class TokenIterator extends Iterator<Token> {
    expect(tokenType: TokenType): Token {
        if (!this.hasNext()) {
            throw new ParseError(`expected "${tokenType}" but got nothing`);
        }
        let token = super.next();
        if (token.tokenType != tokenType) {
            throw new ParseError(`expected "${tokenType}" but got "${token.tokenType}"`);
        }
        return token;
    }
}

class ParseError {
    constructor(public readonly message: string) {}

    toString(): string {
        return this.message;
    }
}

function isAlpha(c: string): boolean {
    return /[a-z]/.test(c);
}

function isDigit(c: string): boolean {
    return /[0-9]/.test(c);
}

export function tokenize(program: string): Token[] {
    if (!program) {
        return null;
    }

    let tokens: Token[] = [];
    let stream = new Iterator(program);

    function scanWord(): string {
        let word = stream.current();
        while (stream.hasNext() && isAlpha(stream.peek())) {
            word += stream.next();
        }
        return word;
    }

    function scanNumber(): string {
        let num = stream.current();
        while (stream.hasNext() && isDigit(stream.peek())) {
            num += stream.next();
        }
        return num;
    }

    while (stream.hasNext()) {
        let c = stream.next();
        if (c == " ") {
            continue;
        } else if (c == "/") {
            tokens.push(new Token(TokenType.Slash));
        } else if (c == "+") {
            tokens.push(new Token(TokenType.Plus));
        } else if (c == "-") {
            tokens.push(new Token(TokenType.Minus));
        } else if (isAlpha(c)) {
            let word = scanWord().toLowerCase();
            if (word == "as" || word == "to") {
                tokens.push(new Token(TokenType.As));
            } else if (word == "now") {
                tokens.push(new Token(TokenType.Now));
            } else if (word == "today") {
                tokens.push(new Token(TokenType.Today));
            } else if (word in UNIT_TO_ENUM) {
                tokens.push(new Token(TokenType.Unit, UNIT_TO_ENUM[word]));
            } else {
                throw new ParseError(`unexpected unit: ${word}`);
            }
        } else if (isDigit(c)) {
            tokens.push(new Token(TokenType.Number, scanNumber()));
        } else {
            throw new ParseError(`unexpected character: ${c}`);
        }
    }

    return tokens;
}

export function parse(tokens: Token[]): DateCalcNode {
    if (!tokens) {
        return null;
    }

    let stream = new TokenIterator(tokens);

    function parseProgram(): DateCalcNode {
        let dateOrDelta = parseDateOrDelta();
        return parseDateExpr(dateOrDelta);
    }

    function parseDateOrDelta(): DateCalcNode {
        let nextToken = stream.peek();
        if (!nextToken) {
            throw new ParseError(`unexpected end of token stream`);
        }
        if (nextToken.tokenType == TokenType.Now) {
            stream.expect(TokenType.Now);
            return new NowNode();
        } else if (nextToken.tokenType == TokenType.Today) {
            stream.expect(TokenType.Today);
            return new TodayNode();
        } else if (nextToken.tokenType == TokenType.Number) {
            stream.expect(TokenType.Number);
            if (stream.hasNext()) {
                let nextToken = stream.peek();
                if (nextToken.tokenType == TokenType.Slash) {
                    return parseDate();
                } else if (nextToken.tokenType == TokenType.Unit) {
                    return parseDelta();
                }
                throw new ParseError(`unexpected token: ${nextToken}`);
            }
        }
        throw new ParseError(`unexpected token: ${nextToken}`);
    }

    function parseDate(): DateCalcNode {
        let m = stream.current();
        stream.expect(TokenType.Slash);
        let d = stream.expect(TokenType.Number);
        stream.expect(TokenType.Slash);
        let y = stream.expect(TokenType.Number);
        return new DateNode(m, d, y);
    }

    function parseDelta(): DateCalcNode {
        let amount = stream.current();
        let unit = stream.expect(TokenType.Unit);
        return new DeltaNode(amount, unit);
    }

    function parseDateExpr(left: DateCalcNode): DateCalcNode {
        if (stream.hasNext()) {
            let nextToken = stream.next();
            if (nextToken.tokenType == TokenType.Plus) {
                let dateOrDelta = parseDateOrDelta();
                return parseDateExpr(new PlusNode(left, dateOrDelta));
            } else if (nextToken.tokenType == TokenType.Minus) {
                let dateOrDelta = parseDateOrDelta();
                return parseDateExpr(new MinusNode(left, dateOrDelta));
            } else if (nextToken.tokenType == TokenType.As) {
                return parseCastExpr(left);
            }
            throw new ParseError(`unexpected token: ${nextToken}`);
        }
        return left;
    }

    function parseCastExpr(left: DateCalcNode): DateCalcNode {
        let unit = stream.expect(TokenType.Unit);
        let delta = new DeltaNode(new Token(TokenType.Number, "0"), unit);
        return parseDateExpr(new PlusNode(delta, left));
    }

    let result = parseProgram();
    if (stream.hasNext()) {
        throw new ParseError(`unexpected tokens after program end: ${tokens.splice(stream.index + 1)}`);
    }
    return result;
}

class Delta {
    constructor(
        public amount: number,
        public unit: UnitType,
    ) {}

    toUnit(unit: UnitType): Delta {
        let factor = getConversionFactor(this.unit) / getConversionFactor(unit);
        return new Delta(this.amount * factor, unit);
    }

    toString(): string {
        let unit = this.unit.toLowerCase();
        if (this.amount != 1) {
            unit += "s";
        }
        return `${this.amount} ${unit}`;
    }
}

function dateMinusDate(date: Date, other: Date): Delta {
    let ms = Math.abs(date.getTime() - other.getTime());
    let amount = ms / getConversionFactor(UnitType.Day);
    return new Delta(amount, UnitType.Day);
}

function datePlusDelta(date: Date, delta: Delta): Date {
    return new Date(date.getTime() + delta.toUnit(UnitType.Millisecond).amount);
}

function dateMinusDelta(date: Date, delta: Delta): Date {
    return new Date(date.getTime() - delta.toUnit(UnitType.Millisecond).amount);
}

function deltaPlusDelta(left: Delta, right: Delta): Delta {
    return new Delta(left.amount + right.toUnit(left.unit).amount, left.unit);
}

function deltaMinusDelta(left: Delta, right: Delta): Delta {
    return new Delta(left.amount - right.toUnit(left.unit).amount, left.unit);
}

export function resolve(node: DateCalcNode): Date | Delta {
    function visit(node: DateCalcNode): Date | Delta {
        if (node instanceof DateNode) {
            return visitDateNode(node);
        } else if (node instanceof DeltaNode) {
            return visitDeltaNode(node);
        } else if (node instanceof PlusNode) {
            return visitPlusNode(node);
        } else if (node instanceof MinusNode) {
            return visitMinusNode(node);
        } else if (node instanceof NowNode) {
            return visitNowNode(node);
        } else if (node instanceof TodayNode) {
            return visitTodayNode(node);
        }
        throw new ParseError(`unexpected node: ${node}`);
    }

    function visitDateNode(date: DateNode): Date {
        let m = parseInt(date.m.value, 10);
        let d = parseInt(date.d.value, 10);
        let y = parseInt(date.y.value, 10);
        return new Date(y, m - 1, d);
    }

    function visitNowNode(node: NowNode): Date {
        return new Date();
    }

    function visitTodayNode(node: TodayNode): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function visitDeltaNode(delta: DeltaNode): Delta {
        let amount = parseInt(delta.amount.value, 10);
        let unit = delta.unit.value as UnitType;
        return new Delta(amount, unit);
    }

    function visitPlusNode(op: PlusNode): Date | Delta {
        let left = visit(op.left);
        let right = visit(op.right);
        if (left instanceof Date && right instanceof Date) {
            throw new ParseError(`adding dates is not supported`);
        } else if (left instanceof Date && right instanceof Delta) {
            return datePlusDelta(left, right);
        } else if (left instanceof Delta && right instanceof Date) {
            return datePlusDelta(right, left);
        } else if (left instanceof Delta && right instanceof Delta) {
            return deltaPlusDelta(left, right);
        }
        throw new ParseError(`expected date or delta but got "${left}" and "${right}"`);
    }

    function visitMinusNode(op: MinusNode): Date | Delta {
        let left = visit(op.left);
        let right = visit(op.right);
        if (left instanceof Date && right instanceof Date) {
            return dateMinusDate(left, right);
        } else if (left instanceof Date && right instanceof Delta) {
            return dateMinusDelta(left, right);
        } else if (left instanceof Delta && right instanceof Date) {
            throw new ParseError(`subtracting date from delta is not supported`);
        } else if (left instanceof Delta && right instanceof Delta) {
            return deltaMinusDelta(left, right);
        }
        throw new ParseError(`expected date or delta but got "${left}" and "${right}"`);
    }

    return visit(node);
}

export function formatTokens(tokens: Token[]): string {
    if (!tokens) {
        return "";
    }
    return tokens
        .map(function (t) {
            return "- " + t;
        })
        .join("\n");
}

export function formatAst(node: DateCalcNode): string {
    if (!node) {
        return "";
    }

    const buf: string[] = [];

    function writeIndent(line: string, indent: number) {
        let prefix = "";
        while (indent > 1) {
            prefix += "    ";
            indent--;
        }
        if (indent) {
            prefix += "|---";
        }
        buf.push(prefix + line);
    }

    function visit(node: DateCalcNode, indent: number) {
        if (node instanceof DateNode) {
            visitDateNode(node, indent);
        } else if (node instanceof DeltaNode) {
            visitDeltaNode(node, indent);
        } else if (node instanceof PlusNode) {
            visitPlusNode(node, indent);
        } else if (node instanceof MinusNode) {
            visitMinusNode(node, indent);
        } else if (node instanceof NowNode) {
            visitNowNode(node, indent);
        } else if (node instanceof TodayNode) {
            visitTodayNode(node, indent);
        } else {
            throw new ParseError(`unexpected node: ${node}`);
        }
    }

    function visitDateNode(date: DateNode, indent: number) {
        writeIndent("DateNode", indent);
        writeIndent(date.m.toString(), indent + 1);
        writeIndent(date.d.toString(), indent + 1);
        writeIndent(date.y.toString(), indent + 1);
    }

    function visitDeltaNode(delta: DeltaNode, indent: number) {
        writeIndent("DeltaNode", indent);
        writeIndent(delta.amount.toString(), indent + 1);
        writeIndent(delta.unit.toString(), indent + 1);
    }

    function visitPlusNode(op: PlusNode, indent: number) {
        writeIndent("PlusNode", indent);
        visit(op.left, indent + 1);
        visit(op.right, indent + 1);
    }

    function visitMinusNode(op: MinusNode, indent: number) {
        writeIndent("MinusNode", indent);
        visit(op.left, indent + 1);
        visit(op.right, indent + 1);
    }

    function visitNowNode(node: NowNode, indent: number) {
        writeIndent("NowNode", indent);
    }

    function visitTodayNode(node: TodayNode, indent: number) {
        writeIndent("TodayNode", indent);
    }

    visit(node, 0);
    return buf.join("\n");
}
