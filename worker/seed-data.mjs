// Korean meanings and General American IPA; Mandarin uses simplified characters and tone-mark pinyin.
const parse=(text,kind)=>text.trim().split('\n').map(line=>{const [term,pronunciation,meaning]=line.split('|');return {term,pronunciation,meaning,kind}});
const enWords=parse(`arrive|əˈraɪv|도착하다
leave|liːv|떠나다
bring|brɪŋ|가져오다
carry|ˈkæri|나르다
choose|tʃuːz|고르다
need|niːd|필요로 하다
want|wɑːnt|원하다
find|faɪnd|찾다
keep|kiːp|유지하다; 보관하다
wait|weɪt|기다리다
early|ˈɝːli|이른; 일찍
late|leɪt|늦은; 늦게
ready|ˈrɛdi|준비된
busy|ˈbɪzi|바쁜
free|friː|한가한; 무료의
enough|ɪˈnʌf|충분한
again|əˈɡɛn|다시
often|ˈɔːfən|자주
always|ˈɔːlweɪz|항상
sometimes|ˈsʌmtaɪmz|때때로
buy|baɪ|사다
sell|sɛl|팔다
pay|peɪ|지불하다
cost|kɔːst|비용이 들다
price|praɪs|가격
cheap|tʃiːp|저렴한
expensive|ɪkˈspɛnsɪv|비싼
change|tʃeɪndʒ|바꾸다; 거스름돈
cash|kæʃ|현금
receipt|rɪˈsiːt|영수증
order|ˈɔːrdɚ|주문하다; 주문
size|saɪz|크기
color|ˈkʌlɚ|색깔
small|smɔːl|작은
large|lɑːrdʒ|큰
open|ˈoʊpən|열다; 열린
close|kloʊz|닫다
store|stɔːr|가게
market|ˈmɑːrkɪt|시장
customer|ˈkʌstəmɚ|고객
morning|ˈmɔːrnɪŋ|아침
noon|nuːn|정오
evening|ˈiːvnɪŋ|저녁
night|naɪt|밤
week|wiːk|주
month|mʌnθ|달; 월
year|jɪr|해; 년
today|təˈdeɪ|오늘
tomorrow|təˈmɑːroʊ|내일
yesterday|ˈjɛstɚdeɪ|어제
before|bɪˈfɔːr|전에
after|ˈæftɚ|후에
during|ˈdʊrɪŋ|동안
minute|ˈmɪnɪt|분
hour|ˈaʊɚ|시간
start|stɑːrt|시작하다
finish|ˈfɪnɪʃ|끝내다
plan|plæn|계획
meeting|ˈmiːtɪŋ|회의; 모임
schedule|ˈskɛdʒuːl|일정
help|hɛlp|돕다
ask|æsk|묻다; 요청하다
answer|ˈænsɚ|대답하다; 대답
explain|ɪkˈspleɪn|설명하다
understand|ˌʌndɚˈstænd|이해하다
remember|rɪˈmɛmbɚ|기억하다
forget|fɚˈɡɛt|잊다
learn|lɝːn|배우다
practice|ˈpræktɪs|연습하다
improve|ɪmˈpruːv|향상되다
speak|spiːk|말하다
listen|ˈlɪsən|듣다
read|riːd|읽다
write|raɪt|쓰다
repeat|rɪˈpiːt|반복하다
slow|sloʊ|느린
fast|fæst|빠른
clear|klɪr|명확한
easy|ˈiːzi|쉬운
difficult|ˈdɪfɪkəlt|어려운
work|wɝːk|일하다; 일
company|ˈkʌmpəni|회사
office|ˈɔːfɪs|사무실
team|tiːm|팀
manager|ˈmænɪdʒɚ|관리자
email|ˈiːmeɪl|이메일
message|ˈmɛsɪdʒ|메시지
call|kɔːl|전화하다
send|sɛnd|보내다
receive|rɪˈsiːv|받다
check|tʃɛk|확인하다
confirm|kənˈfɝːm|확인하여 확정하다
sample|ˈsæmpəl|견본
product|ˈprɑːdʌkt|제품
quality|ˈkwɑːləti|품질
delivery|dɪˈlɪvəri|배송
address|ˈædrɛs|주소
number|ˈnʌmbɚ|숫자; 번호
problem|ˈprɑːbləm|문제
solution|səˈluːʃən|해결책`,'voca');
const enIdioms=parse(`get up|ɡɛt ʌp|일어나다
wake up|weɪk ʌp|잠에서 깨다
go out|ɡoʊ aʊt|외출하다
come back|kʌm bæk|돌아오다
look for|lʊk fɔːr|찾다
look after|lʊk ˈæftɚ|돌보다
turn on|tɝːn ɑːn|켜다
turn off|tɝːn ɔːf|끄다
put on|pʊt ɑːn|입다; 착용하다
take off|teɪk ɔːf|벗다; 이륙하다
try on|traɪ ɑːn|입어 보다
find out|faɪnd aʊt|알아내다
pick up|pɪk ʌp|집어 들다; 데리러 가다
drop off|drɑːp ɔːf|내려 주다
run out of|rʌn aʊt əv|다 써 버리다
a little|ə ˈlɪtəl|조금
a lot of|ə lɑːt əv|많은
at least|æt liːst|적어도
right now|raɪt naʊ|바로 지금
on time|ɑːn taɪm|정시에
in time|ɪn taɪm|늦지 않게
from now on|frəm naʊ ɑːn|지금부터 계속
once in a while|wʌns ɪn ə waɪl|가끔
so far|soʊ fɑːr|지금까지
as soon as|æz suːn æz|하자마자
by the way|baɪ ðə weɪ|그런데; 말이 나온 김에
of course|əv kɔːrs|물론
no problem|noʊ ˈprɑːbləm|문제없다
take your time|teɪk jʊr taɪm|천천히 하다
hurry up|ˈhɝːi ʌp|서두르다
make sure|meɪk ʃʊr|반드시 확인하다
pay attention|peɪ əˈtɛnʃən|주의를 기울이다
keep in touch|kiːp ɪn tʌtʃ|연락을 유지하다
get in touch|ɡɛt ɪn tʌtʃ|연락을 취하다
look forward to|lʊk ˈfɔːrwɚd tə|기대하다
be good at|bi ɡʊd æt|잘하다
be interested in|bi ˈɪntrəstɪd ɪn|관심이 있다
be ready for|bi ˈrɛdi fɔːr|준비가 되어 있다
be afraid of|bi əˈfreɪd əv|두려워하다
be proud of|bi praʊd əv|자랑스러워하다
a piece of cake|ə piːs əv keɪk|아주 쉬운 일
break the ice|breɪk ði aɪs|서먹한 분위기를 깨다
under the weather|ˈʌndɚ ðə ˈwɛðɚ|몸이 좋지 않은
better late than never|ˈbɛtɚ leɪt ðæn ˈnɛvɚ|늦더라도 안 하는 것보다 낫다
step by step|stɛp baɪ stɛp|차근차근
in a hurry|ɪn ə ˈhɝːi|서두르는
out of stock|aʊt əv stɑːk|품절된
in advance|ɪn ədˈvæns|미리
as usual|æz ˈjuːʒuəl|평소처럼
sooner or later|ˈsuːnɚ ɔːr ˈleɪtɚ|조만간; 언젠가는`,'idiom');
const zhWords=parse(`我|wǒ|나
你|nǐ|너; 당신
他|tā|그
她|tā|그녀
我们|wǒmen|우리
这|zhè|이것; 이
那|nà|저것; 저
谁|shéi|누구
什么|shénme|무엇
哪里|nǎlǐ|어디
是|shì|이다
有|yǒu|있다; 가지다
在|zài|~에 있다
去|qù|가다
来|lái|오다
回|huí|돌아가다
看|kàn|보다
听|tīng|듣다
说|shuō|말하다
读|dú|읽다
吃|chī|먹다
喝|hē|마시다
水|shuǐ|물
茶|chá|차
咖啡|kāfēi|커피
米饭|mǐfàn|쌀밥
面条|miàntiáo|국수
水果|shuǐguǒ|과일
苹果|píngguǒ|사과
菜|cài|요리; 채소
买|mǎi|사다
卖|mài|팔다
钱|qián|돈
块|kuài|위안의 구어 단위
贵|guì|비싸다
便宜|piányi|저렴하다
多少|duōshao|얼마; 몇
这个|zhège|이것
那个|nàge|저것
商店|shāngdiàn|가게
今天|jīntiān|오늘
明天|míngtiān|내일
昨天|zuótiān|어제
早上|zǎoshang|아침
晚上|wǎnshang|저녁; 밤
现在|xiànzài|지금
时候|shíhou|때
分钟|fēnzhōng|분
小时|xiǎoshí|시간
星期|xīngqī|요일; 주
年|nián|년; 해
月|yuè|월; 달
日|rì|날; 일
开始|kāishǐ|시작하다
结束|jiéshù|끝나다
等|děng|기다리다
忙|máng|바쁘다
空|kòng|시간이 비다
早|zǎo|이르다
晚|wǎn|늦다
好|hǎo|좋다
大|dà|크다
小|xiǎo|작다
多|duō|많다
少|shǎo|적다
快|kuài|빠르다
慢|màn|느리다
新|xīn|새롭다
旧|jiù|오래되다
热|rè|덥다; 뜨겁다
冷|lěng|춥다; 차갑다
喜欢|xǐhuan|좋아하다
需要|xūyào|필요로 하다
想|xiǎng|생각하다; 원하다
知道|zhīdào|알다
认识|rènshi|알고 지내다
学习|xuéxí|공부하다
练习|liànxí|연습하다
记得|jìde|기억하다
忘记|wàngjì|잊다
工作|gōngzuò|일하다; 일
公司|gōngsī|회사
同事|tóngshì|동료
客户|kèhù|고객
经理|jīnglǐ|매니저; 관리자
电话|diànhuà|전화
邮件|yóujiàn|이메일; 우편물
会议|huìyì|회의
时间|shíjiān|시간
地址|dìzhǐ|주소
价格|jiàgé|가격
产品|chǎnpǐn|제품
样品|yàngpǐn|견본
质量|zhìliàng|품질
订单|dìngdān|주문서
发货|fāhuò|상품을 발송하다
付款|fùkuǎn|대금을 지불하다
确认|quèrèn|확인하다
问题|wèntí|문제; 질문
办法|bànfǎ|방법`,'voca');
const zhIdioms=parse(`没关系|méi guānxi|괜찮다; 상관없다
不客气|bú kèqi|천만에요
对不起|duìbuqǐ|미안합니다
不好意思|bù hǎoyìsi|죄송합니다; 쑥스럽다
没问题|méi wèntí|문제없다
请问|qǐngwèn|말씀 좀 묻겠습니다
等一下|děng yíxià|잠깐 기다리다
慢慢来|mànmàn lái|천천히 하다
别着急|bié zháojí|조급해하지 마세요
没办法|méi bànfǎ|방법이 없다; 어쩔 수 없다
好久不见|hǎo jiǔ bú jiàn|오랜만이다
一路平安|yí lù píng ān|가는 길 내내 평안하기를
一会儿见|yíhuìr jiàn|조금 있다 봐요
回头见|huítóu jiàn|나중에 봐요
辛苦了|xīnkǔ le|수고하셨습니다
加油|jiāyóu|힘내다; 파이팅
说实话|shuō shíhuà|솔직히 말하다
没想到|méi xiǎngdào|생각하지 못했다
有道理|yǒu dàolǐ|일리가 있다
说到做到|shuō dào zuò dào|말한 것을 실행하다
一步一步|yí bù yí bù|한 걸음씩; 차근차근
熟能生巧|shú néng shēng qiǎo|익숙해지면 요령이 생긴다
一举两得|yì jǔ liǎng dé|일거양득
一心一意|yì xīn yí yì|한마음으로 전념하다
实事求是|shí shì qiú shì|사실에 근거해 진리를 구하다`,'idiom');
export const SEED={en:{voca:enWords,idiom:enIdioms},zh:{voca:zhWords,idiom:zhIdioms}};
