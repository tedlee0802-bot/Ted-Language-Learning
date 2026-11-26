"""Build the 1-year English study-plan workbook.

Usage:
  python build_plan_xlsx.py <words.json> <hailey.json> <meanings_dir> <out.xlsx> [anki_out.tsv]

words.json  : output of build_wordlist.py (10,000 ranked words)
hailey.json : {book title: [{n, src, en, ko}]} extracted from the learner's own Hailey PDFs (not in repo)
"""
import csv, datetime as dt, glob, json, os, sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

WORDS, HAILEY, MDIR, OUT = sys.argv[1:5]
ANKI = sys.argv[5] if len(sys.argv) > 5 else None

START = dt.date(2026, 11, 30)          # default start (Monday) - editable in the sheet
DAYS = 365
NEW_WORD_WEEKS = 50                    # 50 weeks x 200 words = 10,000
WEEK_PATTERN = [29, 29, 29, 29, 28, 28, 28]   # = 200 per week
HAILEY_PER_DAY = 5                     # 1,800 sentences / 5 = 360 days
BOOK_ORDER = ['일상 생활', '리액션', '누구나 쓰는 말 2', '회사 생활 1', 'should', 'could', 'would', '쇼핑', 'what',
              'that', '회사 생활 2', 'may, might, must', 'have pp 1 - 초급', 'have pp 2 - 중급', '수동태',
              '사역동사 let, make, have', '자주 쓰는 부사', '브랜드']

FONT = 'Arial'
F = Font(name=FONT, size=10)
FB = Font(name=FONT, size=10, bold=True)
FH = Font(name=FONT, size=10, bold=True, color='FFFFFF')
FT = Font(name=FONT, size=14, bold=True)
FBLUE = Font(name=FONT, size=10, color='0000FF', bold=True)
HEAD = PatternFill('solid', fgColor='1F4E78')
YEL = PatternFill('solid', fgColor='FFFF00')
INPUT = PatternFill('solid', fgColor='FFF2CC')
REV = PatternFill('solid', fgColor='E2EFDA')
thin = Side(style='thin', color='BFBFBF')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical='top')
CENTER = Alignment(horizontal='center', vertical='center', wrap_text=True)

words = json.load(open(WORDS, encoding='utf-8'))
books = json.load(open(HAILEY, encoding='utf-8'))
assert sorted(BOOK_ORDER) == sorted(books), set(books) ^ set(BOOK_ORDER)
meaning = {}
for f in sorted(glob.glob(os.path.join(MDIR, 'meanings_ko_*.tsv'))):
    for line in open(f, encoding='utf-8'):
        if line.strip():
            w, k = line.rstrip('\n').split('\t')
            meaning.setdefault(w, k)

# ------------------------------------------------------------------ schedule
word_day = {}      # rank -> day
day_words = {}     # day -> (first, last)
rank = 1
for d in range(1, NEW_WORD_WEEKS * 7 + 1):
    n = WEEK_PATTERN[(d - 1) % 7]
    first, last = rank, min(rank + n - 1, len(words))
    day_words[d] = (first, last)
    for r in range(first, last + 1):
        word_day[r] = d
    rank = last + 1
assert rank == 10001, rank

sentences = []     # (seq, book, n, src, en, ko)
for b in BOOK_ORDER:
    for r in books[b]:
        sentences.append((len(sentences) + 1, b, r['n'], r['src'], r['en'], r['ko']))
