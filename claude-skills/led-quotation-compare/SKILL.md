---
name: led-quotation-compare
description: 중국 LED 디스플레이 공급사 견적을 같은 기준으로 정규화하고 한국 착지원가(CIF 과세가격 + 관세 + 국내비용, 부가세 별도)를 ㎡당으로 비교하는 스킬. 사양 누락·인코텀즈 함정·스페어/보증 차이를 찾아 협상 질문까지 만든다. Use when comparing LED display quotations (pixel pitch, SMD/GOB/COB/MIP, cabinet, driver IC, refresh rate, Incoterms FOB/CIF/EXW), calculating landed cost in KRW per square meter, building a quote comparison sheet, or drafting follow-up questions to suppliers.
metadata:
  version: 0.1.0
  owner: MHSYS LED Display PM
---

# LED 견적 비교 (착지원가 기준)

견적서의 "㎡당 가격"은 공급사마다 조건이 달라서 그대로 비교하면 틀린다.
이 스킬은 견적을 **같은 사양·같은 조건·같은 통화**로 맞춘 뒤, 한국에 도착해 창고에 들어오기까지의
**착지원가**로 비교한다.

## 진행 순서

1. **견적서 수집**: PDF·엑셀·이메일 본문에서 값을 뽑아 `templates/quotes_template.csv` 형식으로 정리한다.
   원문에 없는 값은 **비워 두고** 추정하지 않는다(추정이 필요하면 notes에 `추정`이라고 적는다).
2. **비교 가능성 점검 (Apples-to-apples)**: 아래 "정규화 체크리스트"로 사양이 다른 견적을 묶어서 비교하지 않는다.
3. **환율·관세율 확인**:
   - 관세율: UNI-PASS에서 해당 HSK의 적용 세율 조회(FTA 협정세율 적용 가능 여부 포함).
     모르면 `mhsys-trade-compliance` 스킬로 먼저 검토한다. **임의의 기본값을 쓰지 않는다.**
   - 환율: 견적 비교용은 당일 매매기준율, 실제 통관 원가는 관세청 고시 과세환율.
4. **계산 실행**:
   ```bash
   python scripts/landed_cost.py quotes.csv --fx USD=<원> --fx CNY=<원> --duty-rate <조회한 %> \
       --broker-fee <통관수수료 원> --inland <내륙운송 원> [--install-per-sqm <원>] [--format csv]
   ```
5. **결과 해석**: ㎡당 착지원가(부가세 제외) 순위 + `확인 필요 사항`을 함께 보고한다.
   1위가 Gate 조건(인증, 보증, 스페어)을 못 넘으면 순위 옆에 명시한다.
6. **협상 질문 작성**: 누락·모호한 항목마다 공급사에 보낼 질문을 만든다(영문/중문 초안). **발송은 Ted 승인 후.**
7. **(요청 시) Google Sheets 저장**: `--format csv` 결과를 시트에 넣는다. 기존 시트를 덮어쓰지 말고 새 탭에 추가한다.

## 정규화 체크리스트

