// Intermediate and advanced first-week lessons plus the placement-test word bank.
// Same line format as seed-data.mjs: term|pronunciation|Korean meaning.
// English uses General American IPA; Mandarin uses simplified characters and tone-mark pinyin.
const rows = (text, kind) =>
  text
    .trim()
    .split("\n")
    .map((line) => {
      const [term, pronunciation, meaning] = line.split("|");
      return { term, pronunciation, meaning, kind };
    });

const EN_INTERMEDIATE_VOCA = rows(
  `abroad|əˈbrɔːd|해외에; 해외로
reservation|ˌrɛzɚˈveɪʃən|예약
destination|ˌdɛstəˈneɪʃən|목적지
luggage|ˈlʌɡɪdʒ|짐; 수하물
accommodation|əˌkɑːməˈdeɪʃən|숙소
itinerary|aɪˈtɪnəˌrɛri|여행 일정표
delay|dɪˈleɪ|지연; 미루다
cancel|ˈkænsəl|취소하다
available|əˈveɪləbəl|이용 가능한; 시간이 되는
convenient|kənˈviːniənt|편리한
crowded|ˈkraʊdɪd|붐비는
directions|dəˈrɛkʃənz|길 안내; 지시 사항
recommend|ˌrɛkəˈmɛnd|추천하다
souvenir|ˌsuːvəˈnɪr|기념품
currency|ˈkɝːənsi|통화; 화폐
exchange|ɪksˈtʃeɪndʒ|교환하다; 환전
passenger|ˈpæsəndʒɚ|승객
local|ˈloʊkəl|현지의; 지역의
experience|ɪkˈspɪriəns|경험; 경험하다
explore|ɪkˈsplɔːr|탐험하다; 둘러보다
relationship|rɪˈleɪʃənʃɪp|관계
neighbor|ˈneɪbɚ|이웃
invite|ɪnˈvaɪt|초대하다
apologize|əˈpɑːlədʒaɪz|사과하다
appreciate|əˈpriːʃieɪt|고마워하다; 진가를 알다
complain|kəmˈpleɪn|불평하다
encourage|ɪnˈkɝːɪdʒ|격려하다
admire|ədˈmaɪɚ|존경하다; 감탄하다
embarrassed|ɪmˈbærəst|당황한; 창피한
nervous|ˈnɝːvəs|긴장한
confident|ˈkɑːnfɪdənt|자신감 있는
disappointed|ˌdɪsəˈpɔɪntɪd|실망한
grateful|ˈɡreɪtfəl|감사하는
patient|ˈpeɪʃənt|인내심 있는; 환자
polite|pəˈlaɪt|예의 바른
rude|ruːd|무례한
generous|ˈdʒɛnərəs|너그러운; 후한
honest|ˈɑːnɪst|정직한
reliable|rɪˈlaɪəbəl|믿을 수 있는
support|səˈpɔːrt|지지하다; 지원
opinion|əˈpɪnjən|의견
agree|əˈɡriː|동의하다
disagree|ˌdɪsəˈɡriː|동의하지 않다
suggest|səɡˈdʒɛst|제안하다
compare|kəmˈpɛr|비교하다
consider|kənˈsɪdɚ|고려하다
decide|dɪˈsaɪd|결정하다
prefer|prɪˈfɝː|더 좋아하다
avoid|əˈvɔɪd|피하다
achieve|əˈtʃiːv|성취하다
advantage|ədˈvæntɪdʒ|장점; 이점
disadvantage|ˌdɪsədˈvæntɪdʒ|단점
benefit|ˈbɛnəfɪt|혜택; 이익
effect|ɪˈfɛkt|효과; 영향
reason|ˈriːzən|이유
result|rɪˈzʌlt|결과
possible|ˈpɑːsəbəl|가능한
necessary|ˈnɛsəˌsɛri|필요한
obvious|ˈɑːbviəs|명백한
especially|ɪˈspɛʃəli|특히
deadline|ˈdɛdlaɪn|마감 기한
colleague|ˈkɑːliːɡ|동료
responsible|rɪˈspɑːnsəbəl|책임이 있는
opportunity|ˌɑːpɚˈtuːnəti|기회
promotion|prəˈmoʊʃən|승진; 판촉
salary|ˈsæləri|급여
negotiate|nɪˈɡoʊʃieɪt|협상하다
contract|ˈkɑːntrækt|계약(서)
budget|ˈbʌdʒɪt|예산
profit|ˈprɑːfɪt|이익; 수익
increase|ɪnˈkriːs|증가하다; 늘리다
decrease|dɪˈkriːs|감소하다; 줄이다
require|rɪˈkwaɪɚ|요구하다; 필요로 하다
provide|prəˈvaɪd|제공하다
attend|əˈtɛnd|참석하다
arrange|əˈreɪndʒ|준비하다; 정리하다
prepare|prɪˈpɛr|준비하다
efficient|ɪˈfɪʃənt|효율적인
experienced|ɪkˈspɪriənst|경험이 풍부한
interview|ˈɪntɚvjuː|면접; 인터뷰
environment|ɪnˈvaɪrənmənt|환경
pollution|pəˈluːʃən|오염
healthy|ˈhɛlθi|건강한
exercise|ˈɛksɚsaɪz|운동; 운동하다
symptom|ˈsɪmptəm|증상
appointment|əˈpɔɪntmənt|(병원 등의) 예약; 약속
medicine|ˈmɛdəsən|약; 의학
habit|ˈhæbɪt|습관
balance|ˈbæləns|균형
stress|strɛs|스트레스; 강조하다
social media|ˈsoʊʃəl ˈmiːdiə|소셜 미디어
advertisement|ˌædvɚˈtaɪzmənt|광고
information|ˌɪnfɚˈmeɪʃən|정보
article|ˈɑːrtɪkəl|기사; 글
recently|ˈriːsəntli|최근에
eventually|ɪˈvɛntʃuəli|결국
probably|ˈprɑːbəbli|아마
unfortunately|ʌnˈfɔːrtʃənətli|안타깝게도
instead|ɪnˈstɛd|대신에
although|ɔːlˈðoʊ|비록 ~이지만`,
  "voca",
);

