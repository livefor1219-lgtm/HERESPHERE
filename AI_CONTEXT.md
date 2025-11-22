# Herusphere AI Agent App - 프로젝트 상황 및 플로우 문서

## 📋 프로젝트 개요

**프로젝트명**: Herusphere Personal Command Center  
**목적**: 사용자의 "비서실장"이자 "콘텐츠 공장" 역할을 하는 AI 기반 자동화 백엔드  
**타입**: AI 에이전트 웹 애플리케이션 (PWA)  
**배포**: Vercel  
**주요 기술**: 
- 프론트엔드: HTML/CSS/JavaScript (단일 페이지 앱)
- 백엔드: Next.js App Router (프록시 API)
- 자동화: n8n 워크플로우
- AI: OpenAI GPT-4o, Whisper
- 데이터베이스: Supabase, Notion
- 통합: Google Calendar, Slack

---

## 🏗️ 아키텍처 구조

### 프론트엔드 (Client)
- **파일**: `index.html` (단일 페이지 애플리케이션)
- **위치**: 프로젝트 루트
- **기능**: 
  - 5가지 작업 모드 선택 UI (칩 버튼)
  - 텍스트 입력 및 전송
  - Glassmorphism 디자인
  - PWA 지원

### 백엔드 API (Server)
- **파일**: `app/api/proxy/route.ts`
- **경로**: `/api/proxy`
- **역할**: n8n 웹훅으로의 프록시 (CORS 해결)
- **메서드**: POST

### n8n 워크플로우
- **웹훅 URL**: `https://sunhyeyun.app.n8n.cloud/webhook-test/herusphere-action`
- **역할**: 
  - `actionType`에 따른 분기 처리 (Route by Action Type)
  - Google AI Studio와의 연동
  - 다양한 AI 작업 처리

---

## 🔄 데이터 플로우

```
[사용자 입력]
    ↓
[프론트엔드: index.html]
    - 작업 모드 선택 (5가지)
    - 텍스트 입력
    - 전송 버튼 클릭
    ↓
[POST 요청: /api/proxy]
    - actionType: 선택된 모드에 따라 설정
    - content: 사용자 입력 텍스트
    ↓
[백엔드: app/api/proxy/route.ts]
    - 프록시 역할
    - CORS 헤더 처리
    - actionType 매핑 (image_prompt → generate_image_prompt 등)
    - n8n으로 요청 전달
    ↓
[n8n 워크플로우]
    - Webhook Trigger 수신
    - Workflow Configuration (중앙 설정 저장소)
    - Route by Action Type 노드로 분기 (5가지 경로)
    ↓
┌─────────────┬──────────────┬─────────────┬──────────────┬─────────────┐
│ Audio       │ Instagram    │ Image       │ Note         │ Email       │
│ Transcribe  │ Post         │ Prompt      │ Categorize   │ Draft       │
└─────────────┴──────────────┴─────────────┴──────────────┴─────────────┘
    ↓              ↓              ↓              ↓              ↓
[OpenAI GPT-4o / Whisper 처리]
    ↓
[Supabase 저장] → [Notion 저장] → [Google Calendar] → [Slack 알림]
    ↓
[응답 반환]
    - n8n → 백엔드 → 프론트엔드
    - 사용자에게 결과 표시
```

---

## 🎯 작업 모드 및 actionType 매핑

| 모드 | actionType | 설명 | AI 페르소나 |
|------|-----------|------|------------|
| 📝 Smart Memo | `save_note` | 자동 분류 - Second Brain | 세컨드 브레인 매니저 |
| 📸 Instagram | `instagram_post` | 도혜나 에디터 - 캡션 작성 | 도혜나 에디터 |
| 🎨 Art Director | `generate_image_prompt` | 미드저니 프롬프트 생성 | 크리에이티브 디렉터 |
| 📧 Email | `draft_email` | 비즈니스 이메일 초안 | 커뮤니케이션 매니저 |
| 🎙️ Meeting | `transcribe_audio` | 회의록 요약 (텍스트 입력 시) | 미팅 분석 전문가 |

