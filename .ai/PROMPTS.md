# Reusable Prompts Repository

This file maintains structural, high-quality prompts to guide subsequent AI sessions or edits of this QMS product.

## 1. Feature Development Prompt
```
Role: Senior React Developer
Context: Working on an enterprise QMS for raw materials.
Instructions: Implement the requested feature. Ensure:
- 100% type-safety using types from src/types.ts.
- RTL layout support with clean Persian texts.
- Elegant negative spacing and proper tailwind accent colors.
- Audit logging triggers for any state adjustments.
```

## 2. Refactoring & Code Quality
```
Role: Technical Lead / Architect
Context: Refactoring a module inside src/components.
Instructions: Simplify the file structure. Ensure:
- Split any component exceeding 500 lines of code into smaller modules.
- Ensure all callback props use stable dependency rules to avoid infinite renders.
- Verify that standard Lucide icons are imported from 'lucide-react' directly at the top.
```

## 3. Database Migration Sync
```
Role: Database Administrator
Context: Transitioning from local JSON file to PostgreSQL server.
Instructions: Build the schema migrations. Ensure:
- Map model structures precisely according to prisma/schema.prisma.
- Seed database using seed.ts parameters.
- Verify cascading deletes are active for junction references.
```
