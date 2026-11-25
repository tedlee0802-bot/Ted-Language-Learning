# MHSYS Claude Skills

MHSYS 해외영업·LED Display PM 업무용 Claude Code 스킬 모음입니다.
Lingo Daily 앱 코드와는 독립적이며, 앱 빌드·테스트에 영향을 주지 않습니다.

## 구성

### MHSYS 전용 (직접 작성)
| 스킬 | 용도 |
|---|---|
| `mhsys-trade-compliance` | 중국 → 한국 수입 통관(HSK·FTA·인증), 나라장터 조달 원산지·직접생산, EU·북미 수출 인증·원산지·Section 301 |
| `led-vendor-benchmark` | LED 공급사 선정(S 모드) / 조달시장 경쟁사 분석(C 모드) — 범위 설정 → 점수 카드 → 보고서 |
| `led-quotation-compare` | 견적 정규화 + ㎡당 착지원가(CIF·관세·국내비용, 부가세 별도). `scripts/landed_cost.py` 포함 |
| `mhsys-daily-briefing` | 08:50 데일리 브리핑, 목요일 16:00 주간 결산, 메일 4단계 분류, 거래처 관계 메모, 미회신 감지, 승인 게이트 |
| `led-buyer-intelligence` | 독일·폴란드·북미 B2B 바이어 발굴 5단계(신호 → 점수 → 접근 경로 → 정보 보강 → 초안), 국가별 콜드메일 규제 메모 |

### ECC에서 그대로 가져온 것 (affaan-m/ECC 커밋 `4adeee6`, 2026-11-19, 수정 없음)
| 이름 | 종류 | 용도 |
|---|---|---|
| `council` | 스킬 | 4개 관점(설계자·회의론자·실용주의자·비평가) 의사결정. 하위 에이전트 3개를 사용 |
| `product-lens` | 스킬 | 아이디어 진행/중단 진단, ICE 우선순위. 실행 폴더에 `PRODUCT-BRIEF.md` 생성 |
| `market-research` | 스킬 | 출처 기반 시장·경쟁·기술 조사 |
| `short-video-distribution` | 스킬 | 쇼츠·릴스·틱톡 배포. 정확한 문안 승인 전 게시 금지, 비공개 기본 |
| `regex-vs-llm-structured-text` | 스킬 | 견적서·송장 파싱 설계(정규식 우선 + AI 검증) |
| `/plan-prd` | 명령 | 기획서(PRD) 작성. `.claude/prds/`에 파일 생성 |

ECC 원본 일부는 설치하지 않은 다른 ECC 스킬(`knowledge-ops`, `/plan`, `brand-voice` 등)을 언급합니다.
없어도 핵심 기능은 동작합니다.

## PC에 설치 (Windows · Git Bash)

```bash
git clone -b claude/vibrant-allen-ukopk2 https://github.com/tedlee0802-bot/Ted-Language-Learning.git ted-skills
```
```bash
mkdir -p ~/.claude/skills ~/.claude/commands && cp -R ted-skills/claude-skills/skills/* ~/.claude/skills/ && cp ted-skills/claude-skills/commands/*.md ~/.claude/commands/
```

업데이트할 때는 `ted-skills` 폴더에서 `git pull` 후 두 번째 명령을 다시 실행합니다.
설치 후 Claude Code를 다시 시작하세요. 훅이나 `settings.json`은 건드리지 않습니다.

## 견적 계산기 단독 실행

```bash
python claude-skills/skills/led-quotation-compare/scripts/landed_cost.py claude-skills/skills/led-quotation-compare/templates/quotes_template.csv --fx USD=1400 --fx CNY=195 --duty-rate 0 --broker-fee 150000 --inland 400000
```

`--duty-rate`는 기본값이 없습니다. UNI-PASS에서 조회한 세율을 넣으세요.
템플릿의 SAMPLE-A/B/C는 계산 확인용 가짜 데이터입니다.

## 주의
- 관세율·인증 대상·조달 기준·콜드메일 규제는 바뀝니다. 스킬은 "확인처와 조회일"을 남기도록 설계되어 있으며, 법률 자문을 대신하지 않습니다.
- 출처 표기는 `THIRD_PARTY_NOTICES.md`를 참고하세요.