const EN_INTERMEDIATE_IDIOM = rows(
  `figure out|ˈfɪɡjɚ ˈaʊt|알아내다; 이해하다
come up with|kʌm ˈʌp wɪð|(생각을) 떠올리다
put off|pʊt ˈɔːf|미루다
get along with|ɡɛt əˈlɔːŋ wɪð|~와 잘 지내다
look up|lʊk ˈʌp|(정보를) 찾아보다
set up|sɛt ˈʌp|설치하다; 마련하다
carry on|ˈkæri ˈɑːn|계속하다
give up|ɡɪv ˈʌp|포기하다
deal with|ˈdiːl wɪð|처리하다; 다루다
catch up|kætʃ ˈʌp|따라잡다; 밀린 이야기를 나누다
check in|tʃɛk ˈɪn|체크인하다
check out|tʃɛk ˈaʊt|체크아웃하다; 확인해 보다
get over|ɡɛt ˈoʊvɚ|극복하다; 회복하다
show up|ʃoʊ ˈʌp|나타나다
end up|ɛnd ˈʌp|결국 ~하게 되다
turn down|tɝːn ˈdaʊn|거절하다; 소리를 줄이다
bring up|brɪŋ ˈʌp|(화제를) 꺼내다; 기르다
calm down|kɑːm ˈdaʊn|진정하다
cheer up|tʃɪr ˈʌp|기운 내다
hang out|hæŋ ˈaʊt|어울려 놀다
point out|pɔɪnt ˈaʊt|지적하다
work out|wɝːk ˈaʊt|운동하다; 잘 풀리다
go over|ɡoʊ ˈoʊvɚ|검토하다
fill out|fɪl ˈaʊt|(서류를) 작성하다
sign up for|saɪn ˈʌp fɔːr|~에 등록하다; 신청하다
in other words|ɪn ˈʌðɚ ˈwɝːdz|다시 말해
on the other hand|ɑːn ði ˈʌðɚ ˈhænd|반면에
as a result|æz ə rɪˈzʌlt|그 결과
in my opinion|ɪn maɪ əˈpɪnjən|내 생각에는
to be honest|tə bi ˈɑːnɪst|솔직히 말하면
get the hang of|ɡɛt ðə ˈhæŋ əv|요령을 터득하다
keep an eye on|kiːp ən ˈaɪ ɑːn|~을 지켜보다
make up one's mind|meɪk ˈʌp wʌnz ˈmaɪnd|결심하다
take part in|teɪk ˈpɑːrt ɪn|~에 참여하다
take care of|teɪk ˈkɛr əv|~을 돌보다; 처리하다
run into|rʌn ˈɪntuː|우연히 만나다
come across|kʌm əˈkrɔːs|우연히 발견하다
on purpose|ɑːn ˈpɝːpəs|일부러
by accident|baɪ ˈæksɪdənt|우연히
for a while|fɔːr ə ˈwaɪl|한동안
call it a day|ˈkɔːl ɪt ə ˈdeɪ|그만 끝내다
hit the road|hɪt ðə ˈroʊd|출발하다
cost an arm and a leg|kɔːst ən ˈɑːrm ənd ə ˈlɛɡ|엄청나게 비싸다
once in a blue moon|wʌns ɪn ə ˈbluː ˈmuːn|아주 드물게
on the same page|ɑːn ðə ˈseɪm ˈpeɪdʒ|같은 생각인
at the last minute|æt ðə ˈlæst ˈmɪnɪt|막판에
take a rain check|teɪk ə ˈreɪn tʃɛk|다음 기회로 미루다
no wonder|noʊ ˈwʌndɚ|어쩐지; 당연하다
it's up to you|ɪts ˈʌp tə ju|너에게 달렸다
sleep on it|ˈsliːp ɑːn ɪt|하룻밤 생각해 보다`,
  "idiom",
);

