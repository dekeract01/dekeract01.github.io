# Base image: Ruby with necessary dependencies for Jekyll
FROM ruby:3.2

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 1000
RUN groupadd -g 1000 vscode && \
    useradd -m -u 1000 -g vscode vscode

# Store gems in /bundle (outside the mounted volume) so the volume mount
# does not wipe the installed gems at runtime
RUN mkdir -p /bundle && chown vscode:vscode /bundle
ENV BUNDLE_PATH=/bundle

# Set the working directory
WORKDIR /usr/src/app

# Set permissions for the working directory
RUN chown -R vscode:vscode /usr/src/app

# Switch to the non-root user
USER vscode

# Copy Gemfile into the container (necessary for `bundle install`)
COPY Gemfile ./

# Pre-install bundler and gems at build time (cached layer)
RUN gem install bundler:2.3.26
RUN bundle install

# Run bundle install again after the volume is mounted (picks up any Gemfile
# changes and ensures lock is in sync), then serve the site
CMD ["bash", "-c", "bundle install && bundle exec jekyll serve -H 0.0.0.0 -w --config _config.yml,_config_docker.yml"]
