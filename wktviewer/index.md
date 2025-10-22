---
title: WKT Viewer
date: 2025-02-07T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: Simple tool to display Well-Known Text map features.
image: /wktviewer/preview.png
---

This is a simple tool to view WKT features on a map for debugging. Enter WKT
into the textarea below to render features. You may also manually draw shapes
on the map to generate WKT.

This program contains a rudimentary parser to cleanup invalid characters and
automatically detect delimiters which allows you to copy & paste features from
a program such as `pgAdmin` using `ST_AsText`.

There are known performance issues for complex shapes. Supports __EPSG 4326__ only.

<div id="wktviewer"></div>
