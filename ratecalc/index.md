---
title: Pay Rate Calculator
date: 2025-11-13T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Calculate equivalent pay rates for different billing period intervals and discount rates.
image: /ratecalc/preview.png
---

Calculate pay rates for several billing periods based on the current anchor
field (highlighted in blue). Click on any billing period field to set it as the
anchor for reverse calculations.

Discount % is relative to the base hourly rate. For example, if Hourly Rate is
`100`, and Daily Rate Discount % is `10`, then Daily Rate will be `720` (`100 *
10% * 8`).

<div id="form"></div>
