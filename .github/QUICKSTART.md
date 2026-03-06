# Quick Start Guide

Get up and running with emage in minutes!

## For Users

### Try It Now
1. Visit [emage demo](#) (add your deployed URL)
2. Upload an image
3. Edit and download!

That's it! No installation required.

### Self-Host

**Option 1: Docker (Easiest)**
```bash
docker run -d -p 3000:80 ghcr.io/yourusername/emage:latest
```
Visit `http://localhost:3000`

**Option 2: Docker Compose**
```bash
git clone https://github.com/yourusername/emage.git
cd emage
docker-compose up -d
```

**Option 3: Build from Source**
```bash
git clone https://github.com/yourusername/emage.git
cd emage
bun install
bun run build
# Serve the dist folder with any static server
```

## For Contributors

### 1. Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/emage.git
cd emage

# Install dependencies
bun install

# Start dev server
bun run dev
```

Open `http://localhost:5173` in your browser.

### 2. Make Your First Contribution

1. **Find an issue** to work on or create one
2. **Fork** the repository
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes** and test thoroughly
5. **Commit**: `git commit -m "feat: add my feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Create Pull Request** on GitHub

### 3. Development Commands

```bash
# Run development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type check
bun run type-check
```

## Project Structure Quick Reference

```
emage/
├── src/
│   ├── components/       # Vue components
│   │   ├── ImageEditor.vue
│   │   ├── CropControls.vue
│   │   └── ...
│   ├── composables/      # Reusable logic
│   │   └── useImageEditor.ts
│   ├── App.vue           # Root component
│   └── main.ts           # Entry point
├── public/               # Static assets
├── Dockerfile           # Docker config
└── docker-compose.yml   # Docker Compose config
```

## Common Tasks

### Add a New Filter

1. Update `src/composables/useImageEditor.ts`:
   ```typescript
   const applyMyFilter = (value: number) => {
     // Add filter logic
   }
   ```

2. Update filter interface and return object

3. Create UI in `src/components/FilterControls.vue`

### Add a New Control Panel

1. Create component: `src/components/MyControls.vue`
2. Import in `App.vue`
3. Add to sidebar

### Test Your Changes

```bash
# Test different image formats
- JPG, PNG, GIF, WebP
- Small and large files
- Portrait and landscape

# Test in browsers
- Chrome
- Firefox
- Safari
- Edge

# Test features
- All transformations
- All filters
- Export formats
```

## Need Help?

- 📖 [Full Documentation](../README.md)
- 🤝 [Contributing Guide](../CONTRIBUTING.md)
- 💬 [GitHub Discussions](https://github.com/yourusername/emage/discussions)
- 🐛 [Report a Bug](https://github.com/yourusername/emage/issues/new?template=bug_report.md)
- ✨ [Request a Feature](https://github.com/yourusername/emage/issues/new?template=feature_request.md)

## Tips

- **Start Small**: Begin with small contributions like documentation or bug fixes
- **Ask Questions**: Use GitHub Discussions if you're unsure
- **Read the Code**: Browse existing components to understand patterns
- **Test Thoroughly**: Always test in multiple browsers
- **Have Fun**: Enjoy contributing to open source!

---

Happy coding! 🚀
