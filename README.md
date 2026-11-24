# Ted-Language-Learning
Foreign Language Scheduller / Personal AI-powered language learning platform

## Lingo Daily

매일의 언어 학습 계획과 진도를 관리하고, 영어·중국어 단어와 숙어를 복습하는 개인 학습 사이트입니다.

- 언어별 학습 계획, 일일 목표, 학습량 기록과 진도 차트
- 영어 20단어 + 10숙어, 중국어 20단어 + 5표현의 평일 학습
- 발음 표기와 브라우저 음성 재생, 전날 복습과 저녁 시험
- 주말 누적 시험, 오답·간격 복습, 휴대폰용 단어장 PNG 저장

기존 Sites 소스의 커밋 `65e0900cc5fc846b7859cff5fab645e0fdc87209`에서 가져왔습니다. `web/`, `worker/`, `scripts/`, `tests/`는 해당 소스와 동일합니다. 기존 GitHub 초기 커밋도 유지합니다.

## 로컬 실행

Node.js 22 이상을 사용합니다. 별도 패키지 설치는 필요하지 않습니다. 업로드 검증에는 Node.js 24를 사용했습니다.

```sh
git clone https://github.com/tedlee0802-bot/Ted-Language-Learning.git
cd Ted-Language-Learning
cp .openai/hosting.example.json .openai/hosting.json
node scripts/build.mjs
node scripts/preview.mjs
```

브라우저에서 http://localhost:4173 을 엽니다. Windows PowerShell에서는 `cp` 대신 `Copy-Item`을 사용할 수 있습니다.

로컬 숙제·시험 저장소는 메모리에서 동작하므로 서버를 종료하면 초기화됩니다. 대시보드 기록은 해당 브라우저의 localStorage에 남습니다. 미리보기 서버는 신뢰할 수 있는 로컬 환경에서 사용하세요.

## 테스트

```sh
node --test tests/homework.test.mjs
```

수업별 문항 수, 한국 시간에 따른 공개 시각, 전날 복습 조건, 채점, 오답·장기 복습 기록과 중복 입력 방지를 검증합니다.

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `web/` | 대시보드와 숙제 화면, 스타일, 발음 재생과 이미지 저장 |
| `worker/server.mjs` | 수업·시험·학습 기록 API |
| `worker/seed-data.mjs` | 첫 주 기본 단어·숙어 자료 |
| `scripts/` | Worker 빌드와 로컬 미리보기 |
| `tests/` | Node.js 내장 테스트 |
| `.openai/hosting.example.json` | 실제 프로젝트 ID를 제외한 Sites 설정 예시 |
| `COACH_OPERATIONS.md` | 개인 사이트의 수업 운영 방식 |

## 배포와 데이터

기존 사이트는 Sites에서 계속 운영합니다. 이 GitHub 업로드는 기존 사이트의 배포, 접근 권한, 저장 데이터를 변경하지 않습니다. GitHub Pages용 정적 배포 설정은 포함하지 않습니다. 숙제와 시험 기능에는 서버와 R2 `BUCKET` 바인딩이 필요합니다.

실제 배포에는 기존 프로젝트의 `.openai/hosting.json`과 비공개 인증 설정을 사용해야 합니다. 예시 설정의 프로젝트 ID는 로컬 빌드용 자리표시자입니다. 이 설정으로 새 Sites 프로젝트를 만들거나 기존 사이트를 덮어쓰지 마세요.

오전 07:30·오후 19:00의 공개 조건은 코드에 구현되어 있습니다. 정시 수업 생성·예약 실행은 별도 연결이 필요하며 이 저장소만으로 활성화되지 않습니다. 초기 자료는 2026년 10월 19~23일분이며, 이후 수업은 운영 API로 추가해야 합니다. 브라우저 음성은 기기에 설치된 음성을 사용합니다.

공개 저장소에는 비밀키, 실제 배포 설정, 개인 프로필·성적·학습 기록, 브라우저 백업, 생성된 `dist/`와 Sites 저장소의 과거 Git 이력을 포함하지 않습니다. 기본 단어·숙어와 테스트의 임시 데이터만 포함합니다.
