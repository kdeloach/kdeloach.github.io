---
title: Lazy Pass
date: 2023-10-16T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Lazy password generator designed to create random passwords that are easy to type using a remote control.
image: /lazypass/preview.png
---

Lazy password generator designed to create random passwords that are easy to
type using a remote control on Fire TV, Android TV, and other smart TV keyboard
layouts.

This was an experiment in generating passwords based on the physical layout of
smart TV on-screen keyboards. It generates passwords by selecting a random
initial letter and then performing a random walk along the keyboard until the
desired password length is reached.

<div id="form" data-component=""></div>
