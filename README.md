# Kast Configurator (minimal)

Place your `kast.gltf` file in the project's `public/` folder as `public/kast.gltf` (create the folder if needed). Vite will serve files from `public/` at the server root.

Commands:

```bash
npm install
npm run dev
```

Open http://localhost:5173 and the page will load `kast.gltf` from the `public/` folder.

## GitHub Pages

This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`.
After pushing to the `main` branch, enable GitHub Pages in the repository settings:

1. Open **Settings > Pages**.
2. Set **Source** to **GitHub Actions**.
3. Wait for the workflow to finish.

The site will be available at:

https://mikevissersip.github.io/HOP_Kastconfigurator/
