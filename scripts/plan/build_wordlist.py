"""Build the 10,000-word American-English frequency list for the 1-year plan.

Sources (all open data, downloaded separately):
  * wordfreq (pip)            - multi-corpus English frequency (subtitles, web, news, Wikipedia ...)
  * OpenSubtitles 2018 en_50k - spoken/subtitle frequency (github.com/hermitdave/FrequencyWords)
  * CMU Pronouncing Dictionary - General American pronunciation (github.com/cmusphinx/cmudict)
  * Princeton WordNet 3.0     - lemma check, part of speech, fallback example (via nltk_data)
  * nltk names corpus         - proper-name filter

Usage:
  python build_wordlist.py <work_dir> <out.json> [sentences.json]

<work_dir> must contain en_50k.txt, cmudict.dict and nltk_data/.
sentences.json (optional) is {title: [{en, ko, ...}]} used to pick natural spoken examples.
"""
import json, math, os, re, sys
from collections import defaultdict

WORK, OUT = sys.argv[1], sys.argv[2]
SENT = sys.argv[3] if len(sys.argv) > 3 else None
os.environ['NLTK_DATA'] = os.path.join(WORK, 'nltk_data')

import nltk  # noqa: E402
nltk.data.path.insert(0, os.path.join(WORK, 'nltk_data'))
from nltk.corpus import wordnet as wn, names  # noqa: E402
from lemminflect import getAllLemmas, getAllInflections  # noqa: E402
import wordfreq  # noqa: E402

N_TARGET = 10000

# ---------------------------------------------------------------- frequency
subs = {}
with open(os.path.join(WORK, 'en_50k.txt'), encoding='utf-8') as f:
    for line in f:
        w, c = line.split()
        subs[w] = int(c)
sub_total = sum(subs.values())

cands = set(wordfreq.top_n_list('en', 60000)) | set(subs)
cands = {w for w in cands if re.fullmatch(r"[a-z]+", w)}


def blended(w):
    a = wordfreq.word_frequency(w, 'en')
    b = subs.get(w, 0) / sub_total
    return 0.5 * a + 0.5 * b   # 50% spoken subtitles + 50% general multi-corpus


# ---------------------------------------------------------------- dictionaries
cmu = {}
with open(os.path.join(WORK, 'cmudict.dict'), encoding='utf-8') as f:
    for line in f:
        line = line.split('#')[0].strip()
        if not line:
            continue
        head, *ph = line.split()
        if '(' in head:
            continue  # keep first (most common) pronunciation only
        cmu[head] = ph

name_set = {n.lower() for n in names.words()}

FUNCTION_WORDS = set("""a an the i me my mine myself you your yours yourself yourselves he him his himself she her hers herself
it its itself we us our ours ourselves they them their theirs themselves this that these those who whom whose which what
whatever whoever whichever am is are was were be been being have has had having do does did doing will would shall should
can could may might must ought and but or nor so yet for if then else than because although though while whereas unless
until since whether of to in on at by with from into onto upon about above below over under after before during through
throughout across along among around against between beyond within without toward towards via per off out up down near
not no yes oh hey hello hi okay ok please thanks goodbye bye wow huh hmm yeah yep nope gonna wanna gotta
there here where when why how all any both each either neither every few many much more most other some such
one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred thousand million billion
anybody anyone anything anywhere everybody everyone everything everywhere nobody none nothing nowhere somebody someone
something somewhere just also very too quite rather really already still even ever never always often sometimes""".split())

BLOCK = set("""nigger nigga faggot fag retard cunt kike spic chink tranny dyke
don isn didn doesn wasn weren aren couldn wouldn shouldn haven hasn hadn mustn needn ain ll ve re
cos til tho ya yo em ma la um uh blowjob dildo tampon cum dick pussy cock whore slut""".split())
PROFANE = set("shit fuck fucking damn hell crap bitch ass bastard goddamn bullshit asshole piss".split())

POS_KO = {'n': '명', 'v': '동', 'a': '형', 's': '형', 'r': '부'}


KEEP_FORM = set("""according amazing clothes united media ground tired scared excited interested interesting boring bored
married wedding building meeting feeling evening used surprised worried confused embarrassed exciting following
ceiling painting drawing saying beginning ending setting writing reading training opening shopping parking
learning understanding funding housing warning living missing involved finished""".split())


def keep_form(w):
    return w in KEEP_FORM


def is_word(w):
    if w in BLOCK or w not in cmu:
        return False
    if len(w) == 1 and w not in ('a', 'i'):
        return False
    syn = wn.synsets(w)
    if w in FUNCTION_WORDS:
        return True
    if not syn:
        return False
    # keep only words WordNet lists in lowercase (drops Glasgow, Maine, John ...)
    if not any(l.name() == w for s in syn for l in s.lemmas()):
        return False
    if w in name_set and wordfreq.word_frequency(w, 'en') < 2e-5:
        return False
    return True


# ---------------------------------------------------------------- lemmatise & aggregate
lemma_freq = defaultdict(float)
lemma_forms = defaultdict(set)
for w in cands:
    f = blended(w)
    if f <= 0:
        continue
    lems = getAllLemmas(w)
    lemma = w
    if w not in FUNCTION_WORDS and lems and not keep_form(w):
        # prefer verb lemma (went->go), then noun, then adjective
        for pos in ('VERB', 'AUX', 'NOUN', 'ADJ', 'ADV'):
            if pos in lems:
                lemma = lems[pos][0]
                break
    lemma = lemma.lower()
    if not is_word(lemma):
        continue
    lemma_freq[lemma] += f
    lemma_forms[lemma].add(w)

