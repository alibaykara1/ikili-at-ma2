# İkili Çatışma 2 Klonu

Yandan görünümlü, silahlı 2D platform dövüş oyunu. Orijinal oyundan esinlenen, **kendi kodum ve kendi görsellerimle** yapılan bir klon. Orijinalin görsel/ses dosyaları kullanılmayacak.

## Teknoloji
- HTML5 + Phaser 3 (Arcade Physics), tarayıcıda çalışır
- Vite ile çalıştır (`npm create vite@latest`, sonra `npm i phaser`)
- Dil: JavaScript (istenirse sonradan TypeScript'e geçilir)
- Kod yorumları ve değişken adları Türkçe veya İngilizce olabilir, ama proje içinde tutarlı ol

## Çalışma Kuralları
- Her aşamayı küçük tut, bitir, çalıştığını test et, sonra sonrakine geç
- Bir aşama bitmeden diğerine başlama
- Her aşamadan sonra nasıl test edeceğimi 1-2 satırla söyle
- Kod kopyala-yapıştır hazır olsun, uzun açıklama yazma
- Gerçek görsel yokken renkli dikdörtgen/daire gibi placeholder kullan

## Oyun Kuralları

**Amaç:** Rakibi ateş ve bombayla vurup platformdan aşağı düşürmek. Boşluğa düşen savaşçı 1 can kaybeder, canı 0 olan elenir. Son kalan kazanır.

**Mod (ilk sürüm):** Aynı klavyede 2 kişilik. Sonra botlara karşı tek kişilik. Sonra 3-4 oyuncu.

### Kontroller
| Eylem | Oyuncu 1 | Oyuncu 2 |
|---|---|---|
| Hareket | Ok tuşları | W A S D |
| Zıpla | Yukarı ok | W |
| Ateş | Z | T |
| Bomba | X | Y |

- 3. ve 4. oyuncunun varsayılan tuşları: P3 I J K L + U (ateş) O (bomba), P4 numpad 8 4 5 6 + 7 (ateş) 9 (bomba). Tüm tuşlar menüdeki TUŞLAR ekranından değiştirilir
- Zıplama: P1 yukarı ok ile, P2 W ile zıplar

### Can ve Düşme
- Her oyuncunun başlangıçta belirli sayıda canı (LIVES) var (varsayılan 3-5, ayarlanabilir)
- Vurulmak can götürmez, **geri savrulma (knockback)** yaratır. Amaç rakibi kenardan aşağı atmak
- Ekranın altına düşen savaşçı 1 can kaybeder ve platformun üstünde yeniden doğar (kısa süre dokunulmaz, etrafında mavi halka efekti)
- Can 1 kalınca ekranda "LAST LIFE" yazısı çıkar
- Can 0 olunca savaşçı elenir

### Silahlar
- Yukarıdan düşen kutulardan rastgele silah çıkar
- Başlangıç silahı: **Cool Pistol** (sınırsız mermi)
- Diğer silahların sınırlı mermisi var, mermi sayısı HUD'da görünür
- İlk sürümde 3-4 silah yeter (Cool Pistol, Sand Hawk ve 2 tane daha). Orijinalde 60 silah var ama hedef bu değil
- Her silahın ayrı hasar/knockback, ateş hızı, mermi hızı ve mermi sayısı değerleri olsun (silahlar `weapons.js` içinde veri olarak tanımlansın)

### Bomba
- X/Y ile atılır, kısa süre sonra patlar, alandaki savaşçıları savurur
- Sınırlı sayıda

### Combo ve Bildirimler
- Art arda vuruşta ekranda "HIT", "2 HITS", "3 HITS" gibi turuncu yazı çıkar
- Sol üstte kill feed: "[Katil] KILLED [Ölen]"

## Ekran Düzeni (referans: `docs/referans/oyun-ici-1.png`)
- **Sahne:** Çöl/tepe arka planı. Ahşap masa benzeri, çok katlı platformlar (üst üste 2-3 kat, ayakları var). Platformların altı boş, düşünce can gider
- **Karakterler:** Küçük, yuvarlak, renkli blob savaşçılar. Silah tutuyorlar, bazılarında şapka var. Her karakterin üstünde adı yazar (ör. "Hard AI", "Oyuncu Krali")
- **HUD (alt kenar):** Her oyuncu için bir kart yan yana dizilir. Kartta: karakter yüzü, isim, `LIVES: n`, elindeki silahın adı ve mermi sayısı
- **Efektler:** Vuruşta kan/kıvılcım benzeri parçacık, "HIT" yazısı
- Referans görsel sadece düzen ve atmosfer içindir. Sprite'ları ve arka planı kendimiz çizeriz ya da kenney.nl / itch.io'dan ücretsiz lisanslı asset kullanırız

## Bot Yapay Zekası (en son aşama)
- Zorluk seviyeleri: Easy / Normal / Hard
- Basit mantık yeterli: en yakın rakibe doğru git, menzildeyse ateş et, kenara yaklaşınca zıpla, silah kutusu varsa al
- Hard bot: daha hızlı tepki verir, daha iyi nişan alır

## Aşamalar (sırayla)
1. [x] Proje kurulumu, tek harita, çok katlı platformlar
2. [x] 2 oyuncu: hareket ve zıplama (P1 oklar, P2 WASD)
3. [x] Ateş etme + mermi + knockback (sadece Cool Pistol)
4. [x] Boşluğa düşünce can kaybı, yeniden doğma, LIVES HUD, LAST LIFE, kazanma/kaybetme ekranı
5. [x] Silah kutuları ve 3-4 farklı silah, mermi sayısı HUD'da
6. [x] Bomba
7. [x] Combo yazıları ve kill feed
8. [x] Ana menü ve ayarlar
9. [x] Botlar
10. [x] 3-4 oyuncu, daha fazla harita, daha fazla silah

## Henüz Belirsiz (ben karar verince eklenecek)
- Karakter boyutu, zıplama yüksekliği, hareket hızı için tam sayılar (oynarken ayarlanacak, sabitler tek dosyada dursun: `config.js`)
- Bomba patlama yarıçapı
- Harita sayısı ve şekilleri
- Ses efektleri ve müzik