sent_day = {s[0]: (s[0] - 1) // HAILEY_PER_DAY + 1 for s in sentences}
day_sents = {}
for seq, d in sent_day.items():
    a, b = day_sents.get(d, (seq, seq))
    day_sents[d] = (min(a, seq), max(b, seq))


def phase(d):
    if d <= 91:
        return 'Q1 기초 구어 (1~2,600)'
    if d <= 182:
        return 'Q2 일상·업무 확장 (2,601~5,200)'
    if d <= 273:
        return 'Q3 뉴스·비즈니스 (5,201~7,800)'
    if d <= 350:
        return 'Q4 고급 어휘 (7,801~10,000)'
    return '최종 총복습'


def rng(a, b):
    return f'#{a}–#{b}' if a != b else f'#{a}'


def hailey_label(a, b):
    sa, sb = sentences[a - 1], sentences[b - 1]
    if sa[1] == sb[1]:
        return f'{sa[1]} {sa[2]}–{sb[2]}'
    return f'{sa[1]} {sa[2]}–{books[sa[1]][-1]["n"]} / {sb[1]} 1–{sb[2]}'


def header(ws, row, cols, widths):
    for i, (c, w) in enumerate(zip(cols, widths), 1):
        cell = ws.cell(row=row, column=i, value=c)
        cell.font, cell.fill, cell.alignment, cell.border = FH, HEAD, CENTER, BOX
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=1)
    ws.auto_filter.ref = f'A{row}:{get_column_letter(len(cols))}{row}'


wb = Workbook()

# ------------------------------------------------------------------ 1. 설정·대시보드
ws = wb.active
ws.title = '설정'
ws['A1'] = 'Ted × Anna · 1년 영어 플랜 (10,000단어 · 딴딴영어 · 헤일리 1,800문장)'
ws['A1'].font = FT
ws['A3'], ws['B3'] = '시작일 (변경 가능)', START
ws['B3'].number_format = 'yyyy-mm-dd'
ws['B3'].font, ws['B3'].fill = FBLUE, YEL
ws['C3'] = '← 노란 칸만 바꾸면 모든 시트의 날짜가 자동으로 바뀝니다.'
ws['A4'], ws['B4'] = '종료일', '=B3+364'
ws['B4'].number_format = 'yyyy-mm-dd'
ws['A5'], ws['B5'] = '오늘 Day', '=MAX(1,MIN(365,TODAY()-B3+1))'
ws['A7'] = '진도 현황'; ws['A7'].font = FB
stats = [
    ('외운 단어 (단어 시트 체크 O)', "=COUNTIF('단어 10000'!K:K,\"O\")", 10000),
    ('완료한 헤일리 문장 (체크 O)', "=COUNTIF('헤일리 1800'!H:H,\"O\")", 1800),
    ('정리한 딴딴영어 Shorts', "=COUNTA('딴딴영어'!C3:C367)", 365),
    ('일일 플랜 완료일 (단어 신규 O)', "=COUNTIF('일일 플랜'!M:M,\"O\")", 365),
]
ws['A8'], ws['B8'], ws['C8'], ws['D8'] = '항목', '완료', '목표', '달성률'
for c in 'ABCD':
    ws[f'{c}8'].font, ws[f'{c}8'].fill, ws[f'{c}8'].alignment = FH, HEAD, CENTER
for i, (label, fml, goal) in enumerate(stats, 9):
    ws[f'A{i}'], ws[f'B{i}'], ws[f'C{i}'] = label, fml, goal
    ws[f'D{i}'] = f'=IF(C{i}=0,0,B{i}/C{i})'
    ws[f'D{i}'].number_format = '0.0%'
    ws[f'B{i}'].number_format = ws[f'C{i}'].number_format = '#,##0'
ws['A14'] = '하루 루틴 (약 70분)'; ws['A14'].font = FB
routine = [
    ('① 어제 단어 복습', '10분', '어제 범위 28~29개: 단어만 보고 뜻·발음 말하기 → 틀린 것만 예문 소리 내어 읽기'),
    ('② 오늘 새 단어', '30분', '단어 28~29개: 발음기호 보며 3번 소리 내기 → 예문 1번 쉐도잉 → 다 외우면 K열에 O'),
    ('③ 헤일리 복습', '5분', '어제 5문장: 한국어만 보고 영어로 말하기 (막히면 영상 0.75배속)'),
    ('④ 헤일리 새 문장', '10분', '오늘 5문장 × 4회 쉐도잉 (초급 0.5배 → 0.75배 → 정속)'),
    ('⑤ 딴딴영어', '10분', '어제 Shorts 1개 복습 + 오늘 Shorts 1개: 핵심 구문·예문을 딴딴영어 시트에 기록'),
    ('⑥ 주간·월간 복습 (선택)', '5분', '일일 플랜의 D-7, D-30 범위를 빠르게 훑기 (인지만 확인)'),
]
ws['A15'], ws['B15'], ws['C15'] = '단계', '시간', '방법'
for c in 'ABC':
    ws[f'{c}15'].font, ws[f'{c}15'].fill = FH, HEAD
