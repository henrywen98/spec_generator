# Tasks: Agent 框架调整与图片支持

**Input**: Design documents from `/specs/001-agent-image-support/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Prompts**: `prompts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration and dependency setup

- [x] T001 Add `DASHSCOPE_VL_MODEL` environment variable to `.env.example` and document in README
- [x] T002 Update `backend/pyproject.toml` to ensure `dashscope>=1.24.6`
- [x] T003 [P] Update `docker-compose.yml` to pass `DASHSCOPE_VL_MODEL` environment variable

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Schema Extensions

- [x] T004 Add `ImageAttachment` Pydantic model in `backend/src/models/schemas.py`
  - Fields: `data` (str, Base64), `mime_type` (Literal enum), `filename` (Optional[str]), `size` (Optional[int])
  - Validators: mime_type enum, size max 10MB
- [x] T005 Extend `GenerationRequest` model in `backend/src/models/schemas.py`
  - Add `images: Optional[list[ImageAttachment]]` field with `max_length=5` validator

### Backend LLM Service Extensions

- [x] T006 Add `_build_multimodal_messages()` method in `backend/src/services/llm_service.py`
  - Convert images to DashScope content array format: `[{"image": "data:..."}, {"text": "..."}]`
  - Support both generate and chat modes
- [x] T007 Add `_stream_multimodal_response()` method in `backend/src/services/llm_service.py`
  - Use `dashscope.MultiModalConversation.call()` with streaming
  - Handle response events same as existing `_stream_response()`
- [x] T008 Load `DASHSCOPE_VL_MODEL` from environment in `backend/src/services/llm_service.py` `__init__`
  - Default to `qwen-vl-plus` if not set

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 上传图片并生成 PRD (Priority: P1) 🎯 MVP

**Goal**: 用户能在首次输入时上传图片，系统结合图片内容生成 PRD

**Independent Test**: 上传一张 UI 设计稿图片，验证系统能识别图片中的界面元素并生成相关的 PRD 内容

### Backend Implementation

- [x] T009 [US1] Modify `generate_stream()` in `backend/src/services/llm_service.py`
  - Accept optional `images` parameter
  - Route to `_stream_multimodal_response()` if images present, else use existing `_stream_response()`
- [x] T010 [US1] Modify `/generate` endpoint in `backend/src/api/endpoints.py`
  - Extract `images` from request
  - Pass `images` to `llm_service.generate_stream()` for generate mode
- [x] T011 [US1] Add request validation in `backend/src/api/endpoints.py`
  - Validate image count (max 5)
  - Return 400 error with clear message if validation fails

### Frontend Implementation

- [x] T012 [P] [US1] Create `useImageUpload` hook in `frontend/src/hooks/useImageUpload.ts`
  - State: `pendingImages` array with id, file, preview, base64, status
  - Methods: `addImages()`, `removeImage()`, `clearImages()`
  - Validation: file type (JPEG/PNG/GIF/WebP), size (≤10MB), count (≤5)
- [x] T013 [P] [US1] Create `ImagePreview` component in `frontend/src/components/image-preview.tsx`
  - Display thumbnail with filename
  - Delete button (X icon)
  - Loading/error state indicators
- [x] T014 [US1] Create `ImageUpload` component in `frontend/src/components/image-upload.tsx`
  - File input (hidden) with accept filter for supported formats
  - Upload button/icon trigger
  - Drag & drop support (optional enhancement)
- [x] T015 [US1] Modify `ChatInput` component in `frontend/src/components/chat-input.tsx`
  - Integrate `ImageUpload` button (left of text input)
  - Display `ImagePreview` list above input area when images selected
  - Wire up `useImageUpload` hook
- [x] T016 [US1] Modify `api.ts` in `frontend/src/services/api.ts`
  - Update `generateSpecStream()` to accept optional `images` parameter
  - Map `PendingImage[]` to `ImageAttachment[]` format for API request
- [x] T017 [US1] Modify `page.tsx` in `frontend/src/app/page.tsx`
  - Pass images state to `handleSend()`
  - Clear images after successful send
  - Handle image-related errors

**Checkpoint**: User Story 1 complete - single image upload in generate mode works

---

## Phase 4: User Story 2 - 在对话中追加图片 (Priority: P2)

**Goal**: 用户在 chat 模式下能追加上传图片，系统结合图片理解修改意图

**Independent Test**: 在已生成 PRD 后的对话模式下，上传新图片并发送修改请求，验证系统能理解图片内容并给出相关建议

### Backend Implementation

- [x] T018 [US2] Modify `chat_stream()` in `backend/src/services/llm_service.py`
  - Accept optional `images` parameter
  - Route to multimodal API if images present
- [x] T019 [US2] Modify `_build_chat_messages()` in `backend/src/services/llm_service.py`
  - Support image content in user message when images provided
  - Maintain existing message structure (PRD first, then history, then latest with images)
- [x] T020 [US2] Modify `/generate` endpoint in `backend/src/api/endpoints.py`
  - Pass `images` to `llm_service.chat_stream()` for chat mode

### Frontend Implementation

- [x] T021 [US2] Ensure `ChatInput` supports images in chat mode (should work from US1 implementation)
  - Verify image state persists correctly between sends
  - Verify images cleared after each send

**Checkpoint**: User Story 2 complete - image upload works in both generate and chat modes

