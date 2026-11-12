# Senju site

The download page for Senju. Plain files: no framework and no build step.

- `index.html`, `style.css`, `site.js`: the page.
- `fonts/`: Archivo, hosted here (SIL Open Font License, see `fonts/OFL.txt`).
- `vercel.json`: caching and headers for Vercel.

The installers are not in this folder. They are published as a GitHub Release on this
repository, and the download buttons link to the latest one:

    https://github.com/JamesGongYC/senju-site/releases/latest/download/Senju-arm64.dmg
    https://github.com/JamesGongYC/senju-site/releases/latest/download/Senju-x64.dmg

To publish a new version, run `npm run release` in the app's folder and then the
`gh release create` command it prints.

Preview locally with `python3 -m http.server 8000`.