for i, row in enumerate(routine, 16):
    for j, v in enumerate(row):
        ws.cell(row=i, column=j + 1, value=v).alignment = WRAP
ws['A23'] = '입력 칸 안내'; ws['A23'].font = FB
legend = [
    '노란 칸: 시작일 입력 (설정!B3)',
    '연한 노랑 칸: 체크·기록 칸 — 완료 시 대문자 O 입력 (드롭다운 제공)',
    '연두색 행: 복습 전용일 (신규 없음)',
    '단어 뜻: 1~1,000위(1~5주차)는 작성 완료. 6주차부터는 Anna가 매주 일요일에 다음 주 200개의 뜻·예문을 채웁니다.',
    '예문 출처: "헤일리 …" = 헤일리쌤 실제 미드 문장(한국어 해석 포함), "WordNet" = 사전 예문',
    '빈도 기준: 미국 드라마·영화 자막(OpenSubtitles) 50% + 종합 코퍼스(wordfreq) 50%, 원형(lemma) 기준',
]
for i, t in enumerate(legend, 24):
    ws[f'A{i}'] = '• ' + t
ws.column_dimensions['A'].width = 30
ws.column_dimensions['B'].width = 14
ws.column_dimensions['C'].width = 90
ws.column_dimensions['D'].width = 10
for row in ws.iter_rows():
    for c in row:
        if c.font != FT and not c.font.bold:
            c.font = F if c.coordinate != 'B3' else FBLUE

START_REF = "'설정'!$B$3"
ok_dv = lambda: DataValidation(type='list', formula1='"O,X,△"', allow_blank=True)

# ------------------------------------------------------------------ 2. 일일 플랜
wp = wb.create_sheet('일일 플랜')
cols = ['Day', '날짜', '요일', '주차', '단계', '새 단어 (순위)', '개수', '복습: 어제 단어', '복습 D-7 (선택)',
        '복습 D-30 (선택)', '헤일리 새 문장 (책·번호)', '헤일리 복습 (어제)', '단어 신규 O', '단어 복습 O',
        '헤일리 O', '딴딴 O', '메모']
