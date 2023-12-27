const fullDateTimeFormat: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    hourCycle: "h23",
};

const shortDateTimeFormat: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
};

enum TokenType {
    Date = "DATE",
    Duration = "DURATION",
    Cast = "CAST",
    Op = "OP",
    Number = "NUMBER",
    EOF = "EOF",
}

const OP_PREC: { [key: string]: number } = {
    "+": 0,
    "-": 1,
};

class Token {
    constructor(
        public tokenType: TokenType,
        public value: any = null,
    ) {}

    toString() {
        if (this.value) {
            if (this.value instanceof Date) {
                return `Token(${this.tokenType}, ${formatDate(this.value)})`;
            } else {
                return `Token(${this.tokenType}, ${this.value})`;
            }
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
    milliseconds: UnitType.Millisecond,
    seconds: UnitType.Second,
    hours: UnitType.Hour,
    days: UnitType.Day,
    weeks: UnitType.Week,
    months: UnitType.Month,
    years: UnitType.Year,
    minutes: UnitType.Minute, // put last so "m" alias matches this instead of milliseconds/months
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

type DateCalcNode = DateNode | DurationNode | PlusNode | MinusNode | CastNode;
type DateOrDuration = Date | Duration;

class DateNode {
    constructor(public date: Date) {}

    toString(): string {
        return `DateNode(${formatDate(this.date)})`;
    }
}

class PlusNode {
    constructor(
        public left: DateCalcNode,
        public right: DateCalcNode,
    ) {}

    toString(): string {
        return `PlusNode(${this.left}, ${this.right})`;
    }
}

class MinusNode {
    constructor(
        public left: DateCalcNode,
        public right: DateCalcNode,
    ) {}

    toString(): string {
        return `MinusNode(${this.left}, ${this.right})`;
    }
}

class DurationNode {
    constructor(public duration: Duration) {}

    toString(): string {
        return `DurationNode(${this.duration})`;
    }
}

class CastNode {
    constructor(
        public left: DateCalcNode,
        public unit: UnitType,
    ) {}

    toString(): string {
        return `CastNode(${this.left}, ${this.unit})`;
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

export function tokenize(input: string): Token[] {
    const tokens: Token[] = [];

    let index = 0;
    const current = () => input[index];
    const consume = () => input[index++];
    const isEOF = () => index >= input.length;

    function expect(want: string): ParseError {
        const got = consume();
        if (got != want) {
            return new ParseError(`expected "${want}" but got "${got}"`);
        }
        return null;
    }

    function scanWord(): [string, ParseError] {
        if (isEOF()) {
            return ["", new ParseError(`error parsing word: unexpected end of program`)];
        }
        let word = consume();
        while (!isEOF() && isAlpha(current())) {
            word += consume();
        }
        return [word.toLowerCase(), null];
    }

    function scanNumber(): [number, ParseError] {
        if (isEOF()) {
            return [0, new ParseError(`error parsing number: unexpected end of program`)];
        }
        if (!isDigit(current())) {
            return [0, new ParseError(`expected digit but got "${current()}"`)];
        }
        let word = consume();
        while (!isEOF() && isDigit(current())) {
            word += consume();
        }
        const num = parseInt(word, 10);
        return [num, null];
    }

    function scanUnit(): [UnitType, ParseError] {
        const [word, err] = scanWord();
        if (err) {
            return [null, new ParseError(`error parsing unit: ${err.message}`)];
        }
        if (word in UNIT_TO_ENUM) {
            return [UNIT_TO_ENUM[word], null];
        }
        return [null, new ParseError(`invalid unit: ${word}`)];
    }

    function skipWhitespace() {
        while (!isEOF() && current() === " ") {
            consume();
        }
    }

    while (!isEOF()) {
        let c = current();
        if (c == " ") {
            skipWhitespace();
        } else if (c == "+" || c == "-") {
            tokens.push(new Token(TokenType.Op, c));
            consume();
        } else if (isAlpha(c)) {
            const [word, err1] = scanWord();
            if (err1) {
                throw err1;
            }
            skipWhitespace();
            if (word == "now" || word == "today") {
                tokens.push(new Token(TokenType.Date, word));
            } else if (word == "as" || word == "to") {
                if (isAlpha(current())) {
                    const [unit, err2] = scanUnit();
                    if (err2) {
                        throw new ParseError(`error parsing cast: ${err2.message}`);
                    }
                    tokens.push(new Token(TokenType.Cast, unit));
                } else {
                    // TODO: continue?
                    throw new ParseError(`unexpected character after cast token: ${current()}`);
                }
            } else {
                // TODO: continue?
                throw new ParseError(`unexpected word: ${word}`);
            }
        } else if (isDigit(c)) {
            const [m, err1] = scanNumber();
            if (err1) {
                throw err1;
            }
            skipWhitespace();
            c = current();
            if (c === "/") {
                consume();
                const [d, err2] = scanNumber();
                if (err2) {
                    throw new ParseError(`error parsing date: ${err2.message}`);
                }
                const err3 = expect("/");
                if (err3) {
                    throw new ParseError(`error parsing date: ${err3.message}`);
                }
                const [y, err4] = scanNumber();
                if (err4) {
                    throw new ParseError(`error parsing date: ${err4.message}`);
                }
                const date = new Date(y, m - 1, d);
                tokens.push(new Token(TokenType.Date, date));
            } else if (isAlpha(c)) {
                const [unit, err2] = scanUnit();
                if (err2) {
                    throw new ParseError(`error parsing duration: ${err2.message}`);
                }
                const duration = new Duration(m, unit);
                tokens.push(new Token(TokenType.Duration, duration));
            } else {
                tokens.push(new Token(TokenType.Number, m));
            }
        } else {
            throw new ParseError(`unexpected character: ${c}`);
        }
    }

    tokens.push(new Token(TokenType.EOF));
    return tokens;
}

export function parse(tokens: Token[]): DateCalcNode {
    if (!tokens) {
        return null;
    }

    let index = 0;
    const current = () => tokens[index];
    const consume = () => tokens[index++];
    const isEOF = () => current().tokenType === TokenType.EOF;

    function expect(tokenType: TokenType): [Token, ParseError] {
        const token = consume();
        if (token.tokenType != tokenType) {
            return [null, new ParseError(`expected "${tokenType}" but got "${token.tokenType}"`)];
        }
        return [token, null];
    }

    function parseProgram(): DateCalcNode {
        if (isEOF()) {
            throw new ParseError(`error parsing program: not enough tokens`);
        }

        // Parse primary date/duration expression
        const left = parseExpr(parseDateOrDuration(), 0);

        // Merge (overwrite) subsequent cast nodes
        let castLeft = left;
        while (current().tokenType === TokenType.Cast) {
            const cast = consume();
            castLeft = new CastNode(left, cast.value);
        }
        return castLeft;
    }

    // Ref: https://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
    function parseExpr(left: DateCalcNode, minPrec: number): DateCalcNode {
        while (current().tokenType === TokenType.Op && OP_PREC[current().value] >= minPrec) {
            const op = consume();

            let right = parseDateOrDuration();
            while (current().tokenType === TokenType.Op && OP_PREC[current().value] > OP_PREC[op.value]) {
                right = parseExpr(right, minPrec + 1);
            }

            if (op.value == "+") {
                left = new PlusNode(left, right);
            } else if (op.value == "-") {
                left = new MinusNode(left, right);
            } else {
                throw new ParseError(`invalid op: ${op.value}`);
            }
        }
        return left;
    }

    function parseDateOrDuration(): DateCalcNode {
        if (current().tokenType === TokenType.Date) {
            return parseDate();
        } else if (current().tokenType === TokenType.Duration) {
            return parseDuration();
        }
        throw new ParseError(`expected date or duration but got "${current()}"`);
    }

    const now = new Date();
    const today = dateWithoutTime(now);

    function parseDate(): DateNode {
        const [date, err] = expect(TokenType.Date);
        if (err) {
            throw new ParseError(`error parsing date: ${err.message}`);
        }
        if (date.value instanceof Date) {
            return new DateNode(date.value);
        } else if (date.value === "now") {
            return new DateNode(now);
        } else if (date.value === "today") {
            return new DateNode(today);
        }
        throw new ParseError(`error parsing date: expected "now", "today", or "YYYY/MM/DD" but got "${date.value}"`);
    }

    function parseDuration(): DurationNode {
        const [duration, err] = expect(TokenType.Duration);
        if (err) {
            throw new ParseError(`error parsing date: ${err.message}`);
        }
        return new DurationNode(duration.value);
    }

    const result = parseProgram();
    const [_, err] = expect(TokenType.EOF);
    if (err) {
        throw err;
    }
    return result;
}

class Duration {
    constructor(
        public amount: number,
        public unit: UnitType,
    ) {}

    toUnit(unit: UnitType): Duration {
        let factor = getConversionFactor(this.unit) / getConversionFactor(unit);
        return new Duration(this.amount * factor, unit);
    }

    toString(): string {
        let unit = this.unit.toLowerCase();
        if (this.amount != 1) {
            unit += "s";
        }
        return `${this.amount} ${unit}`;
    }
}

function dateMinusDate(date: Date, other: Date): Duration {
    let ms = Math.abs(date.getTime() - other.getTime());
    let amount = ms / getConversionFactor(UnitType.Day);
    return new Duration(amount, UnitType.Day);
}

function datePlusDuration(date: Date, duration: Duration): Date {
    return new Date(date.getTime() + duration.toUnit(UnitType.Millisecond).amount);
}

function dateMinusDuration(date: Date, duration: Duration): Date {
    return new Date(date.getTime() - duration.toUnit(UnitType.Millisecond).amount);
}

function durationPlusDuration(left: Duration, right: Duration): Duration {
    return new Duration(left.amount + right.toUnit(left.unit).amount, left.unit);
}

function durationMinusDuration(left: Duration, right: Duration): Duration {
    return new Duration(left.amount - right.toUnit(left.unit).amount, left.unit);
}

function isDatetime(dt: Date): boolean {
    const d = dateWithoutTime(dt);
    return dt.getTime() - d.getTime() !== 0;
}

function dateWithoutTime(dt: Date): Date {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function formatDate(d: Date): string {
    if (isDatetime(d)) {
        return d.toLocaleString("en-US", shortDateTimeFormat);
    } else {
        return d.toLocaleDateString("en-US");
    }
}

export function evaluate(node: DateCalcNode): string {
    function visit(node: DateCalcNode): DateOrDuration {
        if (node instanceof DateNode) {
            return node.date;
        } else if (node instanceof DurationNode) {
            return node.duration;
        } else if (node instanceof PlusNode) {
            return visitPlus(node);
        } else if (node instanceof MinusNode) {
            return visitMinus(node);
        } else if (node instanceof CastNode) {
            return visitCast(node);
        }
        throw new ParseError(`eval error: unexpected node: ${node}`);
    }

    function visitPlus(node: PlusNode): DateOrDuration {
        const left = visit(node.left);
        const right = visit(node.right);
        if (left instanceof Date) {
            if (right instanceof Date) {
                throw new ParseError(`adding dates together is not supported`);
            } else if (right instanceof Duration) {
                return datePlusDuration(left, right);
            }
        } else if (left instanceof Duration) {
            if (right instanceof Date) {
                return datePlusDuration(right, left);
            } else if (right instanceof Duration) {
                return durationPlusDuration(left, right);
            }
        }
        throw new ParseError(`can't add ${node.left} to ${node.right}`);
    }

    function visitMinus(node: MinusNode): DateOrDuration {
        const left = visit(node.left);
        const right = visit(node.right);
        if (left instanceof Date) {
            if (right instanceof Date) {
                return dateMinusDate(left, right);
            } else if (right instanceof Duration) {
                return dateMinusDuration(left, right);
            }
        } else if (left instanceof Duration) {
            if (right instanceof Date) {
                throw new ParseError(`subtracting date from duration is not supported`);
            } else if (right instanceof Duration) {
                return durationMinusDuration(left, right);
            }
        }
        throw new ParseError(`can't subtract "${right}" from "${left}"`);
    }

    function visitCast(node: CastNode): DateOrDuration {
        const left = visit(node.left);
        if (left instanceof Duration) {
            return left.toUnit(node.unit);
        }
        throw new ParseError(`can't convert "${left}" to duration`);
    }

    const result = visit(node);
    if (result instanceof Date) {
        return result.toLocaleString("en-US", fullDateTimeFormat);
    } else {
        return result.toString();
    }
}

export function formatTokens(tokens: Token[]): string {
    if (!tokens) {
        return "";
    }
    return tokens.map((t) => "- " + t).join("\n");
}

export function formatProgram(node: DateCalcNode): string {
    let sb: string[] = [];

    function writeIndent(indent: number) {
        for (let i = 0; i < indent; i++) {
            sb.push("  ");
        }
    }

    function write(str: string) {
        sb.push(str);
    }

    function visit(node: DateCalcNode, indent: number = 0) {
        writeIndent(indent);
        if (node instanceof DateNode) {
            write(node.toString());
        } else if (node instanceof DurationNode) {
            write(node.toString());
        } else if (node instanceof PlusNode) {
            write(`PlusNode(\n`);
            visit(node.left, indent + 1);
            write(`,\n`);
            visit(node.right, indent + 1);
            write(`)`);
        } else if (node instanceof MinusNode) {
            write(`MinusNode(\n`);
            visit(node.left, indent + 1);
            write(`,\n`);
            visit(node.right, indent + 1);
            write(`)`);
        } else if (node instanceof CastNode) {
            write(`CastNode(\n`);
            visit(node.left, indent + 1);
            write(`,\n`);
            writeIndent(indent + 1);
            write(node.unit.toString());
            write(`)`);
        } else {
            throw new ParseError(`format error: unexpected node: ${node}`);
        }
    }

    visit(node);
    return sb.join("");
}