| 항목 | 왜 중요한가 | 확인 질문 |
|---|---|---|
| 픽셀피치·패키지 | SMD·GOB·COB·flip-chip COB·MIP는 원가 구조와 내구성이 다르다 | 같은 피치·같은 패키지끼리 비교했는가? |
| 캐비닛 규격 | 600×337.5(16:9) vs 640×360 등 → 같은 수량이라도 면적이 다르다 | ㎡로 환산했는가? |
| 가격 기준 | 캐비닛당 / ㎡당 / 총액 | 견적에 컨트롤러·전원·케이블·브래킷 포함 여부 |
| 드라이버 IC | 리프레시·그레이스케일·저휘도 품질 결정 | 브랜드·모델(예: 공통 양극 vs 공통 음극) |
| 리프레시·그레이스케일 | 방송·촬영 용도면 핵심 | 3840Hz 이상? 실측 성적서 있는가? |
| 밝기(nit) | 실내/실외, 캘리브레이션 후 값인지 | 캘리브레이션 후 밝기인가? |
| 수신카드·송신 컨트롤러 | 호환성·유지보수 | Novastar·Colorlight 등 표준인가, 독자 규격인가 |
| 전원 공급장치 | 고장률 1순위 부품 | 브랜드, 이중화 여부 |
| 스페어 | 무상 스페어 % (모듈·전원·수신카드) | 같은 배치(Bin) 모듈인가? |
| 보증 | 기간, 범위(부품만/인건비 포함), 반송비 부담 | 한국 내 교체 방식 |
| 인코텀즈 | FOB/CIF/EXW/DDP에 따라 원가가 다르다 | 지정 장소(항구)까지 명시됐는가 |
| 결제 조건 | 선금 비율 = 자금 부담·리스크 | T/T 비율, L/C 가능 여부 |
| 납기 | 생산일 vs 선적일 vs 도착일 | "30일"이 무엇의 30일인가 |
| 견적 유효기간 | 원자재·환율 변동 | 유효기간 지난 견적은 재확인 |
| 인증 | 한국 KC·전파, 수출용 CE·FCC·UL | 인증서 사본·모델명 일치 |

## 계산 규칙 (스크립트와 동일)

- 면적(㎡) = 캐비닛 가로(mm) × 세로(mm) × 수량 ÷ 1,000,000
- 과세가격(CIF) = 물품가 + 운임 + 보험료 + (EXW이면) 중국 내 비용 → × 환율
  - CFR·CPT·CIF·CIP·DAP·DPU·DDP: 운임은 견적에 포함으로 본다
  - CIF·CIP·DAP·DPU·DDP: 보험도 포함으로 본다
- 관세 = 과세가격 × 관세율
- 수입 부가세 = (과세가격 + 관세) × 10%
- 착지원가(부가세 제외) = 과세가격 + 관세 + 통관수수료 + 내륙운송 + (선택) 설치비
- **마진·판가 판단은 부가세 제외 금액**, 자금 계획(현금 지출)은 부가세 포함 금액

스크립트가 자동으로 표시하는 경고: 운임 누락, 보험료 미기재, EXW 중국 내 비용, DDP 수입자 확인,
CIF인데 운임이 중복 기재됨, 사양 누락(드라이버 IC·리프레시·밝기·보증·납기), 스페어 0%.

## 보고 형식

```
[비교 범위] P1.5 실내 COB/SMD/GOB 3개 견적 · 약 4.6~4.9㎡ · 견적일 …
[가정] 환율 USD …, CNY … (기준일) · 관세율 …% (출처·조회일) · 국내비용 …

[결과 표] landed_cost.py 출력

[해석]
- ㎡당 착지원가 최저: … (단, 패키지가 달라 직접 비교 주의)
- 사양 대비 가성비: …
- 숨은 비용: 스페어 0%, 보험 미가입, EXW …

[협상 질문]
- <공급사>: 1) … 2) …  (영문/중문 초안 첨부)

[다음 행동] 샘플 요청 / 사양 재견적 / 인증서 확인 — 담당·기한
```

## 공급사 질문 템플릿 (영문 — 해외영업 실무 표현)

- "Could you send me the latest quotation with the driver IC model and refresh rate specified?"
- "Please confirm whether the price includes the sending controller, power supplies, and cables."
- "Could you quote on an FCA/FOB Shenzhen basis and add a separate line for ocean freight to Busan?"
- "How many spare modules and power supplies are included, and are they from the same production batch?"
- "Can you issue a Certificate of Origin under the Korea–China FTA or RCEP for this shipment?"
- "I'd like to confirm the delivery schedule. Is the 30-day lead time counted until production completion or until shipment?"

중국어 초안이 필요하면 같은 내용을 중국어로 작성한다(공급사 담당자에 맞춰 간체 사용).

## 함께 쓰는 스킬
- `mhsys-trade-compliance` — HSK·관세율·원산지증명서·인증 확인
- `led-vendor-benchmark` — 착지원가 결과를 "원가 경쟁력" 점수 근거로 사용