const EN_ADVANCED_VOCA = rows(
  `leverage|ˈlɛvərɪdʒ|영향력; 활용하다
stakeholder|ˈsteɪkhoʊldɚ|이해관계자
consensus|kənˈsɛnsəs|합의; 의견 일치
compromise|ˈkɑːmprəmaɪz|타협; 타협하다
concession|kənˈsɛʃən|양보
feasible|ˈfiːzəbəl|실현 가능한
viable|ˈvaɪəbəl|실행 가능한
incentive|ɪnˈsɛntɪv|동기; 장려책
allocate|ˈæləkeɪt|할당하다
implement|ˈɪmpləmɛnt|시행하다
streamline|ˈstriːmlaɪn|간소화하다; 효율화하다
scrutinize|ˈskruːtənaɪz|면밀히 조사하다
contingency|kənˈtɪndʒənsi|만일의 사태; 비상 대책
liability|ˌlaɪəˈbɪləti|법적 책임; 부채
revenue|ˈrɛvənuː|수익; 세입
forecast|ˈfɔːrkæst|예측; 예측하다
benchmark|ˈbɛntʃmɑːrk|기준; 기준점
proposition|ˌprɑːpəˈzɪʃən|제안; 명제
discretion|dɪˈskrɛʃən|재량; 신중함
prerequisite|priˈrɛkwəzɪt|전제 조건
controversial|ˌkɑːntrəˈvɝːʃəl|논란이 많은
legislation|ˌlɛdʒɪsˈleɪʃən|법률; 입법
unprecedented|ʌnˈprɛsɪdɛntɪd|전례 없는
inequality|ˌɪnɪˈkwɑːləti|불평등
sustainable|səˈsteɪnəbəl|지속 가능한
demographic|ˌdɛməˈɡræfɪk|인구 통계의; 인구층
infrastructure|ˈɪnfrəˌstrʌktʃɚ|사회 기반 시설
subsidy|ˈsʌbsədi|보조금
inflation|ɪnˈfleɪʃən|물가 상승; 인플레이션
recession|rɪˈsɛʃən|경기 침체
advocate|ˈædvəkeɪt|옹호하다
undermine|ˌʌndɚˈmaɪn|약화시키다
alleviate|əˈliːvieɪt|완화하다
exacerbate|ɪɡˈzæsɚbeɪt|악화시키다
mitigate|ˈmɪtɪɡeɪt|경감하다
accountability|əˌkaʊntəˈbɪləti|책임(성)
transparency|trænsˈpɛrənsi|투명성
phenomenon|fəˈnɑːmənɑːn|현상
prevalent|ˈprɛvələnt|널리 퍼진
ramification|ˌræməfɪˈkeɪʃən|(예상 밖의) 파장
meticulous|məˈtɪkjələs|꼼꼼한
candid|ˈkændɪd|솔직한
diligent|ˈdɪlɪdʒənt|성실한
resilient|rɪˈzɪliənt|회복력 있는
pragmatic|præɡˈmætɪk|실용적인
complacent|kəmˈpleɪsənt|안주하는; 자기만족의
ambivalent|æmˈbɪvələnt|양가감정의
eloquent|ˈɛləkwənt|유창한; 설득력 있는
skeptical|ˈskɛptɪkəl|회의적인
tenacious|təˈneɪʃəs|끈질긴
aloof|əˈluːf|냉담한; 거리를 두는
gregarious|ɡrɪˈɡɛriəs|사교적인
humble|ˈhʌmbəl|겸손한
impulsive|ɪmˈpʌlsɪv|충동적인
articulate|ɑːrˈtɪkjələt|생각을 분명히 표현하는
versatile|ˈvɝːsətəl|다재다능한
conscientious|ˌkɑːnʃiˈɛnʃəs|양심적인; 성실한
indifferent|ɪnˈdɪfrənt|무관심한
assertive|əˈsɝːtɪv|자기주장이 분명한
empathetic|ˌɛmpəˈθɛtɪk|공감하는
hypothesis|haɪˈpɑːθəsɪs|가설
inference|ˈɪnfərəns|추론
implication|ˌɪmplɪˈkeɪʃən|함의; 영향
substantiate|səbˈstænʃieɪt|입증하다
refute|rɪˈfjuːt|반박하다
plausible|ˈplɔːzəbəl|그럴듯한
coherent|koʊˈhɪrənt|일관성 있는
ambiguous|æmˈbɪɡjuəs|모호한
nuance|ˈnuːɑːns|미묘한 차이
paradox|ˈpærədɑːks|역설
premise|ˈprɛmɪs|전제
discrepancy|dɪˈskrɛpənsi|불일치
comprehensive|ˌkɑːmprɪˈhɛnsɪv|포괄적인
intrinsic|ɪnˈtrɪnzɪk|본질적인
empirical|ɪmˈpɪrɪkəl|경험적인; 실증적인
elaborate|ɪˈlæbərət|정교한; 공들인
concise|kənˈsaɪs|간결한
arbitrary|ˈɑːrbɪtrɛri|임의의; 제멋대로인
inevitable|ɪnˈɛvɪtəbəl|불가피한
notwithstanding|ˌnɑːtwɪθˈstændɪŋ|~에도 불구하고
nostalgia|nəˈstældʒə|향수
aesthetic|ɛsˈθɛtɪk|미적인; 미학
contemporary|kənˈtɛmpərɛri|현대의; 동시대의
heritage|ˈhɛrɪtɪdʒ|유산
profound|prəˈfaʊnd|심오한
subtle|ˈsʌtəl|미묘한
vivid|ˈvɪvɪd|생생한
serene|səˈriːn|고요한
whimsical|ˈwɪmzɪkəl|기발한; 엉뚱한
indulge|ɪnˈdʌldʒ|마음껏 즐기다; 탐닉하다
savor|ˈseɪvɚ|음미하다
cherish|ˈtʃɛrɪʃ|소중히 여기다
endeavor|ɪnˈdɛvɚ|노력; 시도하다
epitome|ɪˈpɪtəmi|전형; 본보기
ubiquitous|juːˈbɪkwɪtəs|어디에나 있는
ephemeral|ɪˈfɛmərəl|덧없는
quintessential|ˌkwɪntɪˈsɛnʃəl|전형적인
serendipity|ˌsɛrənˈdɪpəti|뜻밖의 행운
meander|miˈændɚ|굽이쳐 흐르다; 거닐다
reminisce|ˌrɛmɪˈnɪs|추억에 잠기다`,
  "voca",
);