ranked = sorted(lemma_freq, key=lambda l: -lemma_freq[l])[:N_TARGET]

# ---------------------------------------------------------------- IPA (General American)
V = {'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ', 'EH': 'ɛ', 'ER': 'ɝ', 'EY': 'eɪ',
     'IH': 'ɪ', 'IY': 'i', 'OW': 'oʊ', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u'}
C = {'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l',
     'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v',
     'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'}
ONSETS = {tuple(x.split()) for x in """P R|P L|B R|B L|T R|D R|K R|K L|G R|G L|F R|F L|TH R|SH R|S P|S T|S K|S M|S N|S L|S W|
P Y|B Y|K Y|F Y|M Y|V Y|HH Y|K W|T W|D W|G W|S P R|S T R|S K R|S P L|S K W|S K Y|S P Y""".replace('\n', '').split('|')}


def to_ipa(ph):
    # unstressed ER before a vowel is schwa + r-onset (career -> kəˈrɪr)
    fixed = []
    for i, p in enumerate(ph):
        if p == 'ER0' and i + 1 < len(ph) and ph[i + 1][:2] in V:
            fixed += ['AH0', 'R']
        else:
            fixed.append(p)
    ph = fixed
    sylls = []  # list of (onset_list, vowel, stress) built later
    vowel_idx = [i for i, p in enumerate(ph) if p[:2] in V]
    if not vowel_idx:
        return ''.join(C.get(p, '') for p in ph)
    # determine syllable start for each vowel using maximal onset
    starts = []
    prev_end = 0
    for k, vi in enumerate(vowel_idx):
        if k == 0:
            starts.append(0)
            prev_end = vi + 1
            continue
        cons = ph[prev_end:vi]
        split = len(cons)
        for n in range(len(cons), 0, -1):
            onset = tuple(cons[len(cons) - n:])
            if n == 1 or onset in ONSETS:
                split = len(cons) - n
                break
        if not cons:
            split = 0
        starts.append(prev_end + split)
        prev_end = vi + 1
    out = []
    for k, vi in enumerate(vowel_idx):
        s = starts[k]
        e = starts[k + 1] if k + 1 < len(starts) else len(ph)
        seg = ph[s:e]
        stress = ph[vi][2:] if len(ph[vi]) > 2 else '0'
        mark = 'ˈ' if stress == '1' else ('ˌ' if stress == '2' else '')
        txt = ''
        for p in seg:
            base, st = p[:2], p[2:]
            if base in V and p.rstrip('012') in V:
                b = p.rstrip('012')
                if b == 'AH' and st == '0':
                    txt += 'ə'
                elif b == 'ER' and st == '0':
                    txt += 'ɚ'
                elif b == 'IY' and st == '0':
                    txt += 'i'
                else:
                    txt += V[b]
            else:
                txt += C.get(p, '')
        out.append(mark + txt)
    ipa = ''.join(out)
    if len(vowel_idx) == 1:
        ipa = ipa.replace('ˈ', '')  # no stress mark on monosyllables
    return ipa


# ---------------------------------------------------------------- examples
sentences = []
if SENT:
    data = json.load(open(SENT, encoding='utf-8'))
    for title, rows in data.items():
        for r in rows:
            if r.get('en') and r.get('ko'):
                toks = set(re.findall(r"[a-z]+", r['en'].lower()))
                sentences.append((r['en'], r['ko'], f"헤일리 {title} #{r['n']}", toks))
sent_used = defaultdict(int)


def forms_of(lemma):
    fs = {lemma} | lemma_forms[lemma]
    for v in getAllInflections(lemma).values():
        fs.update(x.lower() for x in v)
    return fs


def pick_example(lemma):
    fs = forms_of(lemma)
    best = None
    for en, ko, src, toks in sentences:
        if toks & fs and 12 <= len(en) <= 70:
            score = len(en) + 25 * sent_used[en]
            if best is None or score < best[0]:
                best = (score, en, ko, src)
    if best:
        sent_used[best[1]] += 1
        return best[1], best[2], best[3]
    for s in wn.synsets(lemma):
        for ex in s.examples():
            if any(f in re.findall(r"[a-z]+", ex.lower()) for f in fs) and len(ex) >= 12:
                ex = ex[0].upper() + ex[1:]
                if not ex.endswith(('.', '!', '?')):
                    ex += '.'
                return ex, '', 'WordNet'
    return '', '', ''


def pos_of(lemma):
    if lemma in FUNCTION_WORDS:
        return '기능어'
    cnt = defaultdict(int)
    for s in wn.synsets(lemma):
        for l in s.lemmas():
            if l.name().lower() == lemma:
                cnt[POS_KO[s.pos()]] += l.count() + 1
    tag = '/'.join(k for k, _ in sorted(cnt.items(), key=lambda kv: -kv[1])[:2])
    return tag + (' · 비속어(이해용)' if lemma in PROFANE else '')


rows = []
for i, lemma in enumerate(ranked, 1):
    en, ko, src = pick_example(lemma)
    rows.append({'rank': i, 'word': lemma, 'ipa': '/' + to_ipa(cmu[lemma]) + '/', 'pos': pos_of(lemma),
                 'example': en, 'example_ko': ko, 'example_src': src,
                 'zipf': round(math.log10(lemma_freq[lemma] * 1e9), 2)})

json.dump(rows, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('words', len(rows), 'with example', sum(1 for r in rows if r['example']),
      'hailey', sum(1 for r in rows if r['example_src'].startswith('헤일리')))