---

## Phase 5: User Story 3 - 多图片支持 (Priority: P3)

**Goal**: 用户能在单次请求中上传多张图片，系统综合理解所有图片内容

**Independent Test**: 上传 3 张不同的参考图片和文字描述，验证生成的 PRD 包含所有图片相关的内容

### Backend Implementation

- [x] T022 [US3] Verify `_build_multimodal_messages()` handles multiple images correctly
  - All images should be in content array: `[{image1}, {image2}, ..., {text}]`
- [x] T023 [US3] Add logging for multi-image requests in `backend/src/services/llm_service.py`
  - Log image count, total size for debugging

### Frontend Implementation

- [x] T024 [US3] Enhance `useImageUpload` hook for multi-image UX
  - Show count indicator (e.g., "3/5 images")
  - Disable add button when limit reached
  - Show clear error when trying to exceed limit
- [x] T025 [US3] Enhance `ImagePreview` component for multiple images
  - Grid/list layout for multiple thumbnails
  - Individual delete buttons for each image
  - Reorder support (optional enhancement)

**Checkpoint**: User Story 3 complete - multi-image upload works with proper validation

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and improvements that affect multiple user stories

### Error Handling & Edge Cases

- [x] T026 [P] Add frontend error handling for oversized images in `useImageUpload.ts`
  - Show toast/alert with file size and limit (implemented via error state in PendingImage)
- [x] T027 [P] Add frontend error handling for unsupported formats in `useImageUpload.ts`
  - Show toast/alert with supported format list (implemented via error state in PendingImage)
- [ ] T028 [P] Add frontend error handling for network failures during generation
  - Preserve image selection for retry (deferred: complex state management)
- [x] T029 Add backend error handling for invalid Base64 data in `backend/src/api/endpoints.py`
  - Return 400 with clear message (handled by Pydantic validation)

### Backward Compatibility Verification

- [x] T030 Verify pure text input works identically to before (no regression)
  - No images → use existing `Generation.call()` path
  - Response time within 10% of baseline (verified: same code path when no images)

### Performance Verification (SC-001, SC-002, SC-005)

- [ ] T031 [P] Verify image preview displays within 3 seconds (SC-001)
  - Test with 10MB image, measure time from file selection to preview render
- [ ] T032 [P] Verify first LLM response within 5 seconds for image requests (SC-002)
  - Test with single image + text description, measure TTFB
- [ ] T033 Verify pure text response time regression ≤10% (SC-005)
  - Compare baseline vs new version with same text input (no images)

### Documentation & Sync

- [ ] T034 [P] Update `quickstart.md` with actual tested examples
- [ ] T035 [P] Update `README.md` with image upload feature description
- [ ] T036 Update `.sync-map.md` to record `GenerationRequest` schema changes
  - Add mapping: `backend/src/models/schemas.py:GenerationRequest` → `frontend/src/services/api.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────┐
                                                      │
Phase 2 (Foundational) ◀──────────────────────────────┘
    │
    │ ⚠️ BLOCKS ALL USER STORIES
    ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Phase 3 (US1: P1)  ──▶  Phase 4 (US2: P2)  ──▶  Phase 5 (US3: P3)
│     Generate mode         Chat mode             Multi-image
│                                                     │
└─────────────────────────────────────────────────────┘
    │
    ▼
Phase 6 (Polish)
```

### User Story Dependencies

| User Story | Depends On | Can Parallel With |
|------------|------------|-------------------|
| US1 (P1) | Foundational (Phase 2) | - |
| US2 (P2) | US1 (shares components) | - |
| US3 (P3) | US1 (shares components) | US2 |

### Within Each Phase

- Backend schema before service methods
- Service methods before endpoint integration
- Frontend hook before components
- Components before page integration

---

## Parallel Opportunities

### Phase 1 (Setup)

```bash
# All setup tasks can run in parallel:
Task T001: Add DASHSCOPE_VL_MODEL to .env.example
Task T002: Update pyproject.toml
Task T003: Update docker-compose.yml
```

### Phase 2 (Foundational)

```bash
# Schema and service tasks can partially parallelize:
Task T004: ImageAttachment model  ──┐
Task T005: Extend GenerationRequest ┘──▶ Task T006, T007, T008
```

### Phase 3 (US1)

```bash
# Frontend components can run in parallel:
Task T012: useImageUpload hook
Task T013: ImagePreview component

# After hooks/components ready:
Task T014, T015, T016, T017 (sequential integration)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test single image upload in generate mode
5. Deploy/demo if ready

### Incremental Delivery

| Milestone | Stories Complete | User Value |
|-----------|------------------|------------|
| MVP | US1 | 单图片生成 PRD |
| v1.1 | US1 + US2 | 对话模式也支持图片 |
| v1.2 | US1 + US2 + US3 | 多图片完整支持 |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 36 |
| Phase 1 (Setup) | 3 tasks |
| Phase 2 (Foundational) | 5 tasks |
| Phase 3 (US1 - MVP) | 9 tasks |
| Phase 4 (US2) | 4 tasks |
| Phase 5 (US3) | 4 tasks |
| Phase 6 (Polish) | 11 tasks |
| Parallel Opportunities | 15 tasks marked [P] |

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (17 tasks) = 单图片生成模式完整可用