const EN_ADVANCED_IDIOM = rows(
  `touch base|tʌtʃ ˈbeɪs|(간단히) 연락하다
get the ball rolling|ɡɛt ðə ˈbɔːl ˈroʊlɪŋ|일을 시작하다
think outside the box|θɪŋk aʊtˈsaɪd ðə ˈbɑːks|틀에서 벗어나 생각하다
the bottom line|ðə ˈbɑːtəm ˈlaɪn|핵심; 최종 결과
back to the drawing board|bæk tə ðə ˈdrɔːɪŋ ˌbɔːrd|처음부터 다시
cut corners|kʌt ˈkɔːrnɚz|대충 하다; 절차를 생략하다
a ballpark figure|ə ˈbɔːlpɑːrk ˈfɪɡjɚ|대략적인 수치
on the fence|ɑːn ðə ˈfɛns|결정을 못 내린
call the shots|kɔːl ðə ˈʃɑːts|결정권을 쥐다
go the extra mile|ɡoʊ ði ˈɛkstrə ˈmaɪl|한층 더 노력하다
a double-edged sword|ə ˈdʌbəl ˌɛdʒd ˈsɔːrd|양날의 검
the tip of the iceberg|ðə ˈtɪp əv ði ˈaɪsbɝːɡ|빙산의 일각
a slippery slope|ə ˈslɪpəri ˈsloʊp|연쇄적으로 나빠지는 길
bite the bullet|baɪt ðə ˈbʊlɪt|이를 악물고 견디다
jump on the bandwagon|dʒʌmp ɑːn ðə ˈbændwæɡən|유행에 편승하다
miss the boat|mɪs ðə ˈboʊt|기회를 놓치다
a blessing in disguise|ə ˈblɛsɪŋ ɪn dɪsˈɡaɪz|전화위복
by and large|baɪ ən ˈlɑːrdʒ|대체로
in the long run|ɪn ðə ˈlɔːŋ ˈrʌn|장기적으로
hit the nail on the head|hɪt ðə ˈneɪl ɑːn ðə ˈhɛd|정곡을 찌르다
beat around the bush|biːt əˈraʊnd ðə ˈbʊʃ|돌려 말하다
read between the lines|riːd bɪˈtwiːn ðə ˈlaɪnz|행간을 읽다
take it with a grain of salt|teɪk ɪt wɪð ə ˈɡreɪn əv ˈsɔːlt|곧이곧대로 듣지 않다
play devil's advocate|pleɪ ˈdɛvəlz ˈædvəkət|일부러 반대 입장을 취하다
the elephant in the room|ði ˈɛləfənt ɪn ðə ˈruːm|모두 알지만 말하지 않는 문제
a far cry from|ə ˈfɑːr ˈkraɪ frʌm|~와는 거리가 먼
come to terms with|kʌm tə ˈtɝːmz wɪð|(현실을) 받아들이다
get to the bottom of|ɡɛt tə ðə ˈbɑːtəm əv|진상을 규명하다
put two and two together|pʊt ˈtuː ən ˈtuː təˈɡɛðɚ|정황을 종합해 알아차리다
stand one's ground|stænd wʌnz ˈɡraʊnd|입장을 굽히지 않다
bend over backwards|bɛnd ˌoʊvɚ ˈbækwɚdz|무척 애쓰다
burn the midnight oil|bɝːn ðə ˈmɪdnaɪt ˈɔɪl|밤늦게까지 일하다
keep one's head above water|kiːp wʌnz ˈhɛd əˈbʌv ˈwɔːtɚ|간신히 버티다
learn the ropes|lɝːn ðə ˈroʊps|요령을 익히다
pull one's weight|pʊl wʌnz ˈweɪt|제 몫을 하다
up in the air|ˈʌp ɪn ði ˈɛr|미정인
cut to the chase|kʌt tə ðə ˈtʃeɪs|본론으로 들어가다
see eye to eye|siː ˈaɪ tə ˈaɪ|의견이 일치하다
add insult to injury|æd ˈɪnsʌlt tə ˈɪndʒəri|설상가상으로 만들다
a long shot|ə ˈlɔːŋ ˈʃɑːt|가능성이 희박한 일
let the cat out of the bag|lɛt ðə ˈkæt aʊt əv ðə ˈbæɡ|비밀을 누설하다
once and for all|ˈwʌns ənd fɚ ˈɔːl|이번을 마지막으로; 완전히
the best of both worlds|ðə ˈbɛst əv ˈboʊθ ˈwɝːldz|두 가지 장점을 모두 누림
when it comes to|wɛn ɪt ˈkʌmz tuː|~에 관해서라면
for the time being|fɚ ðə ˈtaɪm ˌbiːɪŋ|당분간
at the end of the day|æt ði ˈɛnd əv ðə ˈdeɪ|결국에는
have mixed feelings|hæv ˈmɪkst ˈfiːlɪŋz|복잡한 심정이다
off the top of one's head|ɔːf ðə ˈtɑːp əv wʌnz ˈhɛd|즉석에서 떠오르는 대로
out of the blue|aʊt əv ðə ˈbluː|갑자기; 뜻밖에
speak of the devil|ˈspiːk əv ðə ˈdɛvəl|호랑이도 제 말 하면 온다`,
  "idiom",
);

