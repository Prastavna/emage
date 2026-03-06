# Contributing to emage

First off, thank you for considering contributing to emage! It's people like you that make emage such a great tool.

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Upload image '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
 - Browser: [e.g. Chrome 120, Firefox 121, Safari 17]
 - Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description** of the enhancement
- **Use cases** - Why would this be useful?
- **Possible implementation** - If you have ideas on how to implement it
- **Alternatives considered** - What other solutions you've thought about

### Pull Requests

We actively welcome your pull requests! Here's the process:

1. Fork the repo and create your branch from `main`
2. Make your changes
3. If you've added code, add tests if applicable
4. Ensure the code builds successfully
5. Make sure your code follows the existing style
6. Write a clear commit message
7. Submit a pull request!

## 🛠 Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- Git
- A code editor (VS Code recommended)

### Getting Started

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/emage.git
   cd emage
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

4. **Start Development Server**
   ```bash
   bun run dev
   ```

5. **Make Your Changes**
   - Write your code
   - Test thoroughly
   - Follow the code style guidelines below

6. **Build and Test**
   ```bash
   # Type check
   bun run type-check
   
   # Build for production
   bun run build
   
   # Test the build
   bun run preview
   ```

7. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

8. **Push to Your Fork**
   ```bash
   git push origin feature/my-new-feature
   ```

9. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit!

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types and interfaces
- Avoid `any` types when possible
- Use descriptive variable names

**Example:**
```typescript
// Good
interface ImageFilters {
  brightness: number
  contrast: number
  saturation: number
}

const applyFilters = (filters: ImageFilters): void => {
  // implementation
}

// Avoid
const applyFilters = (filters: any) => {
  // implementation
}
```

### Vue Components

- Use `<script setup>` syntax
- Use Composition API
- Keep components focused and single-purpose
- Props and emits should be strongly typed
- Use descriptive component and prop names

**Example:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  initialValue: number
  max: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [value: number]
}>()

const value = ref(props.initialValue)

const handleChange = () => {
  emit('change', value.value)
}
</script>
```

### CSS/Styling

- Use TailwindCSS utility classes
- Use DaisyUI components when available
- Keep custom CSS minimal
- Use semantic color names from DaisyUI theme
- Follow mobile-first responsive design

**Example:**
```vue
<!-- Good -->
<button class="btn btn-primary btn-sm">
  Click Me
</button>

<!-- Avoid inline styles -->
<button style="padding: 8px; background: blue;">
  Click Me
</button>
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ImageEditor.vue`, `CropControls.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useImageEditor.ts`)
- **Functions**: camelCase (e.g., `applyFilters`, `handleRotation`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_IMAGE_SIZE`)
- **Interfaces/Types**: PascalCase (e.g., `ImageFilters`, `CropArea`)

### Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Use JSDoc for public APIs
- Explain "why" not "what"

**Example:**
```typescript
// Good - explains the reasoning
// Calculate scale to fit image within canvas bounds while maintaining aspect ratio
const scale = Math.min(
  maxWidth / imgWidth,
  maxHeight / imgHeight,
  1 // Never scale up, only down
)

// Avoid - states the obvious
// Set the scale variable
const scale = calculateScale()
```

## 🏗 Project Structure

```
src/
├── components/          # Vue components
│   ├── ImageUpload.vue     # File upload UI
│   ├── ImageEditor.vue     # Main canvas editor
│   ├── CropOverlay.vue     # Crop interaction overlay
│   ├── *Controls.vue       # Feature control panels
│   └── ...
├── composables/         # Reusable composition functions
│   └── useImageEditor.ts   # Core image manipulation logic
├── assets/             # Static assets (images, fonts)
├── App.vue             # Root component
├── main.ts             # Application entry point
└── style.css           # Global styles
```

### Component Guidelines

**When creating new components:**

1. **Single Responsibility**: Each component should do one thing well
2. **Props Down, Events Up**: Use props for input, emit events for output
3. **Composables for Logic**: Extract reusable logic to composables
4. **TypeScript**: Always use TypeScript with proper types
5. **Accessibility**: Ensure components are keyboard and screen-reader accessible

**Example Component Structure:**

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import type { SomeType } from '../types'

// 2. Props & Emits
interface Props {
  value: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: number]
}>()

// 3. Refs & Reactive State
const internalValue = ref(props.value)

// 4. Computed Properties
const displayValue = computed(() => internalValue.value.toFixed(2))

// 5. Methods
const handleChange = () => {
  emit('update', internalValue.value)
}

// 6. Lifecycle Hooks
onMounted(() => {
  // initialization
})
</script>

<template>
  <!-- Keep template clean and readable -->
  <div class="component-name">
    <!-- content -->
  </div>
</template>
```

## 🧪 Testing

Currently, the project doesn't have automated tests. Contributions to add testing infrastructure are welcome!

**Manual Testing Checklist:**

- [ ] Upload different image formats (JPG, PNG, GIF, WebP)
- [ ] Test all rotation angles
- [ ] Test flip horizontal and vertical
- [ ] Test all aspect ratio crops
- [ ] Test all filters with various values
- [ ] Test resize by dimensions
- [ ] Test resize by file size
- [ ] Test export in all formats
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Verify no console errors

## 🎯 Areas for Contribution

Looking for ideas? Here are some areas we'd love help with:

### High Priority
- [ ] Add automated testing (Vitest, Playwright)
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add more filter options (Blur, Sharpen, Sepia, etc.)
- [ ] Performance optimization for large images
- [ ] Add undo/redo functionality

### Medium Priority
- [ ] Add preset filter combinations
- [ ] Batch processing for multiple images
- [ ] Add image format conversion
- [ ] Improve error handling and user feedback
- [ ] Add loading indicators

### Nice to Have
- [ ] Add more export options (PDF, TIFF)
- [ ] Image comparison slider (before/after)
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle
- [ ] Custom crop shapes (circle, polygon)

## 📋 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history.

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(crop): add circle crop shape option

fix(rotation): correct angle calculation for 270° rotation

docs(readme): update installation instructions

style(components): format code with prettier

refactor(composable): extract filter logic to separate function

perf(canvas): optimize rendering for large images

test(editor): add unit tests for rotation functions

chore(deps): update fabric.js to v7.2.1
```

## 🔍 Code Review Process

All submissions require review before merging:

1. **Automated Checks**: Build must pass
2. **Code Review**: At least one maintainer review
3. **Testing**: Changes should be manually tested
4. **Documentation**: Update docs if needed

**Review Criteria:**
- Code quality and style
- Functionality works as expected
- No breaking changes (unless discussed)
- Performance considerations
- Accessibility
- Browser compatibility

## 🤝 Community Guidelines

- Be respectful and constructive
- Help others when you can
- Follow our Code of Conduct
- Ask questions if you're unsure
- Have fun and learn!

## 💬 Getting Help

Need help? Here's how to reach us:

- **Questions**: [GitHub Discussions](https://github.com/Prastavna/emage/discussions)
- **Bugs**: [GitHub Issues](https://github.com/Prastavna/emage/issues)
- **Chat**: [Discord Server](#) (if applicable)

## 📚 Resources

### Learning Resources
- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)

### Tools
- [Vue DevTools](https://devtools.vuejs.org/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Canvas MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 🎖 Recognition

Contributors will be:
- Added to the Contributors section in README
- Mentioned in release notes
- Given credit in the project

Thank you for contributing to emage! 🎉

---

<div align="center">
  <p>Questions? Open an issue or start a discussion!</p>
  <p>Happy Coding! 💻</p>
</div>