### ⚠️ 중요: actionType 값 차이
- 프론트엔드에서 사용: `save_note`, `instagram_post`, `image_prompt`, `draft_email`, `audio_transcription`
- n8n에서 실제 사용: `save_note`, `instagram_post`, `generate_image_prompt`, `draft_email`, `transcribe_audio`
- **매핑 필요**: `image_prompt` → `generate_image_prompt`, `audio_transcription` → `transcribe_audio`

---

## 📤 API 요청 형식

### 프론트엔드 → 백엔드 (`/api/proxy`)

**현재 구현 (간단한 형식)**:
```json
{
  "actionType": "save_note" | "instagram_post" | "image_prompt" | "draft_email" | "audio_transcription",
  "content": "사용자가 입력한 텍스트 내용"
}
```

### 백엔드 → n8n 웹훅

**n8n이 기대하는 완전한 형식**:
```json
{
  "actionType": "save_note" | "instagram_post" | "generate_image_prompt" | "draft_email" | "transcribe_audio",
  "imageContext": "이미지 설명 (instagram_post용)",
  "inspiration": "영감 텍스트 (generate_image_prompt용)",
  "noteContent": "메모 내용 (save_note용)",
  "recipient": "수신자 (draft_email용)",
  "emailContext": "이메일 맥락 (draft_email용)",
  "tone": "이메일 톤 (draft_email용)",
  "data": "바이너리 데이터 (오디오/이미지)"
}
```

**중요**: 
- `actionType` 필드명은 반드시 `actionType` (소문자 t)
- n8n의 "Route by Action Type" 노드가 이 값을 기준으로 분기 처리
- 프론트엔드의 `content` 필드를 각 actionType에 맞는 필드로 매핑 필요
  - `save_note`: `noteContent`
  - `instagram_post`: `imageContext`
  - `generate_image_prompt`: `inspiration`
  - `draft_email`: `emailContext` + `recipient` + `tone`
  - `transcribe_audio`: `data` (바이너리)

---

## 🔧 현재 구현 상태

### ✅ 완료된 기능
1. 프론트엔드 작업 모드 선택 UI (칩 버튼)
2. actionType 매핑 로직
3. 프록시 API (`/api/proxy`)
4. n8n 웹훅 연동
5. CORS 처리
6. 이미지 Unsplash로 교체 (404 해결)
7. PWA 설정

### ⚠️ 주의사항
- **파일 경로**: `app/api/proxy/route.ts` (Next.js App Router 표준)
- **manifest.json**: 루트에 위치 (`/manifest.json`)
- **프록시 URL**: `/api/proxy` (상대 경로)

---

## 🎨 UI/UX 특징

- **Glassmorphism 디자인**: 반투명 배경, 블러 효과
- **네온 글로우**: 선택된 모드에 네온 효과
- **모바일 최적화**: 가로 스크롤 칩 버튼
- **PWA**: 홈 화면 추가 가능

---

## 🔗 연동 포인트

### n8n 워크플로우 구조
1. **Webhook Trigger**: `https://sunhyeyun.app.n8n.cloud/webhook/herusphere-action`
2. **Workflow Configuration**: 중앙 설정 저장소
3. **Route by Action Type 노드**: `actionType` 필드로 분기
4. **예상되는 actionType 값들**:
   - `save_note` - Note Categorization
   - `instagram_post` - Instagram Post
   - `generate_image_prompt` - Image Prompt Generation
   - `draft_email` - Email Draft
   - `transcribe_audio` - Audio Transcription

### AI 모델 및 통합
- **OpenAI GPT-4o**: 모든 텍스트 생성 작업
- **Whisper**: 음성-텍스트 변환
- **Supabase**: 메인 데이터베이스 (`herusphere_data` 테이블)
- **Notion**: 세컨드 브레인 저장소
- **Google Calendar**: 자동 일정 생성
- **Slack**: 작업 완료 알림 (한국어)

