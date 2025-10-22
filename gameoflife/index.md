---
title: Game of Life
date: 2022-01-19T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Conway's Game of Life.
image: /gameoflife/preview.png
---

This was an experiment in creating a cellular automata interactive sketch using
an immutable functional based approach.

<div id="sketch"></div>

### Controls

-   `P`: Pause
-   `R`: Randomize
-   `S`: Step
-   `C`: Clear
-   `1`: Dot
-   `2`: Glider
-   `3`: Pulsar
-   `4`: Eraser

### Updates

- 10/22/2025
    - Randomized initial state and added transparency
- 10/19/2023
    -   Rewrote from React to Canvas
    -   Added keyboard shortcuts
