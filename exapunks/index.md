---
title: EXAPUNKS Compiler
date: 2023-12-25T00:00:00-05:00
templates:
    - templates/base.html
    - templates/post.html
tags:
    - post
summary: EXAPUNKS Compiler with language extensions to generate assembly for
    conditionals and loop control structures.
---

EXAPUNKS Compiler with language extensions to generate assembly for
conditionals and loop control structures.

<div id="form"></div>

## EXA Language Reference

Language reference for EXAPUNKS assembly.

### Operands

-   **`R`** - Register
-   **`R/N`** - Register or number
-   **`L`** - Label

### Registers

-   **`X`** - General purpose storage register
-   **`T`** - General purpose storage register. The value is set to 0 or 1 from
    the result of `TEST` instructions and is used by `TJMP` and `FJMP`.
-   **`F`** - File cursor. Used to read and write to the held file.
-   **`M`** - Used to transmit data to other EXAs.

### Instructions

-   **`COPY R/N R`** - Copy value to register
-   **`ADDI R/N R/N R`** - Add 2 values. Same syntax for
    `SUBI`, `MULI`, `DIVI`, and `MODI`.
-   **`SWIZ R/N R/N R`**
-   **`MARK L`** - Create label
-   **`JUMP L`** - Jump to label
-   **`TJMP L`** - Jump to label if `T` is non-zero.
-   **`LJMP L`** - Jump to label if `T` is 0
-   **`TEST R/N = R/N`** - Compare values using `=`, `<`, and `>` operators
-   **`REPL L`** - Create copy of EXA and jump to label in the copy
-   **`HALT`** - Terminate current EXA
-   **`KILL`** - Terminate another EXA in same node
-   **`LINK R/N`** - Move to node
-   **`HOST R`** - Copy host name to register
-   **`MODE`** - Toggle communication mode between Local and Global
-   **`VOID M`** - Discard value from register
-   **`TEST MRD`** - Set `T` to 1 if can read message from another EXA,
    otherwise, set it to 0
-   **`MAKE`** - Create new file
-   **`GRAB R/N`** - Grab file
-   **`FILE R`** - Copy file ID
-   **`SEEK R/N`** - Move file cursor
-   **`VOID F`** - Discard value from file
-   **`DROP`** - Drop file
-   **`WIPE`** - Delete file
-   **`TEST EOF`** - Set `T` to 1 if end of file is reached, otherwise, set it
    to 0
-   **`NOTE`** - Comment (line comments start with `;`)
-   **`NOOP`** - Do nothing
-   **`RAND R/N R/N R`** - Generate random number between first and second
    operand (inclusive)

## EXA Compiler Language Extensions

Additional language features supported by this EXA Compiler.

-   **`R/N = R/N`** - Assign first operand to second. Sugar for `COPY` instruction.
    -   Ex. `X = 10`
-   **`R/N = R/N + R/N`** - Add 2 values and assign them to the first operand.
    Same syntax for `+`, `-`, `*`, `/`, `%`, and `SWIZ`.
    -   Ex. `X = M + 1`
    -   Ex. `X = 6789 SWIZ 4321`
-   **`R/N = RAND R/N R/N`** - Assign random number to register.
    -   Ex. `X = RAND 1 10`
-   **`R/N += R/N`** - Short assignment for one value. Same syntax for `+=`, `-=`, `/=`, `*=`,
    and `%=`.
    -   Ex. `X += M`
-   **`TEST != R/N`** - Inverse of `TEST = R/N`. Same syntax for `>=` and `<=`.
-   **`TEST NOT EOF`** - Inverse of `TEST EOF`. Same syntax for `MRD`.
-   **`IF/ELSE IF/ELSE`** - Condition uses `TEST` syntax. Body must end with
    `END`.
    -   Ex. `IF X > 10 ... ELSE IF X > 5 ... ELSE ... END`
-   **`WHILE`** - While loop condition uses `TEST` syntax. Checks condition
    before executing body. Omit condition for infinite loop. Body must end with
    `LOOP`.
    -   Ex: `WHILE ... LOOP`
    -   Ex: `WHILE X < 10 ... LOOP`
-   **`DO`** - Do while loop condition goes at the end and is checked after
    executing the body. Omit condition for infinite loop. Body must end with
    `LOOP` followed by the condition.
    -   Ex: `DO ... LOOP`
    -   Ex: `DO ... LOOP WHILE X < 10`
-   **`BREAK`** - Break current loop
-   **`BREAK IFFALSE`** - Break current loop if `T` is 0. Also supports `BREAK IFTRUE`.
-   **`CONTINUE`** - Continue current loop
-   **`CONTINUE IFFALSE`** - Continue current loop if `T` is 0. Also supports
    `CONTINUE IFTRUE`.
-   **`IF ISTRUE`** - Execute body if `T` is non-zero. Same syntax for `ISFALSE`.
    -   Ex. `IF ISTRUE ... END`
-   **`WHILE ISTRUE`** - Execute body if `T` is non-zero. Same syntax for `ISFALSE`. This also works for do while loops.
    -   Ex. `WHILE ISTRUE ... LOOP`
    -   Ex. `DO ... WHILE ISTRUE`
