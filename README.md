# Teja Ala

This is my personal website, rebuilt with the help of GitHub Copilot to be more streamlined and simple.

The site gives me more control over the content, layout, and visual design than the Academic Pages template, while aiming to be more responsive across desktop and mobile devices.

It includes pages for my research, projects, blog, contact details, and CV.

## Adding content

The About/Contact/Research/Blog/Projects pages are generated from plain HTML
files under `content/`, so you don't hand-edit the pages themselves:

- Edit `content/pages/about.html`, `contact.html`, or `research.html` to update those pages.
- Copy `content/blog/_template.html` to `content/blog/your-slug.html` for a new blog post.
- Copy `content/projects/_template.html` to `content/projects/your-slug.html` for a new project.

Then run:

```
python3 build.py
```

and commit the changed files (your new `content/...` file plus the regenerated
HTML it produced). No dependencies beyond Python 3 itself.