const ZH_INTERMEDIATE_VOCA = rows(
  `旅游|lǚyóu|여행하다
护照|hùzhào|여권
机场|jīchǎng|공항
航班|hángbān|항공편
行李|xíngli|짐
宾馆|bīnguǎn|호텔
预订|yùdìng|예약하다
地铁|dìtiě|지하철
出租车|chūzūchē|택시
地图|dìtú|지도
附近|fùjìn|근처
方便|fāngbiàn|편리하다
安全|ānquán|안전하다
景点|jǐngdiǎn|관광지
排队|páiduì|줄을 서다
换钱|huànqián|환전하다
天气|tiānqì|날씨
迟到|chídào|지각하다
打算|dǎsuan|~할 계획이다
推荐|tuījiàn|추천하다
邻居|línjū|이웃
聚会|jùhuì|모임; 모이다
邀请|yāoqǐng|초대하다
礼物|lǐwù|선물
关心|guānxīn|관심을 갖다; 배려하다
感谢|gǎnxiè|감사하다
羡慕|xiànmù|부러워하다
担心|dānxīn|걱정하다
紧张|jǐnzhāng|긴장하다
放松|fàngsōng|긴장을 풀다
失望|shīwàng|실망하다
满意|mǎnyì|만족하다
害怕|hàipà|두려워하다
生气|shēngqì|화내다
骄傲|jiāo'ào|자랑스럽다; 거만하다
热情|rèqíng|친절하다; 열정적이다
诚实|chéngshí|정직하다
耐心|nàixīn|인내심; 참을성 있다
性格|xìnggé|성격
习惯|xíguàn|습관; 익숙해지다
意见|yìjiàn|의견
同意|tóngyì|동의하다
反对|fǎnduì|반대하다
建议|jiànyì|제안하다; 제안
比较|bǐjiào|비교하다; 비교적
考虑|kǎolǜ|고려하다
决定|juédìng|결정하다
选择|xuǎnzé|선택하다
原因|yuányīn|원인
结果|jiéguǒ|결과
优点|yōudiǎn|장점
缺点|quēdiǎn|단점
重要|zhòngyào|중요하다
必须|bìxū|반드시 ~해야 한다
可能|kěnéng|아마; 가능하다
其实|qíshí|사실은
而且|érqiě|게다가
虽然|suīrán|비록 ~이지만
因为|yīnwèi|왜냐하면
所以|suǒyǐ|그래서
工资|gōngzī|월급
加班|jiābān|야근하다
出差|chūchāi|출장 가다
面试|miànshì|면접
经验|jīngyàn|경험
负责|fùzé|책임지다
计划|jìhuà|계획; 계획하다
任务|rènwu|임무; 과제
合同|hétong|계약(서)
谈判|tánpàn|협상하다
市场|shìchǎng|시장
竞争|jìngzhēng|경쟁하다
提高|tígāo|향상시키다
降低|jiàngdī|낮추다
增加|zēngjiā|증가하다
减少|jiǎnshǎo|감소하다
准备|zhǔnbèi|준비하다
安排|ānpái|일정을 잡다; 배치하다
效率|xiàolǜ|효율
机会|jīhuì|기회
健康|jiànkāng|건강; 건강하다
锻炼|duànliàn|운동하다; 단련하다
感冒|gǎnmào|감기; 감기에 걸리다
医院|yīyuàn|병원
药|yào|약
休息|xiūxi|쉬다
压力|yālì|스트레스; 압력
环境|huánjìng|환경
污染|wūrǎn|오염
新闻|xīnwén|뉴스
网上|wǎngshàng|인터넷에서; 온라인
手机|shǒujī|휴대전화
信息|xìnxī|정보; 메시지
最近|zuìjìn|최근
终于|zhōngyú|마침내
突然|tūrán|갑자기
一直|yìzhí|줄곧; 계속
已经|yǐjīng|이미
其他|qítā|기타; 다른
如果|rúguǒ|만약`,
  "voca",
);

