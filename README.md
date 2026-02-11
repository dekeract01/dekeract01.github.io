# Teja Ala - Personal Webpage

A personal academic website built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/). This site showcases research, publications, teaching experience, and professional portfolio.

**Live Site:** https://dekeract01.github.io

## About

This is a professional portfolio website featuring:

- **About** - Personal and professional background
- **Publications** - Academic and research publications
- **Talks** - Presentations and conference talks with location tracking
- **Teaching** - Teaching experience and course materials
- **Portfolio** - Project portfolio and work samples

## Technology Stack

- **Static Site Generator:** [Jekyll](https://jekyllrb.com/)
- **Theme Base:** Adapted from [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) by Michael Rose
- **Hosting:** GitHub Pages
- **Font:** Computer Modern (via Google Fonts)
- **Version Control:** Git & GitHub

## Fork Information

This website is forked from the [Minimal Mistakes Jekyll Theme](https://github.com/mmistakes/minimal-mistakes) created by [Michael Rose](https://github.com/mmistakes). The theme provides an excellent foundation for building professional academic and portfolio websites with built-in support for:

- Blog posts and archives
- Publication listings
- CV/Resume pages
- Talk/presentation showcases
- Portfolio galleries
- Social media integration
- Responsive design

**Original Repository:** https://github.com/mmistakes/minimal-mistakes

## Installation & Setup

### Prerequisites

- Ruby 2.5 or higher
- Bundler
- Git

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/dekeract01/dekeract01.github.io.git
cd dekeract01.github.io
```

2. Install dependencies:
```bash
bundle install
```

3. Run the local server:
```bash
bundle exec jekyll serve
```

4. Open your browser and navigate to `http://localhost:4000`

## Building & Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

To manually build:
```bash
bundle exec jekyll build
```

Output will be generated in the `_site/` directory.

## Project Structure

```
.
├── _config.yml              # Site configuration
├── _data/                   # Site data (navigation, authors, etc.)
├── _includes/               # Reusable template components
├── _layouts/                # Page layouts
├── _pages/                  # Static pages
├── _posts/                  # Blog posts
├── _publications/           # Publications
├── _talks/                  # Talk/presentation entries
├── _teaching/               # Teaching materials
├── _portfolio/              # Portfolio projects
├── _sass/                   # SCSS stylesheets
├── assets/                  # CSS, JavaScript, images
└── index.html               # Homepage
```

## Customization

### Editing Content

- **Posts:** Add markdown files to `_posts/` folder
- **Publications:** Add to `_publications/` folder
- **Talks:** Add to `_talks/` folder
- **Pages:** Add to `_pages/` folder

### Styling

SCSS files are located in `_sass/`:
- `_variables.scss` - Font, color, and layout variables
- `_base.scss` - Base HTML elements
- Other modular SCSS files for specific components

## Recent Changes

- Font changed to Computer Modern for a classic academic appearance

## License

This repository is based on the Minimal Mistakes theme which is released under the [MIT License](https://opensource.org/licenses/MIT). The content and customizations are personal to this site.

## Contributing

This is a personal website, but contributions or suggestions are welcome! Feel free to open an issue or submit a pull request.

## Contact & Links

- **GitHub:** [@dekeract01](https://github.com/dekeract01)
- **Website:** https://dekeract01.github.io

---

**Last Updated:** 11-02-2026 12:59:04 UTC

*For more information about the Minimal Mistakes theme, visit: https://mmistakes.github.io/minimal-mistakes/*
