// Practice vocabulary: word | US IPA | UK IPA | part of speech | Vietnamese meaning
const RAW = `
cat|kæt|kæt|n|con mèo
bed|bɛd|bed|n|cái giường
book|bʊk|bʊk|n|quyển sách
map|mæp|mæp|n|bản đồ
stop|stɑːp|stɒp|v|dừng lại
cats|kæts|kæts|n|những con mèo
dogs|dɔːɡz|dɒɡz|n|những con chó
watches|ˈwɑːtʃɪz|ˈwɒtʃɪz|v/n|xem; những chiếc đồng hồ đeo tay
worked|wɝːkt|wɜːkt|v|đã làm việc
played|pleɪd|pleɪd|v|đã chơi
wanted|ˈwɑːntɪd|ˈwɒntɪd|v|đã muốn
think|θɪŋk|θɪŋk|v|nghĩ
three|θriː|θriː|num|số ba
thank|θæŋk|θæŋk|v|cảm ơn
mother|ˈmʌðɚ|ˈmʌðə|n|mẹ
this|ðɪs|ðɪs|det|này, cái này
weather|ˈwɛðɚ|ˈweðə|n|thời tiết
sip|sɪp|sɪp|v|nhấp, uống từng ngụm
ship|ʃɪp|ʃɪp|n|con tàu
sell|sɛl|sel|v|bán
shop|ʃɑːp|ʃɒp|n|cửa hàng
sure|ʃʊr|ʃɔː|adj|chắc chắn
sheep|ʃiːp|ʃiːp|n|con cừu
leave|liːv|liːv|v|rời đi
live|lɪv|lɪv|v|sống
seat|siːt|siːt|n|chỗ ngồi
sit|sɪt|sɪt|v|ngồi
right|raɪt|raɪt|adj|bên phải; đúng
light|laɪt|laɪt|n|ánh sáng, đèn
rain|reɪn|reɪn|n/v|mưa
lane|leɪn|leɪn|n|làn đường, ngõ
really|ˈriːəli|ˈrɪəli|adv|thật sự
street|striːt|striːt|n|đường phố
spring|sprɪŋ|sprɪŋ|n|mùa xuân
splash|splæʃ|splæʃ|v|té nước, bắn tung tóe
texts|teksts|teksts|n|những tin nhắn
months|mʌnθs|mʌnθs|n|các tháng
desks|desks|desks|n|những cái bàn
photograph|ˈfoʊtəɡræf|ˈfəʊtəɡrɑːf|n|bức ảnh
photography|fəˈtɑːɡrəfi|fəˈtɒɡrəfi|n|nhiếp ảnh
develop|dɪˈveləp|dɪˈveləp|v|phát triển
comfortable|ˈkʌmftəbl|ˈkʌmftəbl|adj|thoải mái
interesting|ˈɪntrəstɪŋ|ˈɪntrəstɪŋ|adj|thú vị
hotel|hoʊˈtel|həʊˈtel|n|khách sạn
hello|həˈloʊ|həˈləʊ|interj|xin chào
name|neɪm|neɪm|n|tên
nice|naɪs|naɪs|adj|tốt, dễ chịu
meet|miːt|miːt|v|gặp
today|təˈdeɪ|təˈdeɪ|adv|hôm nay
sunny|ˈsʌni|ˈsʌni|adj|nắng
umbrella|ʌmˈbrelə|ʌmˈbrelə|n|cái ô
hobby|ˈhɑːbi|ˈhɒbi|n|sở thích
music|ˈmjuːzɪk|ˈmjuːzɪk|n|âm nhạc
favorite|ˈfeɪvərɪt|ˈfeɪvərɪt|adj|yêu thích (Anh-Anh: favourite)
weekend|ˈwiːkend|ˌwiːkˈend|n|cuối tuần
price|praɪs|praɪs|n|giá
cheap|tʃiːp|tʃiːp|adj|rẻ
expensive|ɪkˈspensɪv|ɪkˈspensɪv|adj|đắt
size|saɪz|saɪz|n|kích cỡ
call|kɔːl|kɔːl|v/n|gọi điện; cuộc gọi
message|ˈmesɪdʒ|ˈmesɪdʒ|n|tin nhắn
available|əˈveɪləbl|əˈveɪləbl|adj|rảnh, có sẵn
appointment|əˈpɔɪntmənt|əˈpɔɪntmənt|n|cuộc hẹn
headache|ˈhedeɪk|ˈhedeɪk|n|đau đầu
medicine|ˈmedɪsn|ˈmedsn|n|thuốc
fever|ˈfiːvɚ|ˈfiːvə|n|sốt
rest|rest|rest|n/v|nghỉ ngơi
passport|ˈpæspɔːrt|ˈpɑːspɔːt|n|hộ chiếu
ticket|ˈtɪkɪt|ˈtɪkɪt|n|vé
flight|flaɪt|flaɪt|n|chuyến bay
luggage|ˈlʌɡɪdʒ|ˈlʌɡɪdʒ|n|hành lý
reservation|ˌrezɚˈveɪʃn|ˌrezəˈveɪʃn|n|sự đặt chỗ
room|ruːm|ruːm|n|phòng
breakfast|ˈbrekfəst|ˈbrekfəst|n|bữa sáng
key|kiː|kiː|n|chìa khóa
station|ˈsteɪʃn|ˈsteɪʃn|n|nhà ga
left|left|left|adj|bên trái
straight|streɪt|streɪt|adv|thẳng
menu|ˈmenjuː|ˈmenjuː|n|thực đơn
order|ˈɔːrdɚ|ˈɔːdə|v/n|gọi món; đơn hàng
bill|bɪl|bɪl|n|hóa đơn
delicious|dɪˈlɪʃəs|dɪˈlɪʃəs|adj|ngon
taxi|ˈtæksi|ˈtæksi|n|xe taxi
bus|bʌs|bʌs|n|xe buýt
airport|ˈerpɔːrt|ˈeəpɔːt|n|sân bay
train|treɪn|treɪn|n|tàu hỏa
museum|mjuˈziːəm|mjuˈziːəm|n|bảo tàng
lost|lɔːst|lɒst|adj|bị lạc; bị mất
help|help|help|v/n|giúp đỡ
emergency|ɪˈmɝːdʒənsi|ɪˈmɜːdʒənsi|n|tình huống khẩn cấp
company|ˈkʌmpəni|ˈkʌmpəni|n|công ty
manager|ˈmænɪdʒɚ|ˈmænɪdʒə|n|quản lý
project|ˈprɑːdʒekt|ˈprɒdʒekt|n|dự án
team|tiːm|tiːm|n|nhóm, đội
experience|ɪkˈspɪriəns|ɪkˈspɪəriəns|n|kinh nghiệm
strength|streŋθ|streŋθ|n|điểm mạnh
weakness|ˈwiːknəs|ˈwiːknəs|n|điểm yếu
salary|ˈsæləri|ˈsæləri|n|lương
meeting|ˈmiːtɪŋ|ˈmiːtɪŋ|n|cuộc họp
agenda|əˈdʒendə|əˈdʒendə|n|chương trình họp
deadline|ˈdedlaɪn|ˈdedlaɪn|n|hạn chót
suggest|səɡˈdʒest|səˈdʒest|v|đề xuất
schedule|ˈskedʒuːl|ˈʃedjuːl|n/v|lịch trình; lên lịch
confirm|kənˈfɝːm|kənˈfɜːm|v|xác nhận
attach|əˈtætʃ|əˈtætʃ|v|đính kèm
presentation|ˌpriːzenˈteɪʃn|ˌpreznˈteɪʃn|n|bài thuyết trình
revenue|ˈrevənuː|ˈrevənjuː|n|doanh thu
increase|ɪnˈkriːs|ɪnˈkriːs|v|tăng
chart|tʃɑːrt|tʃɑːt|n|biểu đồ
contract|ˈkɑːntrækt|ˈkɒntrækt|n|hợp đồng
discount|ˈdɪskaʊnt|ˈdɪskaʊnt|n|giảm giá
agree|əˈɡriː|əˈɡriː|v|đồng ý
offer|ˈɔːfɚ|ˈɒfə|n/v|lời đề nghị; đề nghị
hometown|ˈhoʊmtaʊn|ˈhəʊmtaʊn|n|quê hương
peaceful|ˈpiːsfl|ˈpiːsfl|adj|yên bình
crowded|ˈkraʊdɪd|ˈkraʊdɪd|adj|đông đúc
countryside|ˈkʌntrisaɪd|ˈkʌntrisaɪd|n|vùng nông thôn
university|ˌjuːnɪˈvɝːsəti|ˌjuːnɪˈvɜːsəti|n|trường đại học
major|ˈmeɪdʒɚ|ˈmeɪdʒə|n|chuyên ngành
career|kəˈrɪr|kəˈrɪə|n|sự nghiệp
colleague|ˈkɑːliːɡ|ˈkɒliːɡ|n|đồng nghiệp
reading|ˈriːdɪŋ|ˈriːdɪŋ|n|việc đọc sách
relax|rɪˈlæks|rɪˈlæks|v|thư giãn
outdoor|ˈaʊtdɔːr|ˈaʊtdɔː|adj|ngoài trời
cuisine|kwɪˈziːn|kwɪˈziːn|n|ẩm thực
spicy|ˈspaɪsi|ˈspaɪsi|adj|cay
healthy|ˈhelθi|ˈhelθi|adj|lành mạnh, khỏe mạnh
recipe|ˈresəpi|ˈresəpi|n|công thức nấu ăn
admire|ədˈmaɪɚ|ədˈmaɪə|v|ngưỡng mộ
generous|ˈdʒenərəs|ˈdʒenərəs|adj|hào phóng
inspire|ɪnˈspaɪɚ|ɪnˈspaɪə|v|truyền cảm hứng
patient|ˈpeɪʃnt|ˈpeɪʃnt|adj|kiên nhẫn
memorable|ˈmemərəbl|ˈmemərəbl|adj|đáng nhớ
journey|ˈdʒɝːni|ˈdʒɜːni|n|chuyến đi, hành trình
scenery|ˈsiːnəri|ˈsiːnəri|n|phong cảnh
explore|ɪkˈsplɔːr|ɪkˈsplɔː|v|khám phá
technology|tekˈnɑːlədʒi|tekˈnɒlədʒi|n|công nghệ
convenient|kənˈviːniənt|kənˈviːniənt|adj|tiện lợi
communicate|kəˈmjuːnɪkeɪt|kəˈmjuːnɪkeɪt|v|giao tiếp
impact|ˈɪmpækt|ˈɪmpækt|n|tác động
environment|ɪnˈvaɪrənmənt|ɪnˈvaɪrənmənt|n|môi trường
pollution|pəˈluːʃn|pəˈluːʃn|n|ô nhiễm
recycle|ˌriːˈsaɪkl|ˌriːˈsaɪkl|v|tái chế
government|ˈɡʌvɚnmənt|ˈɡʌvənmənt|n|chính phủ
tree|triː|triː|n|cái cây
sink|sɪŋk|sɪŋk|n/v|bồn rửa; chìm
feet|fiːt|fiːt|n|bàn chân (số nhiều)
fit|fɪt|fɪt|v|vừa vặn
water|ˈwɑːtɚ|ˈwɔːtə|n|nước
coffee|ˈkɔːfi|ˈkɒfi|n|cà phê
family|ˈfæməli|ˈfæməli|n|gia đình
friend|frend|frend|n|bạn bè
beautiful|ˈbjuːtɪfl|ˈbjuːtɪfl|adj|đẹp
vegetable|ˈvedʒtəbl|ˈvedʒtəbl|n|rau củ
clothes|kloʊðz|kləʊðz|n|quần áo
world|wɝːld|wɜːld|n|thế giới
girl|ɡɝːl|ɡɜːl|n|cô gái
thirty|ˈθɝːti|ˈθɜːti|num|ba mươi
usually|ˈjuːʒuəli|ˈjuːʒuəli|adv|thường xuyên
pronunciation|prəˌnʌnsiˈeɪʃn|prəˌnʌnsiˈeɪʃn|n|cách phát âm
`;

export const WORDS = RAW.trim()
  .split('\n')
  .map((line) => {
    const [w, us, uk, pos, vi] = line.split('|');
    return { w, us: `/${us}/`, uk: `/${uk}/`, pos, vi };
  });

const INDEX = new Map(WORDS.map((x) => [x.w, x]));
export const lookup = (w) => INDEX.get(String(w).toLowerCase());