header(wp, 2, cols, [6, 11, 6, 6, 26, 15, 6, 15, 15, 15, 34, 34, 8, 8, 8, 8, 30])
wp['A1'] = '일일 플랜 — 하루 할당량 (신규 + 전일 복습)'; wp['A1'].font = FT
dv = ok_dv(); wp.add_data_validation(dv)
for d in range(1, DAYS + 1):
    r = d + 2
    wp.cell(row=r, column=1, value=d)
    wp.cell(row=r, column=2, value=f'={START_REF}+A{r}-1').number_format = 'yyyy-mm-dd'
    wp.cell(row=r, column=3, value=f'=CHOOSE(WEEKDAY(B{r}),"일","월","화","수","목","금","토")')
    wp.cell(row=r, column=4, value=f'W{min(52, (d - 1) // 7 + 1)}')
    wp.cell(row=r, column=5, value=phase(d))
    if d in day_words:
        a, b = day_words[d]
        wp.cell(row=r, column=6, value=rng(a, b)); wp.cell(row=r, column=7, value=b - a + 1)
    else:
        if d < 365:
            # final review: 14 days cover 10,000 words (~715/day, recognition only)
            per = 10000 / 14
            a, b = int((d - 351) * per) + 1, int((d - 350) * per)
            wp.cell(row=r, column=6, value=f'총복습 {rng(a, b)}')
        else:
            wp.cell(row=r, column=6, value='최종 시험 (무작위 300개)')
        wp.cell(row=r, column=7, value=0)
    for col, back in ((8, 1), (9, 7), (10, 30)):
        if d - back in day_words:
            a, b = day_words[d - back]
            wp.cell(row=r, column=col, value=rng(a, b))
    if d in day_sents:
        wp.cell(row=r, column=11, value=hailey_label(*day_sents[d]))
    else:
        wp.cell(row=r, column=11, value='헤일리 총복습 (책별 한국어→영어 말하기)')
    if d - 1 in day_sents:
        wp.cell(row=r, column=12, value=hailey_label(*day_sents[d - 1]))
    for c in range(1, len(cols) + 1):
        cell = wp.cell(row=r, column=c)
        cell.font, cell.border = F, BOX
        cell.alignment = CENTER if c in (1, 2, 3, 4, 7, 13, 14, 15, 16) else Alignment(vertical='center', wrap_text=True)
        if c >= 13:
            cell.fill = INPUT
        elif d not in day_words:
            cell.fill = REV
    dv.add(f'M{r}:P{r}')

# ------------------------------------------------------------------ 3. 단어 10000
wv = wb.create_sheet('단어 10000')
cols = ['순위', 'Day', '날짜', '단어', '발음기호 (미국식 IPA)', '품사', '뜻 (한국어)', '예문', '예문 해석', '예문 출처', '암기 O']
header(wv, 2, cols, [7, 6, 11, 16, 20, 10, 30, 50, 40, 22, 8])
wv['A1'] = '빈도순 10,000단어 — 미국 구어 50% + 종합 코퍼스 50%'; wv['A1'].font = FT
dv = ok_dv(); wv.add_data_validation(dv)
for i, w in enumerate(words, 3):
    d = word_day[w['rank']]
    vals = [w['rank'], d, f'={START_REF}+B{i}-1', w['word'], w['ipa'], w['pos'], meaning.get(w['word'], ''),
            w['example'], w['example_ko'], w['example_src'], None]
    for c, v in enumerate(vals, 1):
        cell = wv.cell(row=i, column=c, value=v)
        cell.font = FB if c == 4 else F
        if c == 11:
            cell.fill = INPUT
    wv.cell(row=i, column=3).number_format = 'yyyy-mm-dd'
dv.add(f'K3:K{len(words) + 2}')

# ------------------------------------------------------------------ 4. 헤일리 1800
wh = wb.create_sheet('헤일리 1800')
cols = ['순번', 'Day', '날짜', '책 (편)', '책 내 번호', '출처 (미드·TED)', 'English', '완료 O', '한국어', '내 메모']
header(wh, 2, cols, [7, 6, 11, 22, 8, 20, 60, 8, 50, 25])
wh['A1'] = '헤일리쌤 영어 쉐도잉 18권 × 100문장 = 1,800문장 (하루 5문장)'; wh['A1'].font = FT
dv = ok_dv(); wh.add_data_validation(dv)
for i, (seq, b, n, src, en, ko) in enumerate(sentences, 3):
    vals = [seq, sent_day[seq], f'={START_REF}+B{i}-1', b, n, src, en, None, ko, None]
    for c, v in enumerate(vals, 1):
        cell = wh.cell(row=i, column=c, value=v)
        cell.font = FB if c == 7 else F
        if c in (8, 10):
            cell.fill = INPUT
    wh.cell(row=i, column=3).number_format = 'yyyy-mm-dd'
dv.add(f'H3:H{len(sentences) + 2}')

