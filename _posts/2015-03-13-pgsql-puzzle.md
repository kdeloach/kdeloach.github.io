---
layout: post
title:  PostgreSQL Puzzle
date:   2015-03-13
tags: postgresql
---
Here's a little PostgreSQL puzzle. 

Why does the following result in `ERROR: failed to find conversion function
from unknown to text` on PostgreSQL 9.3?

{% highlight sql %}
SELECT CASE WHEN x='foo' THEN 1 ELSE 2 END
FROM (
    SELECT 'foo' AS x
) AS subquery
{% endhighlight %}

But this works perfectly fine?

{% highlight sql %}
SELECT CASE WHEN x='foo' THEN 1 ELSE 2 END
FROM (
    SELECT CASE WHEN 1=1 THEN 'foo' ELSE 'bar' END AS x
) AS subquery
{% endhighlight %}

The only difference is the subquery.

In the first snippet, PostgreSQL complains that the type of column `x` in
`subquery` is `unknown`. I find this strange, considering that the query uses
a string literal and it is obviously `text`.

In the second snippet, the string literal has been replaced with a `CASE` and
the problem goes away. It's fascinating that PostgreSQL is able to correctly
determine the type of a computed column, in this case, but not the type of a
column defined with a string literal.

Adding a `CAST` to the `x` column resolves the issue.

{% highlight sql %}
SELECT CASE WHEN CAST(x AS text)='foo' THEN 1 ELSE 2 END
FROM (
    SELECT 'foo' AS x
) AS subquery
{% endhighlight %}