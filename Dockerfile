FROM jekyll/jekyll:builder

COPY Gemfile Gemfile.lock ./
RUN bundler install
