---
title: Platonic Number System
date: 2024-01-25T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Number input widget based on the Platonic numbering system from the first-person puzzle game Platonic on Steam.
image: /platonic/preview.png
---

Number input widget based on the Platonic numbering system from the
first-person puzzle game [Platonic on Steam][1].

Interact with this widget by clicking on the shapes to view the numeric
representation. You may also enter one or more numbers in the text box to view
the geometric representation. Click the white circle to delete the last shape.

Deciphering this mysterious number system is key to solving several puzzles in
Platonic.

Explanation:

1. This a base 5 number system, based on the 5 platonic shapes.
2. Numbers are written vertically, from bottom to top.
3. Each column is a separate number.
4. The value of each shape depends on its positional distance from the previous shape in this order: Triangle, Square, Diamond, Pentagon, Hexagon.

[1]: https://store.steampowered.com/app/1737760/Platonic/

<div id="platonic">
  <canvas id="canvas"></canvas>
  <div id="form">
    <label for="base5Label">Base 5:</label><span id="base5Label"></span>
    <label for="base10Input">Base 10:</label><input type="text" id="base10Input" />
    <div><label for="drawDigitsCheckbox">Draw digits?</label><input type="checkbox" id="drawDigitsCheckbox" /></div>
    <button id="random">Randomize</button>
  </div>
</div>
