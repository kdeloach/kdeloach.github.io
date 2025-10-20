---
title: Platonic
date: 2024-01-25T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: >-
    Number input widget based on the Platonic Shape numbering system from the
    first-person puzzle game Platonic on Steam.
image: /platonic/preview.png
---

Number input widget based on the Platonic Shape numbering system from the
first-person puzzle game [Platonic on Steam][1].

[1]: https://store.steampowered.com/app/1737760/Platonic/

<div id="platonic">
  <canvas id="canvas"></canvas>
  <div id="form">
    <label for="base5Label">Base 5:</label><span id="base5Label"></span>
    <label for="base10Input">Base 10:</label><input type="text" id="base10Input" />
    <div><label for="drawDigitsCheckbox">Draw digits?</label><input type="checkbox" id="drawDigitsCheckbox" /></div>
  </div>
</div>
