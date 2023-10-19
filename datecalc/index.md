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

## Updates

-   10/19/2023 - Added `now` and `today` keywords