# ------------------------------------------------------------------ 5. 딴딴영어
wd = wb.create_sheet('딴딴영어')
cols = ['Day', '날짜', 'Shorts URL', '핵심 구문', '예문 1', '예문 2', '한국어 해석', '복습: 어제 구문', '완료 O']
header(wd, 2, cols, [6, 11, 34, 28, 40, 40, 36, 28, 8])
wd['A1'] = '딴딴영어 Shorts — 하루 1편 (핵심 구문 1 + 예문 2) · 연한 노랑 칸에 기록'; wd['A1'].font = FT
dv = ok_dv(); wd.add_data_validation(dv)
for d in range(1, DAYS + 1):
    r = d + 2
    wd.cell(row=r, column=1, value=d)
    wd.cell(row=r, column=2, value=f'={START_REF}+A{r}-1').number_format = 'yyyy-mm-dd'
    if d > 1:
        wd.cell(row=r, column=8, value=f'=IF(D{r - 1}="","",D{r - 1})')
    for c in range(1, 10):
        cell = wd.cell(row=r, column=c)
        cell.font, cell.border = F, BOX
        if c in (3, 4, 5, 6, 7, 9):
            cell.fill = INPUT
    dv.add(f'I{r}')
wd['K2'] = '작성 예시 (형식 참고용 — 실제 영상 내용 아님)'; wd['K2'].font = FB
ex = ['https://youtube.com/shorts/…', "I'm swamped.", "I'm swamped with work this week.",
      "Sorry, I'm swamped right now. Can I call you back?", '나 일이 너무 많아(정신없어).']
for i, v in enumerate(ex, 3):
    wd.cell(row=i, column=11, value=v).font = Font(name=FONT, size=10, italic=True, color='7F7F7F')
wd.column_dimensions['K'].width = 50

# ------------------------------------------------------------------ 6. 마일스톤
wm = wb.create_sheet('마일스톤')
cols = ['월', '기간 (Day)', '누적 단어 목표', '누적 헤일리 목표', '누적 딴딴 목표', '월말 점검 (Anna)', '결과 (정답률)']
header(wm, 2, cols, [6, 14, 14, 16, 14, 60, 14])
wm['A1'] = '월간 마일스톤 — 거꾸로 설계한 중간 목표'; wm['A1'].font = FT
checks = {
    1: '1~840위 무작위 100개 뜻 말하기 + 헤일리 일상/리액션 한→영 30문장', 3: '분기 시험: 누적 2,600 중 200개 (목표 80%)',
    6: '반기 시험: 누적 5,200 중 300개 + 미드 1화 무자막 이해도 자가평가', 9: '분기 시험: 누적 7,800 중 300개',
    12: '최종: 10,000 중 300개 + 헤일리 18권 한→영 100문장',
}
for m in range(1, 13):
    r = m + 2
    last = min(m * 30 if m < 12 else 365, 365)
    first = (m - 1) * 30 + 1
    wv_cnt = sum(b - a + 1 for d, (a, b) in day_words.items() if d <= last)
    hs = sum(1 for s, d in sent_day.items() if d <= last)
    vals = [m, f'{first}–{last}', wv_cnt, hs, last, checks.get(m, '월간 시험: 이번 달 단어 중 100개 무작위 (목표 85%)'), None]
    for c, v in enumerate(vals, 1):
        cell = wm.cell(row=r, column=c, value=v)
        cell.font, cell.border = F, BOX
        if c in (3, 4, 5):
            cell.number_format = '#,##0'
        if c == 7:
            cell.fill = INPUT

wb.save(OUT)
print('saved', OUT)

if ANKI:
    with open(ANKI, 'w', encoding='utf-8', newline='') as f:
        wr = csv.writer(f, delimiter='\t')
        for w in words:
            front = f"{w['word']}<br>{w['ipa']}"
            back = f"{meaning.get(w['word'], '')}<br><i>{w['example']}</i><br>{w['example_ko']}"
            wr.writerow([front, back, f"day{word_day[w['rank']]:03d} rank{w['rank']:05d}"])
    print('anki', ANKI)
