---
title: Date Calculator
date: 2021-12-30T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Calculator designed to perform date math operations and unit conversions using natural expressions.
image: /datecalc/preview.png
---

This was an experiment in creating a DSL to handle common date math operations
that I use on a daily basis.  It can calculate date durations and convert
between different units of time.  The implementation uses a recursive descent
parser to convert expressions into an AST and outputs either a native `Date`
object or a `Duration`. My main resource for this project was [Crafting Interpreters][1].

[1]: https://craftinginterpreters.com/

<div id="dateCalcForm" data-component=""></div>

### Syntax

Date calculator syntax in BNF grammar format.

```js
<program> ::= (<dateExpr> | <durationExpr> <castExpr>*)

<dateExpr> ::= <date>
    | <date> (<plus> | <minus>) <durationExpr>

<durationExpr> ::= <duration>
    | <duration> (<plus> | <minus>) <durationExpr>
    | <date> <minus> <dateExpr>

<date> ::= ("now" | "today" | <number> "/" <number> "/" <number>)

<duration> ::= <number> <optWs> <unit>

<castExpr> ::= <ws> ("as" | "to") <ws> <unit>

<unit> ::= ("millisecond" | "second" | "minute" | "hour"
    | "day" | "week" | "month" | "year")

<number> ::= [0-9]+
<plus> ::= <optWs> "+" <optWs>
<minus> ::= <optWs> "-" <optWs>

<ws> ::= " "+
<optWs> ::= " "*
```

### Updates

- 1/25/2024
    -   Added operator precedence
    -   Improved error messages
- 12/27/2023
    -   Improved grammar and refactored parser
- 10/19/2023
    -   Added `now` (ex. `now + 12 hours`)
    -   Added `today` (ex. `today + 30 days`)
    -   Added aliases for units of time (min, m, sec, s, etc.)
    -   Added `to` alias (ex. `1 hour to minutes`)
