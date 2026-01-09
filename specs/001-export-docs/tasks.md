# Tasks: PRD Document Export and Copy Fix

**Input**: Design documents from `/specs/001-export-docs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: NOT requested in specification - implementation tasks only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install export dependencies in frontend/package.json (html2pdf.js, docx, marked, @types/marked)
- [X] T002 [P] Create directory structure in frontend/src/lib/export/
- [X] T003 [P] Create directory structure in frontend/src/components/export/
- [X] T004 [P] Create directory structure in frontend/src/utils/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create export type definitions in frontend/src/types/export.ts (ExportStatus, PDFOptions, DOCXOptions, ExportResult, ExportError)
- [X] T006 [P] Implement file utility functions in frontend/src/utils/file.ts (sanitizeFilename, generateExportFilename, triggerDownload, cleanupDownload)
- [X] T007 [P] Implement validation utilities in frontend/src/utils/validation.ts (isLargeDocument, estimateExportTime, countWords)
- [X] T008 Create export service index in frontend/src/lib/export/index.ts (export barrel file for all export services)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Fix Copy Button Functionality (Priority: P1) 🎯 MVP

**Goal**: Users can copy PRD content to clipboard with improved error handling and fallback support

**Independent Test**: Generate a PRD, click copy button, paste into text editor to verify content matches. Test fails gracefully when clipboard access is denied.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement copy service with Clipboard API in frontend/src/lib/export/export-copy.ts (copyToClipboard function with fallback to execCommand)
- [X] T010 [P] [US1] Create useExport hook in frontend/src/hooks/use-export.ts (copy state management, error handling)
- [X] T011 [US1] Update ChatMessage component copy handler in frontend/src/components/chat-message.tsx (integrate useExport hook, add error display, improve accessibility with ARIA labels)
- [X] T012 [US1] Add copy button accessibility features in frontend/src/components/chat-message.tsx (aria-label, keyboard navigation, screen reader announcements)

**Checkpoint**: At this point, User Story 1 should be fully functional - copy button works with fallback and proper error handling

---

## Phase 4: User Story 2 - Export PRD to PDF (Priority: P2)

**Goal**: Users can export complete PRD as PDF file with preserved markdown formatting

**Independent Test**: Generate a PRD, click PDF export button, verify PDF downloads with correct formatting and Chinese character support

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement PDF export service in frontend/src/lib/export/export-pdf.ts (exportToPDF function using html2pdf.js with PDFOptions configuration)
- [X] T014 [P] [US2] Create ExportButton component in frontend/src/components/export/export-button.tsx (reusable button with loading state, ARIA labels, keyboard support)
- [X] T015 [P] [US2] Create ProgressModal component in frontend/src/components/export/progress-modal.tsx (progress indicator for exports taking >2 seconds, cancel button support)
- [X] T016 [P] [US2] Create WarningModal component in frontend/src/components/export/warning-modal.tsx (large document warning >10,000 words with confirm/cancel options)
- [X] T017 [US2] Extend useExport hook with PDF support in frontend/src/hooks/use-export.ts (exportPDF function with progress tracking and error handling)
- [X] T018 [US2] Add PDF export button to ChatMessage in frontend/src/components/chat-message.tsx (conditional display when version exists, disabled during streaming, ARIA compliance)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - PDF exports functional with progress tracking and large document warnings

---

## Phase 5: User Story 3 - Export PRD to DOCX (Priority: P3)

**Goal**: Users can export complete PRD as editable Word document with proper markdown-to-Word formatting conversion

**Independent Test**: Generate a PRD, click DOCX export button, verify DOCX downloads and opens correctly in Microsoft Word with editable Chinese content

### Implementation for User Story 3

- [X] T019 [P] [US3] Implement markdown parser in frontend/src/lib/export/markdown-parser.ts (parseMarkdownTokens function using marked.lexer, convert tokens to docx structure)
- [X] T020 [P] [US3] Implement DOCX export service in frontend/src/lib/export/export-docx.ts (exportToDOCX function using docx library with DOCXOptions, Chinese font configuration)
- [X] T021 [US3] Extend useExport hook with DOCX support in frontend/src/hooks/use-export.ts (exportDOCX function with progress tracking and error handling)
- [X] T022 [US3] Add DOCX export button to ChatMessage in frontend/src/components/chat-message.tsx (conditional display when version exists, disabled during streaming, ARIA compliance)

**Checkpoint**: All user stories should now be independently functional - copy, PDF export, and DOCX export all working

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting improvements affecting multiple user stories

- [X] T023 [P] Add dynamic import optimization for export libraries in frontend/src/lib/export/export-pdf.ts and frontend/src/lib/export/export-docx.ts (lazy load html2pdf.js and docx to reduce initial bundle)
- [X] T024 [P] Implement WCAG 2.1 AA compliance validation in frontend/src/components/export/export-button.tsx (verify color contrast 4.5:1, focus indicators, screen reader support)
- [X] T025 Add visual polish to export buttons in frontend/src/components/chat-message.tsx (hover states, loading animations, disabled state styling, transition effects)
- [X] T026 [P] Add error boundary for export components in frontend/src/components/export/ (ErrorBoundary component to catch and display export errors gracefully)
- [X] T027 Run local validation per quickstart.md in frontend/ (test copy, PDF export, DOCX export with large and small documents, verify accessibility)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Copy Fix) can start after Foundational - No dependencies on other stories
  - US2 (PDF Export) can start after Foundational - Reuses components from US1 but independently testable
  - US3 (DOCX Export) can start after Foundational - Reuses components from US1/US2 but independently testable
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Independent, no other story dependencies
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses ExportButton, ProgressModal, WarningModal from its own phase, independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses useExport hook patterns, independently testable

### Within Each User Story

- US1: Copy service → useExport hook → ChatMessage integration → Accessibility features
- US2: PDF service → ExportButton/ProgressModal/WarningModal components → useExport extension → ChatMessage integration
- US3: Markdown parser → DOCX service → useExport extension → ChatMessage integration

### Parallel Opportunities

- **Setup Phase**: T002, T003, T004 can run in parallel (different directories)
- **Foundational Phase**: T006, T007 can run in parallel (different utility files)
- **User Story 1**: T009, T010 can run in parallel (service and hook are independent files)
- **User Story 2**: T013, T014, T015, T016 can run in parallel (all different files)
- **User Story 3**: T019, T020 can run in parallel (parser and service are different files)
- **Polish Phase**: T023, T024, T026 can run in parallel (different concerns)
- **Cross-Story**: After Foundational phase, US1, US2, US3 can be developed in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# After Foundational phase complete, launch all US2 components in parallel:
Task: "Implement PDF export service in frontend/src/lib/export/export-pdf.ts"
Task: "Create ExportButton component in frontend/src/components/export/export-button.tsx"
Task: "Create ProgressModal component in frontend/src/components/export/progress-modal.tsx"
Task: "Create WarningModal component in frontend/src/components/export/warning-modal.tsx"

# Then integrate with hook and ChatMessage:
Task: "Extend useExport hook with PDF support in frontend/src/hooks/use-export.ts"
Task: "Add PDF export button to ChatMessage in frontend/src/components/chat-message.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T012)
4. **STOP and VALIDATE**: Test copy functionality independently
5. Deploy/demo if ready (MVP: working copy button with fallback)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Copy Fix) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (PDF Export) → Test independently → Deploy/Demo
4. Add User Story 3 (DOCX Export) → Test independently → Deploy/Demo
5. Complete Polish → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T008)
2. Once Foundational is done:
   - Developer A: User Story 1 (T009-T012) - Copy Fix
   - Developer B: User Story 2 (T013-T018) - PDF Export
   - Developer C: User Story 3 (T019-T022) - DOCX Export
3. Stories integrate independently via shared useExport hook and components
4. Team completes Polish together (T023-T027)

---

## Notes

- **Total Tasks**: 27 implementation tasks (no tests as not requested)
- **Task Distribution**:
  - Setup: 4 tasks
  - Foundational: 4 tasks
  - User Story 1 (Copy): 4 tasks
  - User Story 2 (PDF): 6 tasks
  - User Story 3 (DOCX): 4 tasks
  - Polish: 5 tasks
- **Parallel Tasks**: 16 tasks marked [P] can run in parallel within their phases
- **MVP Scope**: Phases 1-3 (Tasks T001-T012) deliver working copy button
- **File Paths**: All tasks include exact file paths for immediate execution
- **No Conflicts**: Each task touches distinct files, enabling parallel execution
- **Independent Testing**: Each user story can be validated independently after completion
- **Accessibility**: WCAG 2.1 AA compliance built into each user story
- **Chinese Support**: html2pdf.js and docx library handle Chinese characters properly
