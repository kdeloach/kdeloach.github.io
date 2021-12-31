"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TokenType;
(function (TokenType) {
    TokenType["Number"] = "NUMBER";
    TokenType["Unit"] = "UNIT";
    TokenType["Slash"] = "SLASH";
    TokenType["Plus"] = "PLUS";
    TokenType["Minus"] = "MINUS";
    TokenType["As"] = "AS";
})(TokenType || (TokenType = {}));
var Token = /** @class */ (function () {
    function Token(tokenType, value) {
        if (value === void 0) { value = ""; }
        this.tokenType = tokenType;
        this.value = value;
    }
    Token.prototype.toString = function () {
        if (this.value) {
            return "Token(" + this.tokenType + ", " + this.value + ")";
        }
        return "Token(" + this.tokenType + ")";
    };
    return Token;
}());
///
var UnitType;
(function (UnitType) {
    UnitType["Millisecond"] = "MILLISECOND";
    UnitType["Second"] = "SECOND";
    UnitType["Minute"] = "MINUTE";
    UnitType["Hour"] = "HOUR";
    UnitType["Day"] = "DAY";
    UnitType["Week"] = "WEEK";
    UnitType["Month"] = "MONTH";
    UnitType["Year"] = "YEAR";
})(UnitType || (UnitType = {}));
var UNIT_TO_ENUM = {
    millisecond: UnitType.Millisecond,
    second: UnitType.Second,
    minute: UnitType.Minute,
    hour: UnitType.Hour,
    day: UnitType.Day,
    week: UnitType.Week,
    month: UnitType.Month,
    year: UnitType.Year,
};
for (var k in UNIT_TO_ENUM) {
    UNIT_TO_ENUM[k + "s"] = UNIT_TO_ENUM[k];
}
var MILLISECOND = 1;
var SECOND = 1000;
var MINUTE = SECOND * 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30.436875;
var YEAR = DAY * 365.25;
function getConversionFactor(unit) {
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
            throw new ParseError("unexpected unit: " + unit);
    }
}
var DateNode = /** @class */ (function () {
    function DateNode(m, d, y) {
        this.m = m;
        this.d = d;
        this.y = y;
    }
    DateNode.prototype.toString = function () {
        return "DateNode(" + this.m + ", " + this.d + ", " + this.y + ")";
    };
    return DateNode;
}());
var DeltaNode = /** @class */ (function () {
    function DeltaNode(amount, unit) {
        this.amount = amount;
        this.unit = unit;
    }
    DeltaNode.prototype.toString = function () {
        return "DeltaNode(" + this.amount + ", " + this.unit + ")";
    };
    return DeltaNode;
}());
var PlusNode = /** @class */ (function () {
    function PlusNode(left, right) {
        this.left = left;
        this.right = right;
    }
    PlusNode.prototype.toString = function () {
        return "PlusNode(" + this.left + ", " + this.right + ")";
    };
    return PlusNode;
}());
var MinusNode = /** @class */ (function () {
    function MinusNode(left, right) {
        this.left = left;
        this.right = right;
    }
    MinusNode.prototype.toString = function () {
        return "MinusNode(" + this.left + ", " + this.right + ")";
    };
    return MinusNode;
}());
var Iterator = /** @class */ (function () {
    function Iterator(source) {
        this.source = source;
        this.index = -1;
    }
    Iterator.prototype.hasNext = function () {
        return this.index < this.source.length - 1;
    };
    Iterator.prototype.next = function () {
        return this.source[++this.index];
    };
    Iterator.prototype.current = function () {
        return this.source[this.index];
    };
    Iterator.prototype.peek = function () {
        return this.source[this.index + 1];
    };
    return Iterator;
}());
var TokenIterator = /** @class */ (function (_super) {
    __extends(TokenIterator, _super);
    function TokenIterator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TokenIterator.prototype.expect = function (tokenType) {
        if (!this.hasNext()) {
            throw new ParseError("expected \"" + tokenType + "\" but got nothing");
        }
        var token = _super.prototype.next.call(this);
        if (token.tokenType != tokenType) {
            throw new ParseError("expected \"" + tokenType + "\" but got \"" + token.tokenType + "\"");
        }
        return token;
    };
    return TokenIterator;
}(Iterator));
var ParseError = /** @class */ (function () {
    function ParseError(message) {
        this.message = message;
    }
    ParseError.prototype.toString = function () {
        return this.message;
    };
    return ParseError;
}());
function isAlpha(c) {
    return /[a-z]/.test(c);
}
function isDigit(c) {
    return /[0-9]/.test(c);
}
function tokenize(program) {
    var tokens = [];
    var stream = new Iterator(program);
    function scanWord() {
        var word = stream.current();
        while (stream.hasNext() && isAlpha(stream.peek())) {
            word += stream.next();
        }
        return word;
    }
    function scanNumber() {
        var num = stream.current();
        while (stream.hasNext() && isDigit(stream.peek())) {
            num += stream.next();
        }
        return num;
    }
    while (stream.hasNext()) {
        var c = stream.next();
        if (c == " ") {
            continue;
        }
        else if (c == "/") {
            tokens.push(new Token(TokenType.Slash));
        }
        else if (c == "+") {
            tokens.push(new Token(TokenType.Plus));
        }
        else if (c == "-") {
            tokens.push(new Token(TokenType.Minus));
        }
        else if (isAlpha(c)) {
            var word = scanWord().toLowerCase();
            if (word == "as") {
                tokens.push(new Token(TokenType.As));
            }
            else if (word in UNIT_TO_ENUM) {
                tokens.push(new Token(TokenType.Unit, UNIT_TO_ENUM[word]));
            }
            else {
                throw new ParseError("unexpected unit: " + word);
            }
        }
        else if (isDigit(c)) {
            tokens.push(new Token(TokenType.Number, scanNumber()));
        }
        else {
            throw new ParseError("unexpected character: " + c);
        }
    }
    return tokens;
}
function parse(tokens) {
    var stream = new TokenIterator(tokens);
    function parseProgram() {
        var dateOrDelta = parseDateOrDelta();
        return parseDateExpr(dateOrDelta);
    }
    function parseDateOrDelta() {
        var token = stream.expect(TokenType.Number);
        if (stream.hasNext()) {
            var nextToken = stream.peek();
            if (nextToken.tokenType == TokenType.Slash) {
                return parseDate();
            }
            else if (nextToken.tokenType == TokenType.Unit) {
                return parseDelta();
            }
            throw new ParseError("unexpected token: " + nextToken);
        }
        throw new ParseError("unexpected token: " + token);
    }
    function parseDate() {
        var m = stream.current();
        stream.expect(TokenType.Slash);
        var d = stream.expect(TokenType.Number);
        stream.expect(TokenType.Slash);
        var y = stream.expect(TokenType.Number);
        return new DateNode(m, d, y);
    }
    function parseDelta() {
        var amount = stream.current();
        var unit = stream.expect(TokenType.Unit);
        return new DeltaNode(amount, unit);
    }
    function parseDateExpr(left) {
        if (stream.hasNext()) {
            var nextToken = stream.next();
            if (nextToken.tokenType == TokenType.Plus) {
                var dateOrDelta = parseDateOrDelta();
                return parseDateExpr(new PlusNode(left, dateOrDelta));
            }
            else if (nextToken.tokenType == TokenType.Minus) {
                var dateOrDelta = parseDateOrDelta();
                return parseDateExpr(new MinusNode(left, dateOrDelta));
            }
            else if (nextToken.tokenType == TokenType.As) {
                return parseCastExpr(left);
            }
            throw new ParseError("unexpected token: " + nextToken);
        }
        return left;
    }
    function parseCastExpr(left) {
        var unit = stream.expect(TokenType.Unit);
        var delta = new DeltaNode(new Token(TokenType.Number, "0"), unit);
        return parseDateExpr(new PlusNode(left, delta));
    }
    var result = parseProgram();
    if (stream.hasNext()) {
        throw new ParseError("unexpected tokens after program end: " + tokens.splice(stream.index + 1));
    }
    return result;
}
///
var Delta = /** @class */ (function () {
    function Delta(amount, unit) {
        this.amount = amount;
        this.unit = unit;
    }
    Delta.prototype.toUnit = function (unit) {
        var factor = getConversionFactor(this.unit) / getConversionFactor(unit);
        return new Delta(this.amount * factor, unit);
    };
    Delta.prototype.toString = function () {
        var unit = this.unit.toLowerCase();
        if (this.amount != 1) {
            unit += "s";
        }
        return this.amount + " " + unit;
    };
    return Delta;
}());
function dateMinusDate(date, other) {
    var ms = Math.abs(date.getTime() - other.getTime());
    var amount = ms / getConversionFactor(UnitType.Day);
    return new Delta(amount, UnitType.Day);
}
function datePlusDelta(date, delta) {
    return new Date(date.getTime() + delta.toUnit(UnitType.Millisecond).amount);
}
function dateMinusDelta(date, delta) {
    return new Date(date.getTime() - delta.toUnit(UnitType.Millisecond).amount);
}
function deltaPlusDelta(left, right) {
    return new Delta(left.toUnit(right.unit).amount + right.amount, right.unit);
}
function deltaMinusDelta(left, right) {
    return new Delta(left.toUnit(right.unit).amount - right.amount, right.unit);
}
function resolve(node) {
    function visit(node) {
        if (node instanceof DateNode) {
            return visitDateNode(node);
        }
        else if (node instanceof DeltaNode) {
            return visitDeltaNode(node);
        }
        else if (node instanceof PlusNode) {
            return visitPlusNode(node);
        }
        else if (node instanceof MinusNode) {
            return visitMinusNode(node);
        }
        throw new ParseError("unexpected node: " + node);
    }
    function visitDateNode(date) {
        var m = parseInt(date.m.value, 10);
        var d = parseInt(date.d.value, 10);
        var y = parseInt(date.y.value, 10);
        return new Date(y, m - 1, d);
    }
    function visitDeltaNode(delta) {
        var amount = parseInt(delta.amount.value, 10);
        var unit = delta.unit.value;
        return new Delta(amount, unit);
    }
    function visitPlusNode(op) {
        var left = visit(op.left);
        var right = visit(op.right);
        if (left instanceof Date && right instanceof Date) {
            throw new ParseError("adding dates is not supported");
        }
        else if (left instanceof Date && right instanceof Delta) {
            return datePlusDelta(left, right);
        }
        else if (left instanceof Delta && right instanceof Date) {
            return datePlusDelta(right, left);
        }
        else if (left instanceof Delta && right instanceof Delta) {
            return deltaPlusDelta(left, right);
        }
        throw new ParseError("expected date or delta but got \"" + left + "\" and \"" + right + "\"");
    }
    function visitMinusNode(op) {
        var left = visit(op.left);
        var right = visit(op.right);
        if (left instanceof Date && right instanceof Date) {
            return dateMinusDate(left, right);
        }
        else if (left instanceof Date && right instanceof Delta) {
            return dateMinusDelta(left, right);
        }
        else if (left instanceof Delta && right instanceof Date) {
            throw new ParseError("subtracting date from delta is not supported");
        }
        else if (left instanceof Delta && right instanceof Delta) {
            return deltaMinusDelta(left, right);
        }
        throw new ParseError("expected date or delta but got \"" + left + "\" and \"" + right + "\"");
    }
    return visit(node);
}
function print(node) {
    var buf = [];
    function writeIndent(line, indent) {
        var prefix = "";
        while (indent > 1) {
            prefix += "    ";
            indent--;
        }
        if (indent) {
            prefix += "|---";
        }
        buf.push(prefix + line);
    }
    function visit(node, indent) {
        if (node instanceof DateNode) {
            visitDateNode(node, indent);
        }
        else if (node instanceof DeltaNode) {
            visitDeltaNode(node, indent);
        }
        else if (node instanceof PlusNode) {
            visitPlusNode(node, indent);
        }
        else if (node instanceof MinusNode) {
            visitMinusNode(node, indent);
        }
        else {
            throw new ParseError("unexpected node: " + node);
        }
    }
    function visitDateNode(date, indent) {
        writeIndent("DateNode", indent);
        writeIndent(date.m.toString(), indent + 1);
        writeIndent(date.d.toString(), indent + 1);
        writeIndent(date.y.toString(), indent + 1);
    }
    function visitDeltaNode(delta, indent) {
        writeIndent("DeltaNode", indent);
        writeIndent(delta.amount.toString(), indent + 1);
        writeIndent(delta.unit.toString(), indent + 1);
    }
    function visitPlusNode(op, indent) {
        writeIndent("PlusNode", indent);
        visit(op.left, indent + 1);
        visit(op.right, indent + 1);
    }
    function visitMinusNode(op, indent) {
        writeIndent("MinusNode", indent);
        visit(op.left, indent + 1);
        visit(op.right, indent + 1);
    }
    visit(node, 0);
    return buf.join("\n");
}
