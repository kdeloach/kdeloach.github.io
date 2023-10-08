---
title: Date Calculator
date: 2021-12-30
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
---

<div id="dateCalcForm" data-component=""></div>

---

## Syntax

The calculator supports adding and subtracting _date_ and _delta_ objects.

Dates must be in `MM/DD/YYYY` format.

Deltas must be in `<number> <unit>` format where `<number>` is a whole number
and `<unit>` is one of: `second`, `minute`, `hour`, `day`, `week`, `month`, or
`year`. For example, `24 hours`, `1 week`, or `30 years`.

Deltas may be converted to another time unit by ending the expression in
`as <unit>`. For example, `1 week as days` returns `7 days`.

The output will be either a _date_ or _delta_ depending on the context.

## Grammar

Here's the language grammar in Backus–Naur form. You can use this to generate
random valid programs with [BNF Playground][bnf].

[bnf]: https://bnfplayground.pauliankline.com/

```js
<dateExpr>    ::= <dateOrDelta> <castExpr>? (<op> <dateExpr>)?

<castExpr>    ::= <ws> "as" <ws> <unit>

<dateOrDelta> ::= <date> | <delta>

<date>        ::= <number> "/" <number> "/" <number>

<delta>       ::= <number> <ws> <unit>

<op>          ::= ("+" | "-")

<number>      ::= [0-9]+

<unit>        ::= ("millisecond" | "second" | "minute" | "hour"
                    | "day" | "week" | "month" | "year") "s"?

<ws>          ::= " "+
```

## Next Steps

Here's a list of features, fixes, and improvements that I'd like to make in
future versions.

-   Improve output formatting (display `1.25 days` as `1 day 6 hours`)
-   Option to skip weekends, holidays, etc.
-   Add shortcuts for `now`, `today`, etc.
-   Support other date formats besides `MM/DD/YYYY`
-   Support general purpose math (`1 week * 5/7 as hours` should yield `120 hours`)
-   Better error messages
-   Unit tests
