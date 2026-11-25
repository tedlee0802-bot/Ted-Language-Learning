# MHSYS Claude Skills

MHSYS 해외영업·LED Display PM 업무용 Claude Code 스킬 모음입니다.
Lingo Daily 앱 코드와는 독립적이며, 앱 빌드·테스트에 영향을 주지 않습니다.

| 스킬 | 용도 | 비고 |
|---|---|---|
| `mhsys-trade-compliance` | 중국 → 한국 수입 통관(HSK·FTA·인증), 나라장터 조달 원산지·직접생산, EU·북미 수출 인증·원산지·Section 301 | ECC `customs-trade-compliance`의 일반 원칙 참고, 한국·LED 내용 신규 |
| `led-vendor-benchmark` | LED 공급사 선정(S 모드) / 조달시장 경쟁사 분석(C 모드) — 범위 설정 → 점수 카드 → 보고서 | ECC 경쟁 분석 3종을 하드웨어 소싱용으로 재작성 |
| `led-quotation-compare` | 견적 정규화 + ㎡당 착지원가(CIF·관세·국내비용, 부가세 별도) 계산 | `scripts/landed_cost.py` 포함 (Python 3.10+, 표준 라이브러리만) |
| `mhsys-daily-briefing` | 08:50 데일리 브리핑, 목요일 16:00 주간 결산, Todoist 갱신, 외부 발송 승인 게이트 | 업무일지 읽기 전용, 외부 발송은 문안 단위 승인 |

## PC에 설치 (Windows · Git Bash)

```bash
git clone -b claude/vibrant-allen-ukopk2 https://github.com/tedlee0802-bot/Ted-Language-Learning.git ted-skills
```
```bash
mkdir -p ~/.claude/skills && cp -R ted-skills/claude-skills/mhsys-* ted-skills/claude-skills/led-* ~/.claude/skills/
```

설치 후 Claude Code를 다시 시작하면 `/mhsys-daily-briefing`처럼 이름으로 부르거나,
"이 견적 3개 비교해줘"처럼 말하면 자동으로 해당 스킬이 쓰입니다.
훅이나 `settings.json`은 건드리지 않습니다.

## 견적 계산기 단독 실행

```bash
python claude-skills/led-quotation-compare/scripts/landed_cost.py claude-skills/led-quotation-compare/templates/quotes_template.csv --fx USD=1400 --fx CNY=195 --duty-rate 0 --broker-fee 150000 --inland 400000
```

`--duty-rate`는 기본값이 없습니다. UNI-PASS에서 조회한 세율을 넣으세요.
템플릿의 SAMPLE-A/B/C는 계산 확인용 가짜 데이터입니다.

## 주의
- 관세율·인증 대상·조달 기준은 바뀝니다. 스킬은 "확인처와 조회일"을 남기도록 설계되어 있으며, 법률 자문을 대신하지 않습니다.
- 출처 표기는 `THIRD_PARTY_NOTICES.md`를 참고하세요.
