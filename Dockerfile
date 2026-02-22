# Use the official Jekyll image
FROM jekyll/jekyll:3.8

# Set the working directory
WORKDIR /usr/src/app

# Copy the Gemfile
COPY Gemfile* ./

# Install dependencies
RUN bundle install

# Command to serve the Jekyll site
CMD ["jekyll", "serve", "-H", "0.0.0.0", "-w", "--config", "_config.yml,_config_docker.yml"]
