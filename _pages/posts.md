---
layout: archive
permalink: /posts-md/
title: "Projects"
author_profile: true
---

Hi there! I've temporarily set all my GitHub project repos to private as I'm reviewing an issue flagged by a user. I'll make everything public again once I've had a chance to go through everything and make sure it's all in order.

Feel free to browse around, or head back to the [home page](/).

{% include base_path %}
{% capture written_year %}'None'{% endcapture %}
{% for post in site.posts %}
  {% capture year %}{{ post.date | date: '%Y' }}{% endcapture %}
  {% if year != written_year %}
    <h2 id="{{ year | slugify }}" class="archive__subtitle">{{ year }}</h2>
    {% capture written_year %}{{ year }}{% endcapture %}
  {% endif %}
  {% include archive-single.html %}
{% endfor %}