const ZH_INTERMEDIATE_IDIOM = rows(
  `差不多|chàbuduō|거의 비슷하다
来不及|láibují|시간이 모자라다; 미처 못하다
不得不|bùdébù|어쩔 수 없이 ~하다
怪不得|guàibude|어쩐지
说不定|shuōbudìng|어쩌면; 단정할 수 없다
随便|suíbiàn|마음대로 하다; 아무렇게나
算了|suàn le|됐다; 그만두자
没什么|méi shénme|별것 아니다
真不错|zhēn búcuò|정말 괜찮다
太棒了|tài bàng le|정말 훌륭하다
不见不散|bú jiàn bú sàn|만날 때까지 기다리자
入乡随俗|rù xiāng suí sú|그 지방에 가면 그 풍속을 따른다
马马虎虎|mǎmǎhūhū|대충대충; 그럭저럭
乱七八糟|luànqībāzāo|엉망진창
半途而废|bàntú'érfèi|중도에 그만두다
自言自语|zìyánzìyǔ|혼잣말하다
一模一样|yìmúyíyàng|똑같이 생기다
三心二意|sānxīn'èryì|마음이 흔들리다; 우유부단하다
津津有味|jīnjīnyǒuwèi|아주 맛있게; 흥미진진하게
千方百计|qiānfāngbǎijì|온갖 방법을 다하다
各种各样|gèzhǒng gèyàng|여러 가지; 각양각색
不知不觉|bùzhī bùjué|자기도 모르게
越来越|yuè lái yuè|점점 더
有空|yǒu kòng|시간이 있다
看情况|kàn qíngkuàng|상황을 보다`,
  "idiom",
);

