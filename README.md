# SpeakSiri English 🗣️

Ứng dụng web luyện **nói & phát âm tiếng Anh cho người Việt**, lấy cảm hứng từ [ELSA Speak Nova](https://vn.elsaspeak.com/nova/).
Giao diện tiếng Việt, mobile-first, chạy **hoàn toàn trên trình duyệt**: không backend, không API key — chỉ dùng Web Speech API
(`speechSynthesis` cho giọng mẫu và `SpeechRecognition` / `webkitSpeechRecognition` để nhận diện giọng nói).

## Tính năng

| Tính năng | Mô tả |
|---|---|
| **Khảo sát đầu vào & lộ trình cá nhân** | Hỏi mục tiêu (giao tiếp hằng ngày, du lịch, công việc, IELTS), trình độ (A1→C1+) và thời gian học mỗi ngày → sinh lộ trình xen kẽ bài phát âm, bài chủ đề và hội thoại nhập vai, cùng mục tiêu XP/ngày. |
| **Huấn luyện phát âm (Pronunciation Coach)** | Từ, câu, đoạn văn ngắn. Nghe mẫu giọng 🇺🇸 Mỹ / 🇬🇧 Anh, nam / nữ (theo giọng trình duyệt có), nghe chậm, ghi âm và chấm điểm tức thì: so sánh từng từ (đúng / gần đúng / sai / thiếu), hiển thị transcript máy nghe được, mẹo sửa lỗi bằng tiếng Việt. Có ô nhập câu tùy ý. |
| **Báo cáo kiểu Speech Analyzer** | Sau mỗi bài nói: điểm tổng, Phát âm, Độ trôi chảy (tốc độ từ/phút, ngập ngừng), Độ đầy đủ, trình độ ước tính (CEFR + IELTS Speaking tham khảo). Báo cáo tổng hợp cuối mỗi bài học và trong trang Tiến độ. |
| **Phân tích giọng nói tự do** | Trả lời câu hỏi IELTS Speaking Part 1–3 bằng giọng nói (hoặc gõ): chấm trôi chảy, độ rõ, từ vựng, ngữ pháp, mạch lạc; sửa lỗi ngữ pháp; ước tính trình độ. |
| **Học như chơi game** | XP, cấp độ, hạng (Đồng → Kim cương), chuỗi ngày học 🔥, sao cho từng bài, 19 thành tích, biểu đồ XP 14 ngày, danh sách từ cần luyện. Lưu trong `localStorage` (xuất/nhập JSON). |
| **Hội thoại nhập vai "AI"** | 8 tình huống: giới thiệu bản thân, gọi món, phỏng vấn xin việc, sân bay, khách sạn, mua sắm, hỏi đường, đi khám bệnh. Trả lời bằng giọng nói hoặc gõ phím; mỗi câu được chấm điểm và góp ý (đúng ý, độ dài, lỗi ngữ pháp + câu đã sửa, câu mẫu). |
| **Gia sư song ngữ** | Lời giải thích, mẹo và góp ý bằng Tiếng Việt, English, hoặc song ngữ (chọn trong Cài đặt). |
| **Khóa học & chủ đề** | 5 khóa / 34 bài: Phát âm chuẩn cho người Việt (âm cuối, -s/-ed, TH, /s/–/ʃ/, /iː/–/ɪ/, /r/–/l/, cụm phụ âm, trọng âm & ngữ điệu), Giao tiếp hằng ngày, Du lịch, Business English, IELTS Speaking. |
| **Từ điển phát âm** | 160 từ luyện tập với IPA Mỹ & Anh, từ loại, nghĩa tiếng Việt, nghe US/UK và luyện nói từng từ; chạm vào bất kỳ từ nào trong bài để tra. |

## Cách chấm điểm phát âm

Web Speech API **không trả về dữ liệu âm vị** — chỉ trả về văn bản nhận diện (tối đa 5 phương án) và độ tin cậy. Vì vậy điểm được tính từ việc
*máy có hiểu đúng điều bạn định nói hay không* (`js/scoring.js`):

1. **Chuẩn hóa** câu mẫu và transcript: chữ thường, bỏ dấu câu, mở rộng viết tắt (`I'm` → `i am`), số → chữ (`25` → `twenty five`, `7:00` → `seven oclock`),
   chính tả Anh/Mỹ (`favourite` = `favorite`), và coi các từ đồng âm là tương đương (`right`/`write`, `there`/`their`…).
2. **Căn chỉnh từng từ** bằng thuật toán edit distance trên mức từ (chi phí thay thế dựa trên độ giống ký tự Levenshtein). Mỗi từ mẫu được gán:
   🟢 **đúng**, 🟡 **gần đúng** (máy nghe ra từ giống ≥ 60% ký tự, ví dụ `think` → `sink`), 🔴 **sai**, hoặc ~~**thiếu**~~. Từ thừa/ngập ngừng (uh, um) được ghi nhận riêng.
3. Thử **mọi phương án nhận diện** và chọn phương án khớp nhất.
4. **Điểm thành phần**
   - *Phát âm* = tỷ lệ từ đúng (đúng = 1, gần đúng = 0,5), điều chỉnh nhẹ theo độ tin cậy của bộ nhận diện.
   - *Độ trôi chảy* (câu/đoạn) = tốc độ nói (từ/phút, lý tưởng 100–170) kết hợp độ đầy đủ, trừ điểm khi ngập ngừng hoặc chèn từ thừa.
   - *Độ đầy đủ* = tỷ lệ từ mẫu đã được nói.
   - *Tổng* = 55% phát âm + 25% trôi chảy + 20% đầy đủ (bài một từ: chỉ dùng điểm phát âm).
5. **Trình độ ước tính**: ánh xạ điểm sang CEFR (A1 < 40 ≤ A2 < 55 ≤ B1 < 70 ≤ B2 < 82 ≤ C1 < 92 ≤ C2) và dải IELTS Speaking tham khảo; trình độ tổng hợp lấy trung bình có trọng số 30 bài gần nhất.
6. **Mẹo sửa lỗi** (`js/tips.js`): dựa vào chữ viết của từ bị sai để đoán âm khó (TH, âm cuối, đuôi -s/-ed, /ʃ/, /tʃ/–/dʒ/, /r/, /l/ cuối, /v/, /z/, cụm phụ âm, nguyên âm dài, trọng âm, từ chức năng bị nuốt) và tốc độ nói, rồi đưa lời khuyên dành cho người Việt.

Hội thoại nhập vai và phân tích tự do dùng luật xác định (không gọi AI bên ngoài): từ khóa phù hợp ngữ cảnh, độ dài câu, bộ kiểm tra ~25 lỗi ngữ pháp phổ biến của người Việt (`js/grammar.js`), từ nối, độ đa dạng từ vựng.

### Giới hạn

- **Không phải phân tích âm học.** Điểm đo *độ dễ hiểu đối với bộ nhận diện*, không đo trực tiếp vị trí lưỡi, độ dài nguyên âm hay trọng âm như ELSA. Bộ nhận diện có mô hình ngôn ngữ nên đôi khi "tự sửa" lỗi phát âm nhỏ thành từ đúng (điểm có thể cao hơn thực tế), và một từ đơn lẻ dễ bị nghe nhầm hơn từ trong câu.
- Mẹo âm vị được suy ra từ chính tả, nên chỉ mang tính gợi ý.
- Độ trôi chảy dựa trên thời gian giữa lúc bắt đầu nói và kết quả cuối cùng mà trình duyệt báo về — sai số vài trăm ms.
- Trình độ CEFR/IELTS chỉ để tham khảo, không thay thế bài thi chính thức.
- Hội thoại "AI" là kịch bản có sẵn với phản hồi theo luật — không hiểu mọi câu trả lời tự do như một mô hình ngôn ngữ lớn.
- **Hỗ trợ trình duyệt:** nhận diện giọng nói chạy tốt nhất trên **Chrome / Edge (desktop & Android)** và Safari 14.1+ (iOS/macOS). Firefox chưa hỗ trợ — ứng dụng hiện ô gõ chữ thay thế. Chrome gửi âm thanh tới dịch vụ nhận diện của Google nên cần Internet. Micro chỉ hoạt động trên **HTTPS hoặc localhost**.
- Giọng nam/nữ, Anh/Mỹ phụ thuộc giọng mà hệ điều hành/trình duyệt cung cấp; trình duyệt không cho biết giới tính giọng nên ứng dụng đoán theo tên giọng và cho phép chọn giọng cụ thể trong Cài đặt.

## Chạy trên máy

Cần Node.js ≥ 18 (chỉ để chạy server tĩnh & test — ứng dụng không có bước build, không có dependency).

```bash
npm start      # http://localhost:8080
npm test       # unit test: chấm điểm, lộ trình, hội thoại, ngữ pháp, gamification, dữ liệu
```

Hoặc dùng bất kỳ static server nào (`python3 -m http.server 8080`). Mở bằng Chrome/Edge, cho phép micro khi được hỏi.

## Triển khai (GitHub Pages)

Giống dự án `mindnest-english-3000`: workflow `.github/workflows/pages.yml` chạy `npm test` rồi đóng gói `index.html`, `favicon.svg`, `css/`, `js/` và deploy bằng `actions/deploy-pages`.

1. Merge PR vào `main`.
2. Vào **Settings → Pages → Build and deployment → Source: GitHub Actions** (chỉ cần một lần).
3. Mỗi lần push lên `main` (hoặc chạy tay "Deploy to GitHub Pages" trong tab Actions) sẽ deploy tới
   `https://thanhhaikia.github.io/speak-nova-english/` (HTTPS nên micro hoạt động).

## Cấu trúc

```
index.html              khung ứng dụng + thanh điều hướng
css/style.css           giao diện mobile-first
js/app.js               router (hash), thanh trạng thái, thưởng XP/thành tích
js/speech.js            speechSynthesis (chọn giọng US/UK, nam/nữ) + SpeechRecognition
js/scoring.js           chuẩn hóa, căn chỉnh từng từ, điểm phát âm/trôi chảy, ước tính trình độ
js/tips.js              mẹo phát âm cho người Việt
js/grammar.js           kiểm tra lỗi ngữ pháp phổ biến
js/roleplay.js          chấm câu trả lời hội thoại nhập vai
js/analyzer.js          phân tích bài nói tự do (IELTS)
js/path.js              khảo sát → lộ trình cá nhân
js/gamify.js            XP, cấp độ, chuỗi ngày, thành tích
js/store.js             lưu tiến độ localStorage
js/components.js        thẻ luyện nói, báo cáo Speech Analyzer, tra từ
js/views/*.js           các màn hình
js/content/*.js         khóa học, tình huống hội thoại, từ điển IPA
tests/*.test.mjs        node:test
```
