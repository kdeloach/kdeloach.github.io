---
title: Rings
date: 2023-11-10
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
---

How many different ways can you slice six-pack rings?

<div id="sketch"></div>

<form id="form">
    <input type="button" id="restart" name="restart" value="New Solution" />
    <div>
        <label for="overlap">Allow overlap?</label>
        <input type="checkbox" id="overlap" name="overlap" value="overlap" />
    </div>
    <div>
        Speed:
        <label>
            <input type="radio" name="speed" value="Slow" /> Slow
        </label>
        <label>
            <input type="radio" name="speed" value="Fast" /> Fast
        </label>
        <label>
            <input type="radio" name="speed" value="Instant" checked="checked" /> Instant
        </label>
    </div>
    <div>
        <label for="debug">Debug rendering:</label>
        <input type="checkbox" id="debug" name="debug" value="debug" />
    </div>
</form>