const ZH_ADVANCED_VOCA = rows(
  `协议|xiéyì|협의; 합의서
合作|hézuò|협력하다
投资|tóuzī|투자하다
利润|lìrùn|이윤
成本|chéngběn|원가; 비용
预算|yùsuàn|예산
策略|cèlüè|전략
优势|yōushì|우세; 강점
风险|fēngxiǎn|위험; 리스크
趋势|qūshì|추세
营销|yíngxiāo|마케팅
品牌|pǐnpái|브랜드
供应|gōngyìng|공급하다
需求|xūqiú|수요; 요구
效益|xiàoyì|효과와 이익
规模|guīmó|규모
资源|zīyuán|자원
项目|xiàngmù|프로젝트; 항목
执行|zhíxíng|실행하다; 집행하다
评估|pínggū|평가하다
政策|zhèngcè|정책
经济|jīngjì|경제
社会|shèhuì|사회
发展|fāzhǎn|발전하다
改革|gǎigé|개혁하다
制度|zhìdù|제도
舆论|yúlùn|여론
争议|zhēngyì|논쟁; 쟁의
现象|xiànxiàng|현상
人口|rénkǒu|인구
老龄化|lǎolínghuà|고령화
就业|jiùyè|취업
贫富差距|pínfù chājù|빈부 격차
可持续|kě chíxù|지속 가능한
通货膨胀|tōnghuò péngzhàng|인플레이션
基础设施|jīchǔ shèshī|기반 시설; 인프라
透明|tòumíng|투명하다
责任|zérèn|책임
维护|wéihù|유지하고 보호하다
缓解|huǎnjiě|완화하다
谨慎|jǐnshèn|신중하다
坦率|tǎnshuài|솔직하다
勤奋|qínfèn|부지런하다
谦虚|qiānxū|겸손하다
固执|gùzhí|고집스럽다
冷漠|lěngmò|냉담하다
宽容|kuānróng|너그럽다
敏感|mǐngǎn|민감하다
乐观|lèguān|낙관적이다
悲观|bēiguān|비관적이다
自信|zìxìn|자신감 있다
犹豫|yóuyù|망설이다
尴尬|gāngà|난처하다; 어색하다
委屈|wěiqu|억울하다
感慨|gǎnkǎi|감개무량하다
珍惜|zhēnxī|소중히 여기다
包容|bāoróng|포용하다
沟通|gōutōng|소통하다
体谅|tǐliàng|이해하고 헤아리다
默契|mòqì|호흡이 잘 맞음
观点|guāndiǎn|관점
论证|lùnzhèng|논증하다
假设|jiǎshè|가정하다; 가설
依据|yījù|근거
逻辑|luójí|논리
矛盾|máodùn|모순
本质|běnzhì|본질
客观|kèguān|객관적이다
主观|zhǔguān|주관적이다
概括|gàikuò|요약하다
分析|fēnxī|분석하다
总结|zǒngjié|총정리하다
反驳|fǎnbó|반박하다
推测|tuīcè|추측하다
证实|zhèngshí|입증하다
片面|piànmiàn|일방적이다; 단편적이다
全面|quánmiàn|전면적이다; 포괄적이다
显然|xiǎnrán|분명히; 명백하다
从而|cóng'ér|따라서; 그리하여
即使|jíshǐ|설령 ~하더라도
传统|chuántǒng|전통
文化|wénhuà|문화
遗产|yíchǎn|유산
艺术|yìshù|예술
欣赏|xīnshǎng|감상하다
风格|fēnggé|스타일; 풍격
氛围|fēnwéi|분위기
怀念|huáiniàn|그리워하다
回忆|huíyì|회상하다; 추억
意义|yìyì|의의; 의미
价值|jiàzhí|가치
精神|jīngshén|정신
深刻|shēnkè|깊다; 인상 깊다
独特|dútè|독특하다
丰富|fēngfù|풍부하다
享受|xiǎngshòu|누리다; 즐기다
节奏|jiézòu|리듬; 템포
细节|xìjié|세부 사항
灵感|línggǎn|영감
境界|jìngjiè|경지`,
  "voca",
);

const ZH_ADVANCED_IDIOM = rows(
  `画蛇添足|huàshé tiānzú|쓸데없는 것을 덧붙이다(사족)
对牛弹琴|duìniú tánqín|쇠귀에 경 읽기
守株待兔|shǒuzhū dàitù|노력 없이 요행만 바라다
亡羊补牢|wángyáng bǔláo|늦었더라도 바로잡으면 된다
井底之蛙|jǐngdǐ zhī wā|우물 안 개구리
半信半疑|bànxìn bànyí|반신반의하다
举一反三|jǔyī fǎnsān|하나를 들으면 셋을 안다
锦上添花|jǐnshàng tiānhuā|금상첨화
雪中送炭|xuězhōng sòngtàn|어려울 때 돕다
滥竽充数|lànyú chōngshù|실력 없이 머릿수만 채우다
自相矛盾|zìxiāng máodùn|자기모순
胸有成竹|xiōngyǒu chéngzhú|미리 계산이 서 있다
脚踏实地|jiǎotà shídì|착실하게 일하다
一针见血|yìzhēn jiànxiě|정곡을 찌르다
众所周知|zhòngsuǒ zhōuzhī|모두가 알다시피
不可思议|bùkě sīyì|불가사의하다
因材施教|yīncái shījiào|적성에 맞게 가르치다
与时俱进|yǔshí jùjìn|시대와 함께 발전하다
后来居上|hòulái jūshàng|후발 주자가 앞서다
刻舟求剑|kèzhōu qiújiàn|융통성 없이 고집하다
杞人忧天|qǐrén yōutiān|쓸데없는 걱정을 하다
塞翁失马|sàiwēng shīmǎ|새옹지마
百闻不如一见|bǎi wén bùrú yí jiàn|백문이 불여일견
千里之行，始于足下|qiānlǐ zhī xíng, shǐyú zúxià|천 리 길도 한 걸음부터
马到成功|mǎdào chénggōng|순조롭게 바로 성공하다`,
  "idiom",
);

