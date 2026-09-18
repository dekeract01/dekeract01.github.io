# Teja Ala

This is my personal website, rebuilt with the help of GitHub Copilot to be more streamlined and simple.

The site gives me more control over the content, layout, and visual design than the Academic Pages template, while aiming to be more responsive across desktop and mobile devices.

It includes pages for my research, projects, blog, contact details, and CV.

## Adding content

`docs/` is the only folder GitHub Pages serves (repo Settings -> Pages ->
Source is set to the `docs/` folder on the default branch). Everything in
`docs/about/`, `docs/contact/`, `docs/research/`, `docs/blog/`, and
`docs/projects/` is generated — never hand-edit those files, they get
silently overwritten the next time the site is built.

To change something, edit the source in `content/` instead:

- Edit `content/pages/about.html`, `contact.html`, or `research.html` to update those pages.
- Copy `content/blog/_template.html` to `content/blog/your-slug.html` for a new blog post.
- Copy `content/projects/_template.html` to `content/projects/your-slug.html` for a new project.

Then run:

```
python3 build.py
```

and commit both your changed `content/...` file and the regenerated files
under `docs/`. No dependencies beyond Python 3 itself.

A few things in `docs/` are static assets, not generated, and are fine to
edit directly: `docs/index.html` (the homepage), `docs/page.css`,
`docs/images/`, the favicons, and the CV PDF.
