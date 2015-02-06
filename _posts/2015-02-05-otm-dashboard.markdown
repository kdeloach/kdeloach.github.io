---
layout: post
title:  GitHub API authentication using OAuth 
date:   2015-02-05
tags: github oauth flask
---
For those interested in obtaining access to private repository information
using the [Github API][api], here is a [sample application][dashboard]
built with [Flask][flask], which demonstrates how to perform authorization
via [OAuth][oauth].

![OTM Dashboard]({{ site.baseurl }}/assets/images/otm-dashboard.png)

The bulk of the work takes place in [`main.py#login`][login].

{% highlight python %}
@app.route("/login")
def login():
    if 'access_token' in session:
        return redirect(url_for('index'))
    elif 'code' in request.args:
        # Exchange auth code for access token.
        params = {
            'client_id': app.config['CLIENT_ID'],
            'client_secret': app.config['CLIENT_SECRET'],
            'code': request.args.get('code')
        }
        url = 'https://github.com/login/oauth/access_token'
        res = requests.post(url, data=params)
        qs = urlparse.parse_qs(res.text)
        session['access_token'] = qs['access_token'][0]
        return redirect(url_for('index'))
    else:
        # Request auth code.
        params = {
            'client_id': app.config['CLIENT_ID'],
            'redirect_uri': app.config['SITE_URL'] + '/login',
            'scope': 'repo'
        }
        qs = '&'.join(a + '=' + b for a, b in params.iteritems())
        url = 'https://github.com/login/oauth/authorize?' + qs
        return redirect(url)
{% endhighlight %}

[api]: https://developer.github.com/v3/
[flask]: http://flask.pocoo.org/
[oauth]: http://oauth.net/
[dashboard]: https://github.com/kdeloach/otm-dashboard
[login]: https://github.com/kdeloach/otm-dashboard/blob/f9b8ae39a7adb90b706be62136e1156fd299f327/main.py#L21