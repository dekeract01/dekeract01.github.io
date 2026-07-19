---
title: "LaTeX Templates Collection"
excerpt: "University of Southampton LaTeX templates for reports, theses, posters, and Beamer presentations."
collection: projects
date: 2024-11-18
permalink: /projects/latex-templates/
---

During my time at the University of Southampton, I put together a small collection of LaTeX templates for the documents I needed most often: short reports, a doctoral thesis, conference posters, and Beamer presentations. Each template lives in its own directory and compiles independently.

I made these primarily to make my own writing and presenting easier. The [source repository](https://github.com/dekeract01/sotonlatex) contains the current templates, supporting style files, and example content.

## The templates

The collection includes four starting points:

| Template | Intended use |
| --- | --- |
| Report | Coursework, short reports, and lab write-ups |
| Thesis | PhD or MPhil theses following the University of Southampton layout |
| Poster | Conference and research posters |
| Beamer | Presentation slides with Southampton styling |

The poster and Beamer templates share the same underlying base: colours, fonts, Southampton branding, and the supporting content structure. I designed them this way so that I could keep one figures directory and move material between a poster and a presentation with minimal rework.

In principle, it should be possible to change the document class from Beamer to poster, or the other way around, and retain most of the content. In practice, I have found that the change can introduce formatting issues. It will provide a useful starting point, but expect to review the result and adjust figures, widths, spacing, and the layout for the target aspect ratio.

### Beamer presentation template

![University of Southampton Beamer title-slide template](/images/template_beamer_picture.png)

### Poster template

![University of Southampton research poster template](/images/template_poster_picture.png)

## Thesis template

I based the thesis template on the standard Southampton thesis layout, then added a few conveniences that I found helpful during long-form writing. The front page uses the University's heraldic crest, and the `glossaries` package generates separate lists for acronyms, non-dimensional numbers, and mathematical symbols.

Definitions live in one central file and are referenced throughout the thesis with commands such as `\gls{...}` and `\glssymbol{...}`. Only terms used in the document are included in the generated lists, so the front matter stays consistent as chapters evolve.

## Using the templates

Each directory contains a main `.tex` file and its supporting class or style files. The most straightforward route is to upload the folder you need as a new [Overleaf](https://www.overleaf.com) project, which handles the necessary glossary and bibliography passes. Local builds use `pdflatex`; the thesis additionally needs `makeglossaries`.

The report, thesis, and poster templates work with older TeX distributions. The Beamer template currently requires TeX Live 2023 or later. If an older installation fails to build it, updating the TeX distribution is the current workaround.

## A note on branding

The template code is released under the [MIT Licence](https://github.com/dekeract01/sotonlatex/blob/main/LICENSE). University of Southampton logos and branding remain the property of the University and are not covered by that licence. For a thesis submission, always check the latest Doctoral College presentation requirements, as the University's regulations can change.
