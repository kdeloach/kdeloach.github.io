---
title: Smallville
date: 2023-10-18T00:00:00-05:00
updated: 2023-10-18T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Animated sketch of the relationship dynamics between the characters of Smallville.
image: /smallville/preview.png
---

Animated sketch of the relationship dynamics between the characters of
Smallville.

Each character is represented by an orb which gravitates towards friends &
family and away from enemies. Some interesting behavior emerges from these
simple rules.

<div id="sketch"></div>

### Controls

-   `P`: Pause
-   `R`: Reset
-   `D`: Draw debug lines (cycles between "attract", "detract", and "both")
-   `C`: Toggle background clearing behavior

### Updates

- 10/22/2025
    - Implemented dynamic scale transform
    - Adjusted colors and relationship values
- 11/17/2023
    - Scaled animation based on screen width