### Supabase 테이블 구조 (`herusphere_data`)
- `content` (text): AI 생성 콘텐츠
- `category` (text): 자동 분류된 카테고리
- `tags` (text/json): 추출된 태그 배열
- `created_at` (timestamp): 생성 시간

### Notion 데이터베이스 속성
- `Title`: 제목
- `Category`: 카테고리
- `Content`: 내용

## 🎨 헤루스피어 세계관

모든 AI 노드는 "헤루스피어(Herusphere)"라는 통합된 세계관 안에서 각자의 역할을 수행합니다:

- **미팅 분석 전문가** - 회의록 처리 및 요약
- **도혜나 에디터** - 인스타그램 콘텐츠 작성 (세련되고 위트있는 톤)
- **크리에이티브 디렉터** - 미드저니 프롬프트 생성 (예술적 스타일, 조명, 구도)
- **세컨드 브레인 매니저** - 메모 자동 분류 (7가지 카테고리)
- **커뮤니케이션 매니저** - 이메일 초안 작성 (맥락과 톤에 맞춘 전문 이메일)

---

## 📝 각 액션 타입별 상세 플로우

### 1. Audio Transcription (`transcribe_audio`)
- Webhook → Config → Switch → Whisper → GPT-4 요약 → Supabase 저장 → Google Calendar 이벤트 생성 → Notion 저장 → Slack 알림 → 응답
- **출력**: 3-5문장 요약, 담당자별 액션 아이템, 중요 결정사항 (JSON 형식)

### 2. Instagram Post (`instagram_post`)
- Webhook → Config → Switch → Instagram Caption 생성 → 이미지 최적화 (1080x1080) → 응답
- **출력**: 세련되고 위트있는 캡션, 이모지 활용, 인스타그램 최적화

### 3. Image Prompt Generation (`generate_image_prompt`)
- Webhook → Config → Switch → Midjourney 프롬프트 생성 → 응답
- **출력**: Midjourney v6 최적화 프롬프트, 예술적 스타일/조명/구도, 색상 팔레트, 기술 파라미터, 4가지 변형

### 4. Note Categorization (`save_note`)
- Webhook → Config → Switch → AI 자동 분류 → Supabase 저장 → Google Calendar/Notion 저장 → Slack 알림 → 응답
- **카테고리**: 사업 아이디어, 영화 레퍼런스, 마케팅 문구, 개인, 기술 노트, 회의 노트, 기타
- **출력**: 3-5개 관련 태그, 적절한 제목 제안

### 5. Email Draft (`draft_email`)
- Webhook → Config → Switch → 이메일 초안 생성 → 응답
- **출력**: 명확한 제목, 적절한 인사말과 본문 (JSON 형식: subject, body)

## 📝 다음 단계 제안

### 프론트엔드 개선
1. **actionType 매핑 로직 추가**: `image_prompt` → `generate_image_prompt`, `audio_transcription` → `transcribe_audio`
2. **필드 매핑**: `content`를 각 actionType에 맞는 필드로 변환
3. **에러 처리 강화**: n8n 응답 오류 시 사용자에게 명확한 메시지
4. **로딩 상태 개선**: 각 모드별 맞춤 로딩 메시지
5. **응답 표시**: n8n에서 반환된 결과를 UI에 표시
6. **히스토리**: 전송한 작업 내역 저장 및 표시

### 백엔드 개선
1. **데이터 변환 로직**: 프론트엔드의 간단한 형식을 n8n이 기대하는 완전한 형식으로 변환
2. **에러 핸들링**: n8n 응답 오류 처리 및 사용자 친화적 메시지

### n8n 워크플로우
1. **활성화**: 현재 `active: false` 상태 → 활성화 필요
2. **테스트**: 각 actionType별 엔드투엔드 테스트

---

## 🚀 배포 정보

- **플랫폼**: Vercel
- **GitHub**: `livefor1219-lgtm/HERESPHERE`
- **도메인**: (Vercel 배포 후 자동 생성)

---

**마지막 업데이트**: 2025년 11월 22일  
**작성 목적**: n8n, Google AI Studio, Cursor AI 간 협업을 위한 컨텍스트 공유

