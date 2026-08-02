# Lead → Launch AI Development Rules

## IMPORTANT

This is a production project.

Never redesign or replace existing UI unless explicitly requested.

Always preserve:

- Layout
- Colors
- Typography
- Spacing
- Components
- Animations
- Icons
- Existing workflow

Do not remove any existing functionality.

Only modify the files required for the requested feature.

---

# Code Rules

- Use TypeScript.
- Use existing coding style.
- Reuse existing components.
- Avoid duplicate code.
- Keep components modular.
- Maintain project architecture.

---

# UI Rules

Never:

- Change color palette
- Change fonts
- Change paddings
- Change margins
- Change component size
- Change responsive layout

Only extend existing UI.

---

# Firebase Rules

Always use:

- Firebase Authentication
- Firestore
- Firebase Admin
- Existing Firebase config

Never replace Firebase with another backend.

---

# API Rules

Never remove existing APIs.

Always preserve:

- Google Maps scraping
- Apify integration
- Google PageSpeed integration
- Existing API routes

---

# Performance Rules

Do not introduce unnecessary packages.

Avoid unnecessary re-renders.

Reuse hooks whenever possible.

---

# Git Rules

Never delete files unless requested.

Never rename folders unless required.

Never change project structure.

---

# Before Editing

Always inspect the project first.

Understand the current implementation.

Modify only the required files.

---

# Before Finishing

Verify:

- Build passes
- No TypeScript errors
- No ESLint errors
- Existing features still work
- New feature works correctly

---

# Priority Order

1. Preserve existing functionality.
2. Preserve UI.
3. Add requested feature.
4. Keep code clean.
5. Maintain performance.

If there is any conflict between implementing a new feature and preserving existing functionality, preserving existing functionality always takes priority.