export const TRACK_SEED = {
  en: {
    intermediate: { level: "중급 1 · 여행·사회생활 표현", voca: EN_INTERMEDIATE_VOCA, idiom: EN_INTERMEDIATE_IDIOM },
    advanced: { level: "고급 1 · 비즈니스·시사·뉘앙스", voca: EN_ADVANCED_VOCA, idiom: EN_ADVANCED_IDIOM },
  },
  zh: {
    intermediate: { level: "중급 1 · 여행·사회생활 표현", voca: ZH_INTERMEDIATE_VOCA, idiom: ZH_INTERMEDIATE_IDIOM },
    advanced: { level: "고급 1 · 비즈니스·시사·성어", voca: ZH_ADVANCED_VOCA, idiom: ZH_ADVANCED_IDIOM },
  },
};

// Placement test bank: 12 words per band, none of them used in any first-week lesson.
// The test picks 8 per band (24 questions) and shows four Korean meanings to choose from.
export const PLACEMENT = {
  en: {
    basic: rows(
      `family|ˈfæməli|가족
weather|ˈwɛðɚ|날씨
kitchen|ˈkɪtʃən|부엌
hungry|ˈhʌŋɡri|배고픈
tired|ˈtaɪɚd|피곤한
borrow|ˈbɑːroʊ|빌리다
hospital|ˈhɑːspɪtəl|병원
cloudy|ˈklaʊdi|흐린
ticket|ˈtɪkɪt|표; 티켓
empty|ˈɛmpti|비어 있는
tall|tɔːl|키가 큰
quiet|ˈkwaɪət|조용한`,
      "voca",
    ),
    intermediate: rows(
      `frequently|ˈfriːkwəntli|자주; 빈번히
journey|ˈdʒɝːni|여정
permission|pɚˈmɪʃən|허락
rumor|ˈruːmɚ|소문
ingredient|ɪnˈɡriːdiənt|재료
mature|məˈtʃʊr|성숙한
persuade|pɚˈsweɪd|설득하다
temporary|ˈtɛmpərɛri|일시적인
valuable|ˈvæljəbəl|귀중한
reluctant|rɪˈlʌktənt|꺼리는; 마지못한
annual|ˈænjuəl|매년의
evidence|ˈɛvɪdəns|증거`,
      "voca",
    ),
    advanced: rows(
      `pervasive|pɚˈveɪsɪv|만연한
candor|ˈkændɚ|솔직함
obsolete|ˌɑːbsəˈliːt|구식의; 쓸모없어진
deteriorate|dɪˈtɪriəreɪt|악화되다
lucrative|ˈluːkrətɪv|수익성이 좋은
ostensibly|ɑːˈstɛnsəbli|표면상으로는
juxtapose|ˈdʒʌkstəpoʊz|나란히 놓다; 병치하다
galvanize|ˈɡælvənaɪz|자극해 행동하게 하다
cursory|ˈkɝːsəri|대충 하는; 피상적인
perfunctory|pɚˈfʌŋktəri|형식적인
innocuous|ɪˈnɑːkjuəs|무해한; 악의 없는
magnanimous|mæɡˈnænɪməs|관대한; 도량이 큰`,
      "voca",
    ),
  },
  zh: {
    basic: rows(
      `家|jiā|집
朋友|péngyou|친구
学校|xuéxiào|학교
医生|yīshēng|의사
漂亮|piàoliang|예쁘다
高兴|gāoxìng|기쁘다
衣服|yīfu|옷
下雨|xià yǔ|비가 오다
飞机|fēijī|비행기
狗|gǒu|개
睡觉|shuìjiào|자다
东西|dōngxi|물건`,
      "voca",
    ),
    intermediate: rows(
      `解释|jiěshì|설명하다
鼓励|gǔlì|격려하다
收拾|shōushi|정리하다; 치우다
讨论|tǎolùn|토론하다
区别|qūbié|차이; 구별하다
允许|yǔnxǔ|허락하다
提醒|tíxǐng|일깨우다; 상기시키다
适应|shìyìng|적응하다
详细|xiángxì|상세하다
激动|jīdòng|감격하다; 흥분하다
浪费|làngfèi|낭비하다
普遍|pǔbiàn|보편적이다`,
      "voca",
    ),
    advanced: rows(
      `弊端|bìduān|폐단
斟酌|zhēnzhuó|숙고하다
敷衍|fūyǎn|대충 얼버무리다
迄今|qìjīn|지금까지
蔓延|mànyán|만연하다; 퍼지다
拮据|jiéjū|(경제적으로) 궁핍하다
恪守|kèshǒu|엄격히 지키다
酝酿|yùnniàng|무르익다; 준비하다
苛刻|kēkè|가혹하다
渊博|yuānbó|학식이 깊고 넓다
倔强|juéjiàng|고집이 세다
憧憬|chōngjǐng|동경하다`,
      "voca",
    ),
  },
};
