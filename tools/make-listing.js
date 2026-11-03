#!/usr/bin/env node
/* Google Play store listing text for every language: store/listing/<lang>.md
   Mode and theme names are taken from lang/<code>.json so the store text uses exactly the words players see in the game.
   Play limits: title 30, short description 80, full description 4000, release notes 500 characters.
   The texts are machine-written: have a native speaker read each one before publishing.
   Usage: node tools/make-listing.js */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..'), out=path.join(root,'store/listing');

const FREE=['Sunset','Neon','Ocean','Forest','Desert','Ice','Candy','Lava','Sakura','Retro','Deep Sea','Winter Night'], PREMIUM=['Gold Rush','Galaxy','Cyber City'];
const AND={en:'and',es:'y',pt:'e',fr:'et',de:'und',it:'e',id:'dan',tr:'ve',ru:'и',hi:'और'};
const NAME={en:'English',es:'Español',pt:'Português',fr:'Français',de:'Deutsch',it:'Italiano',id:'Bahasa Indonesia',tr:'Türkçe',ru:'Русский',hi:'हिन्दी',ja:'日本語',ko:'한국어',zh:'中文 (简体)'};

const T={
en:{title:'Stack Rush: One-Tap Tower',short:'Time your tap, stack the tower, chase perfect drops. No ads. Works offline.',
 intro:'Tap to drop the sliding block onto your tower. Land it dead-center for a PERFECT and keep your full width. Miss the edge and the overhang is sliced off. How high can you build?',
 h:['HOW IT PLAYS','7 WAYS TO PLAY','BEAT YOUR BEST','15 THEMES','FAIR AND FRIENDLY'],
 how:['One tap is all you need.','Perfect drops build combos, and long streaks make your blocks grow back.','Land 8 perfects in a row to earn a shield that saves you from a miss.','The higher you climb, the faster it gets. Stay calm and keep your timing.'],
 modes:['{Classic}: one life, climb as high as you can.','{Timed Rush}: 60 seconds on the clock, perfect drops add time.','{Lives}: three lives, only a full miss costs one.','{Hazard}: dodge the sliding bombs for bonus points.','{Zen}: no speed-up and no game over. Just stack and relax.','{Daily Twist}: a new rule every day.','{Campaign}: 24 stages in 4 worlds with 3-star goals.'],
 best:['A ghost of your best run shows the height to beat.','26 achievements, levels and a daily reward streak.','Share a score card with friends in one tap.'],
 themes:'{free}, plus the premium {premium}. Unlock themes by playing, with coins you earn, or buy them. Purchases are cosmetic only: nothing you buy makes the game easier.',
 fair:['No ads.','Works offline.','No account needed. Your progress stays on your device.','A short practice round for new players and an optional timing assist.','13 languages, plus reduce-motion and sound options.'],
 news:'The game now speeds up the higher you climb, 13 languages, tablet support, and a menu that fits small phones.'},
es:{title:'Stack Rush: Torre de un Toque',short:'Toca a tiempo, apila la torre y logra caídas perfectas. Sin anuncios.',
 intro:'Toca para soltar el bloque deslizante sobre tu torre. Si cae justo en el centro, es PERFECTO y conservas todo el ancho. Si fallas el borde, lo que sobresale se corta. ¿Hasta dónde puedes subir?',
 h:['CÓMO SE JUEGA','7 FORMAS DE JUGAR','SUPERA TU RÉCORD','15 TEMAS','JUSTO Y SIN PRESIONES'],
 how:['Solo necesitas un toque.','Las caídas perfectas crean combos, y con rachas largas tus bloques vuelven a crecer.','Logra 8 perfectas seguidas y ganarás un escudo que te salva de un fallo.','Cuanto más subes, más rápido va. Mantén la calma y el ritmo.'],
 modes:['{Classic}: una vida, sube todo lo que puedas.','{Timed Rush}: 60 segundos; las caídas perfectas suman tiempo.','{Lives}: tres vidas; solo un fallo total cuesta una.','{Hazard}: esquiva las bombas que se deslizan y gana puntos extra.','{Zen}: sin aceleración ni fin de partida. Solo apila y relájate.','{Daily Twist}: una regla nueva cada día.','{Campaign}: 24 niveles en 4 mundos con objetivos de 3 estrellas.'],
 best:['Un fantasma de tu mejor partida te muestra la altura que debes superar.','26 logros, niveles y una racha de recompensas diarias.','Comparte tu puntuación con tus amigos con un solo toque.'],
 themes:'{free}, y los temas premium {premium}. Desbloquéalos jugando, con las monedas que ganes, o cómpralos. Las compras son solo cosméticas: nada de lo que compres hace el juego más fácil.',
 fair:['Sin anuncios.','Funciona sin conexión.','No necesitas cuenta. Tu progreso se queda en tu dispositivo.','Una breve ronda de práctica para jugadores nuevos y una ayuda de tiempo opcional.','13 idiomas, además de opciones de sonido y de reducción de movimiento.'],
 news:'El juego se acelera a medida que subes, ya hay 13 idiomas, compatibilidad con tabletas y un menú que cabe en móviles pequeños.'},
pt:{title:'Stack Rush: Torre de um Toque',short:'Toque na hora certa, empilhe a torre e faça quedas perfeitas. Sem anúncios.',
 intro:'Toque para soltar o bloco deslizante sobre a sua torre. Se cair bem no centro, é PERFEITO e você mantém a largura total. Se errar a borda, a parte que sobra é cortada. Até onde você consegue chegar?',
 h:['COMO SE JOGA','7 MODOS DE JOGO','SUPERE SEU RECORDE','15 TEMAS','JUSTO E SEM PRESSÃO'],
 how:['Basta um toque.','Quedas perfeitas criam combos, e sequências longas fazem os blocos crescerem de novo.','Acerte 8 perfeitas seguidas e ganhe um escudo que salva você de um erro.','Quanto mais alto você chega, mais rápido fica. Mantenha a calma e o ritmo.'],
 modes:['{Classic}: uma vida, suba o mais alto que puder.','{Timed Rush}: 60 segundos; quedas perfeitas somam tempo.','{Lives}: três vidas; só um erro total custa uma.','{Hazard}: desvie das bombas deslizantes e ganhe pontos extras.','{Zen}: sem aceleração e sem fim de jogo. Só empilhe e relaxe.','{Daily Twist}: uma regra nova todo dia.','{Campaign}: 24 fases em 4 mundos com metas de 3 estrelas.'],
 best:['Um fantasma da sua melhor partida mostra a altura a superar.','26 conquistas, níveis e uma sequência de recompensas diárias.','Compartilhe sua pontuação com os amigos em um toque.'],
 themes:'{free}, além dos temas premium {premium}. Desbloqueie jogando, com moedas que você ganha, ou compre. As compras são só visuais: nada que você compra deixa o jogo mais fácil.',
 fair:['Sem anúncios.','Funciona offline.','Não precisa de conta. Seu progresso fica no seu aparelho.','Uma rodada de treino rápida para quem está começando e uma ajuda de tempo opcional.','13 idiomas, além de opções de som e de redução de movimento.'],
 news:'O jogo acelera conforme você sobe, 13 idiomas, suporte a tablets e um menu que cabe em celulares pequenos.'},
fr:{title:'Stack Rush : Tour en un Tap',short:"Touche au bon moment, empile la tour, enchaîne les poses parfaites. Sans pub.",
 intro:"Touche l'écran pour lâcher le bloc qui glisse sur ta tour. Pose-le pile au centre pour un PARFAIT et garde toute ta largeur. Si tu rates le bord, ce qui dépasse est coupé. Jusqu'où peux-tu monter ?",
 h:['COMMENT JOUER','7 FAÇONS DE JOUER','BATS TON RECORD','15 THÈMES','ÉQUITABLE ET SANS PRESSION'],
 how:["Une seule touche suffit.","Les poses parfaites enchaînent les combos, et les longues séries font repousser tes blocs.","Réussis 8 poses parfaites d'affilée pour gagner un bouclier qui te sauve d'une erreur.","Plus tu montes, plus ça va vite. Garde ton calme et ton rythme."],
 modes:["{Classic} : une vie, monte le plus haut possible.","{Timed Rush} : 60 secondes, les poses parfaites ajoutent du temps.","{Lives} : trois vies, seule une erreur complète en coûte une.","{Hazard} : esquive les bombes qui glissent pour gagner des points bonus.","{Zen} : pas d'accélération, pas de game over. Empile et détends-toi.","{Daily Twist} : une nouvelle règle chaque jour.","{Campaign} : 24 niveaux dans 4 mondes avec des objectifs à 3 étoiles."],
 best:["Un fantôme de ta meilleure partie t'indique la hauteur à battre.","26 succès, des niveaux et une série de récompenses quotidiennes.","Partage ton score avec tes amis en un geste."],
 themes:"{free}, et les thèmes premium {premium}. Débloque-les en jouant, avec les pièces que tu gagnes, ou achète-les. Les achats sont purement esthétiques : rien de ce que tu achètes ne rend le jeu plus facile.",
 fair:["Sans publicité.","Fonctionne hors ligne.","Aucun compte requis. Ta progression reste sur ton appareil.","Une courte manche d'entraînement pour les nouveaux joueurs et une aide au timing facultative.","13 langues, avec des options de son et de réduction des animations."],
 news:"Le jeu accélère à mesure que tu montes, 13 langues, compatibilité tablettes et un menu adapté aux petits téléphones."},
de:{title:'Stack Rush: Ein-Tipp-Turm',short:'Tippe im richtigen Moment, stapel den Turm, triff perfekt. Keine Werbung.',
 intro:'Tippe, um den gleitenden Block auf deinen Turm fallen zu lassen. Triffst du genau die Mitte, ist es PERFEKT und du behältst deine volle Breite. Verfehlst du den Rand, wird der Überstand abgeschnitten. Wie hoch kommst du?',
 h:['SO SPIELST DU','7 SPIELMODI','SCHLAG DEINEN REKORD','15 DESIGNS','FAIR UND ENTSPANNT'],
 how:['Ein einziger Tipp genügt.','Perfekte Drops bauen Kombos auf, und lange Serien lassen deine Blöcke wieder wachsen.','Schaffe 8 perfekte Drops in Folge und verdiene einen Schild, der dich vor einem Fehler rettet.','Je höher du kommst, desto schneller wird es. Bleib ruhig und halte dein Timing.'],
 modes:['{Classic}: ein Leben, klettere so hoch du kannst.','{Timed Rush}: 60 Sekunden, perfekte Drops geben Zeit dazu.','{Lives}: drei Leben, nur ein kompletter Fehlwurf kostet eines.','{Hazard}: weiche den gleitenden Bomben aus und sammle Bonuspunkte.','{Zen}: keine Beschleunigung, kein Game Over. Einfach stapeln und entspannen.','{Daily Twist}: jeden Tag eine neue Regel.','{Campaign}: 24 Level in 4 Welten mit 3-Sterne-Zielen.'],
 best:['Ein Geist deines besten Durchgangs zeigt dir die Höhe, die es zu schlagen gilt.','26 Erfolge, Level und eine tägliche Belohnungsserie.','Teile deine Punktekarte mit Freunden mit einem Tipp.'],
 themes:'{free} und die Premium-Designs {premium}. Schalte sie durch Spielen frei, mit verdienten Münzen, oder kaufe sie. Käufe sind rein kosmetisch: Nichts, was du kaufst, macht das Spiel leichter.',
 fair:['Keine Werbung.','Funktioniert offline.','Kein Konto nötig. Dein Fortschritt bleibt auf deinem Gerät.','Eine kurze Übungsrunde für Neulinge und eine optionale Timing-Hilfe.','13 Sprachen, dazu Optionen für Ton und reduzierte Bewegung.'],
 news:'Das Spiel wird schneller, je höher du kommst, 13 Sprachen, Tablet-Unterstützung und ein Menü, das auch auf kleinen Handys passt.'},
it:{title:'Stack Rush: Torre a un Tocco',short:'Tocca al momento giusto, impila la torre, centra ogni blocco. Niente pubblicità.',
 intro:'Tocca per far cadere il blocco scorrevole sulla tua torre. Se cade esattamente al centro è PERFETTO e mantieni tutta la larghezza. Se sbagli il bordo, la parte che sporge viene tagliata. Quanto in alto riesci ad arrivare?',
 h:['COME SI GIOCA','7 MODI DI GIOCARE','BATTI IL TUO RECORD','15 TEMI','CORRETTO E SENZA PRESSIONI'],
 how:['Basta un solo tocco.','I lanci perfetti creano combo e le serie lunghe fanno ricrescere i blocchi.','Fai 8 lanci perfetti di fila per ottenere uno scudo che ti salva da un errore.','Più sali, più diventa veloce. Mantieni la calma e il ritmo.'],
 modes:['{Classic}: una vita, sali più in alto che puoi.','{Timed Rush}: 60 secondi, i lanci perfetti aggiungono tempo.','{Lives}: tre vite, solo un errore completo ne costa una.','{Hazard}: schiva le bombe che scivolano per ottenere punti bonus.','{Zen}: niente accelerazione e niente game over. Impila e rilassati.','{Daily Twist}: una nuova regola ogni giorno.','{Campaign}: 24 livelli in 4 mondi con obiettivi da 3 stelle.'],
 best:["Un fantasma della tua partita migliore ti mostra l'altezza da battere.",'26 traguardi, livelli e una serie di ricompense giornaliere.','Condividi il tuo punteggio con gli amici con un tocco.'],
 themes:'{free}, più i temi premium {premium}. Sbloccali giocando, con le monete che guadagni, oppure acquistali. Gli acquisti sono solo estetici: niente di ciò che compri rende il gioco più facile.',
 fair:['Niente pubblicità.','Funziona offline.','Nessun account richiesto. I tuoi progressi restano sul tuo dispositivo.','Un breve round di prova per i nuovi giocatori e un aiuto al tempismo facoltativo.','13 lingue, più opzioni per audio e riduzione del movimento.'],
 news:'Il gioco accelera man mano che sali, 13 lingue, supporto per tablet e un menu che sta anche sugli schermi piccoli.'},
id:{title:'Stack Rush: Menara Satu Ketuk',short:'Ketuk tepat waktu, tumpuk menara, raih drop sempurna. Tanpa iklan, bisa offline.',
 intro:'Ketuk untuk menjatuhkan balok yang bergeser ke menaramu. Jatuh tepat di tengah berarti SEMPURNA dan lebarnya tetap penuh. Kalau meleset di tepi, bagian yang menggantung akan terpotong. Setinggi apa kamu bisa membangunnya?',
 h:['CARA BERMAIN','7 CARA BERMAIN','PECAHKAN REKORDMU','15 TEMA','ADIL DAN NYAMAN'],
 how:['Cukup satu ketukan.','Drop sempurna membentuk kombo, dan rangkaian panjang membuat balokmu tumbuh kembali.','Raih 8 drop sempurna berturut-turut untuk mendapat perisai yang menyelamatkanmu dari satu kesalahan.','Makin tinggi, makin cepat. Tetap tenang dan jaga ritmemu.'],
 modes:['{Classic}: satu nyawa, naik setinggi mungkin.','{Timed Rush}: 60 detik, drop sempurna menambah waktu.','{Lives}: tiga nyawa, hanya meleset total yang mengurangi satu.','{Hazard}: hindari bom yang meluncur untuk poin bonus.','{Zen}: tanpa percepatan dan tanpa game over. Tumpuk dan santai saja.','{Daily Twist}: aturan baru setiap hari.','{Campaign}: 24 level di 4 dunia dengan target 3 bintang.'],
 best:['Bayangan permainan terbaikmu menunjukkan ketinggian yang harus dilampaui.','26 pencapaian, level, dan hadiah harian berturut-turut.','Bagikan kartu skor ke teman hanya dengan satu ketukan.'],
 themes:'{free}, serta tema premium {premium}. Buka dengan bermain, dengan koin yang kamu kumpulkan, atau beli. Pembelian hanya kosmetik: tidak ada yang kamu beli membuat game lebih mudah.',
 fair:['Tanpa iklan.','Bisa dimainkan offline.','Tanpa akun. Kemajuanmu tersimpan di perangkatmu.','Ronde latihan singkat untuk pemain baru dan bantuan waktu opsional.','13 bahasa, plus opsi suara dan pengurangan gerakan.'],
 news:'Game makin cepat saat kamu naik, 13 bahasa, dukungan tablet, dan menu yang muat di ponsel kecil.'},
tr:{title:'Stack Rush: Tek Dokunuşlu Kule',short:'Doğru anda dokun, kuleyi istifle, mükemmeli yakala. Reklamsız, çevrimdışı.',
 intro:'Kayan bloğu kulenin üzerine bırakmak için dokun. Tam ortaya denk gelirse MÜKEMMEL olur ve tüm genişliğini korursun. Kenarı kaçırırsan taşan kısım kesilir. Ne kadar yükseğe çıkabilirsin?',
 h:['NASIL OYNANIR','7 OYUN MODU','REKORUNU KIR','15 TEMA','ADİL VE RAHAT'],
 how:['Tek dokunuş yeterli.','Mükemmel bırakışlar kombo yapar, uzun seriler bloklarının yeniden büyümesini sağlar.','Üst üste 8 mükemmel bırakışla, bir hatadan seni kurtaran kalkan kazan.','Yükseldikçe oyun hızlanır. Sakin kal ve ritmini koru.'],
 modes:['{Classic}: tek can, çıkabildiğin kadar yüksel.','{Timed Rush}: 60 saniye, mükemmel bırakışlar süre ekler.','{Lives}: üç can, yalnızca tam ıska bir can götürür.','{Hazard}: kayan bombalardan kaç, bonus puan kazan.','{Zen}: hızlanma yok, oyun bitmez. Sadece istifle ve rahatla.','{Daily Twist}: her gün yeni bir kural.','{Campaign}: 4 dünyada 24 bölüm, 3 yıldızlı hedefler.'],
 best:['En iyi oyununun bir hayaleti, aşman gereken yüksekliği gösterir.','26 başarım, seviyeler ve günlük ödül serisi.','Skor kartını arkadaşlarınla tek dokunuşla paylaş.'],
 themes:'{free} ve premium {premium}. Temaları oynayarak, kazandığın jetonlarla açabilir ya da satın alabilirsin. Satın alımlar yalnızca görseldir: aldığın hiçbir şey oyunu kolaylaştırmaz.',
 fair:['Reklam yok.','Çevrimdışı çalışır.','Hesap gerekmez. İlerlemen cihazında kalır.','Yeni oyuncular için kısa bir alıştırma turu ve isteğe bağlı zamanlama yardımı.','13 dil; ayrıca ses ve hareketi azaltma seçenekleri.'],
 news:'Yükseldikçe hızlanan oyun, 13 dil, tablet desteği ve küçük telefonlara sığan bir menü.'},
ru:{title:'Stack Rush: Башня одним тапом',short:'Тапай вовремя, строй башню, лови идеальные броски. Без рекламы, работает офлайн.',
 intro:'Касайся экрана, чтобы сбросить скользящий блок на башню. Попадёшь точно в центр — получится ИДЕАЛЬНО, и блок сохранит всю ширину. Промахнёшься — выступающая часть будет срезана. Как высоко ты сможешь подняться?',
 h:['КАК ИГРАТЬ','7 РЕЖИМОВ','ПОБЕЙ СВОЙ РЕКОРД','15 ТЕМ','ЧЕСТНО И БЕЗ ДАВЛЕНИЯ'],
 how:['Достаточно одного касания.','Идеальные броски копят комбо, а длинные серии возвращают блокам ширину.','8 идеальных бросков подряд дают щит, который спасает от промаха.','Чем выше башня, тем быстрее игра. Сохраняй спокойствие и ритм.'],
 modes:['{Classic}: одна жизнь, поднимайся как можно выше.','{Timed Rush}: 60 секунд, идеальные броски добавляют время.','{Lives}: три жизни, отнимает только полный промах.','{Hazard}: уворачивайся от скользящих бомб ради бонусных очков.','{Zen}: без ускорения и без проигрыша. Просто строй и отдыхай.','{Daily Twist}: новое правило каждый день.','{Campaign}: 24 этапа в 4 мирах с целями на 3 звезды.'],
 best:['Призрак твоей лучшей попытки показывает высоту, которую нужно превзойти.','26 достижений, уровни и ежедневные награды за серию.','Делись результатом с друзьями одним касанием.'],
 themes:'{free}, а также премиум-темы {premium}. Открывай их в игре, за заработанные монеты или покупай. Покупки только косметические: ничто из купленного не облегчает игру.',
 fair:['Без рекламы.','Работает офлайн.','Аккаунт не нужен. Прогресс хранится на твоём устройстве.','Короткий тренировочный раунд для новичков и необязательная помощь с тайммингом.','13 языков, а также настройки звука и снижения анимации.'],
 news:'Игра ускоряется по мере подъёма, 13 языков, поддержка планшетов и меню, которое помещается на маленьких телефонах.'},
hi:{title:'Stack Rush: वन-टैप टावर',short:'सही समय पर टैप करें, टावर बनाएँ, परफ़ेक्ट ड्रॉप पाएँ। विज्ञापन नहीं, ऑफ़लाइन भी।',
 intro:'सरकते हुए ब्लॉक को अपने टावर पर गिराने के लिए टैप करें। ठीक बीच में गिरे तो PERFECT मिलता है और पूरी चौड़ाई बनी रहती है। किनारा चूके तो बाहर निकला हिस्सा कट जाता है। आप कितना ऊँचा बना सकते हैं?',
 h:['कैसे खेलें','खेलने के 7 तरीके','अपना रिकॉर्ड तोड़ें','15 थीम','ईमानदार और बिना दबाव'],
 how:['बस एक टैप काफ़ी है।','परफ़ेक्ट ड्रॉप से कॉम्बो बनते हैं, और लंबी सीरीज़ से आपके ब्लॉक फिर चौड़े हो जाते हैं।','लगातार 8 परफ़ेक्ट ड्रॉप पर आपको एक शील्ड मिलती है जो एक चूक से बचाती है।','जितना ऊपर जाएँगे, गेम उतना तेज़ होगा। शांत रहें और अपनी टाइमिंग बनाए रखें।'],
 modes:['{Classic}: एक जान, जितना ऊँचा जा सकें जाएँ।','{Timed Rush}: 60 सेकंड, परफ़ेक्ट ड्रॉप से समय बढ़ता है।','{Lives}: तीन जान, सिर्फ़ पूरी चूक पर एक जान जाती है।','{Hazard}: सरकते बमों से बचें और बोनस अंक पाएँ।','{Zen}: न स्पीड बढ़ती है, न गेम ओवर। बस ब्लॉक जमाएँ और आराम करें।','{Daily Twist}: हर दिन एक नया नियम।','{Campaign}: 4 दुनियाओं में 24 स्तर, 3 सितारों के लक्ष्य के साथ।'],
 best:['आपकी सबसे अच्छी पारी का भूत वह ऊँचाई दिखाता है जिसे पार करना है।','26 उपलब्धियाँ, लेवल और रोज़ाना इनाम की सीरीज़।','एक टैप में दोस्तों के साथ अपना स्कोर साझा करें।'],
 themes:'{free}, और प्रीमियम थीम {premium}। थीम खेलकर, कमाए गए सिक्कों से खोलें या खरीदें। खरीदारी सिर्फ़ दिखावट के लिए है: खरीदी गई कोई चीज़ गेम को आसान नहीं बनाती।',
 fair:['कोई विज्ञापन नहीं।','ऑफ़लाइन भी चलता है।','खाता बनाने की ज़रूरत नहीं। आपकी प्रगति आपके डिवाइस पर ही रहती है।','नए खिलाड़ियों के लिए छोटा अभ्यास राउंड और वैकल्पिक टाइमिंग सहायता।','13 भाषाएँ, साथ ही आवाज़ और कम गति के विकल्प।'],
 news:'जितना ऊपर जाएँ गेम उतना तेज़, 13 भाषाएँ, टैबलेट सपोर्ट और छोटे फ़ोन पर फिट होने वाला मेन्यू।'},
ja:{title:'Stack Rush：ワンタップ積みタワー',short:'タイミングよくタップして塔を積もう。ぴったり決めてコンボ。広告なし、オフラインOK。',
 intro:'タップして、左右に動くブロックをタワーの上に落とそう。ど真ん中に決まれば「PERFECT」で、幅はそのまま。端を外すとはみ出した部分は切り落とされます。どこまで高く積めるかな？',
 h:['遊び方','7つの遊び方','ベストを更新しよう','15種類のテーマ','フェアで安心'],
 how:['操作はタップだけ。','パーフェクトを決めるとコンボがつながり、連続するとブロックの幅が戻ります。','パーフェクトを8回連続で決めると、ミスを1回防ぐシールドがもらえます。','高く積むほどスピードアップ。落ち着いてタイミングを合わせよう。'],
 modes:['{Classic}：ライフ1つで、できるだけ高く。','{Timed Rush}：制限時間60秒。パーフェクトで時間が増えます。','{Lives}：ライフ3つ。完全なミスだけ1つ減ります。','{Hazard}：動く爆弾をよけてボーナス得点。','{Zen}：スピードアップもゲームオーバーもなし。のんびり積むだけ。','{Daily Twist}：毎日変わる新ルール。','{Campaign}：4つのワールドに24ステージ、星3つの目標つき。'],
 best:['ベスト記録の「ゴースト」が、超えるべき高さを教えてくれます。','実績26個、レベル、毎日のログインボーナス。','スコアカードをワンタップで友だちにシェア。'],
 themes:'{free}、そしてプレミアムの{premium}。テーマはプレイで解放、集めたコインで解放、または購入できます。購入はデザインのみ：買ったものでゲームが楽になることはありません。',
 fair:['広告なし。','オフラインでも遊べます。','アカウント登録は不要。進行状況は端末に保存されます。','初心者向けの短い練習ラウンドと、オン・オフ切り替えできるタイミング補助。','13言語対応。サウンドとモーション軽減の設定もあります。'],
 news:'高く積むほどスピードアップ。13言語、タブレット対応、小さなスマホでも収まるメニュー。'},
ko:{title:'Stack Rush: 원탭 타워 쌓기',short:'타이밍에 맞춰 탭하고 탑을 쌓으세요. 퍼펙트 드롭에 도전! 광고 없음, 오프라인 가능.',
 intro:'탭해서 좌우로 움직이는 블록을 탑 위에 떨어뜨리세요. 정중앙에 맞으면 PERFECT이고 너비가 그대로 유지돼요. 가장자리를 놓치면 튀어나온 부분이 잘려 나갑니다. 얼마나 높이 쌓을 수 있을까요?',
 h:['플레이 방법','7가지 플레이 방식','최고 기록에 도전하세요','테마 15종','공정하고 부담 없이'],
 how:['탭 한 번이면 충분해요.','퍼펙트 드롭은 콤보로 이어지고, 길게 이어가면 블록 너비가 다시 늘어나요.','퍼펙트를 8번 연속 성공하면 실수를 한 번 막아 주는 방패를 얻어요.','높이 올라갈수록 점점 빨라져요. 침착하게 타이밍을 지키세요.'],
 modes:['{Classic}: 목숨 하나로 최대한 높이 올라가세요.','{Timed Rush}: 제한 시간 60초, 퍼펙트 드롭이 시간을 늘려 줘요.','{Lives}: 목숨 3개, 완전히 놓칠 때만 하나씩 줄어요.','{Hazard}: 미끄러지는 폭탄을 피하고 보너스 점수를 얻으세요.','{Zen}: 가속도, 게임 오버도 없어요. 편하게 쌓기만 하세요.','{Daily Twist}: 매일 바뀌는 새로운 규칙.','{Campaign}: 4개 월드의 24개 스테이지, 별 3개 목표.'],
 best:['내 최고 기록의 고스트가 넘어야 할 높이를 보여 줘요.','업적 26개, 레벨, 매일 이어지는 보상.','점수 카드를 탭 한 번으로 친구에게 공유하세요.'],
 themes:'{free}, 그리고 프리미엄 {premium}. 테마는 플레이로 열거나, 모은 코인으로 열거나, 구매할 수 있어요. 구매는 외형 전용이에요. 구매한다고 게임이 쉬워지지 않아요.',
 fair:['광고 없음.','오프라인에서도 플레이 가능.','계정이 필요 없어요. 진행 상황은 내 기기에만 저장돼요.','처음 하는 분을 위한 짧은 연습 라운드와 선택형 타이밍 도움.','13개 언어 지원, 사운드와 움직임 줄이기 옵션도 있어요.'],
 news:'높이 올라갈수록 빨라지는 게임, 13개 언어, 태블릿 지원, 작은 휴대폰에 맞는 메뉴.'},
zh:{title:'Stack Rush：单点叠塔',short:'把握时机点一下，把塔越叠越高，追求完美落点。无广告，离线可玩。',
 intro:'点一下，让滑动的方块落到你的塔上。正好落在正中就是“完美”，宽度保持不变；偏出边缘，多出来的部分会被切掉。你能叠多高？',
 h:['玩法','7 种玩法','刷新你的纪录','15 款主题','公平，没压力'],
 how:['只需要点一下。','完美落点会累积连击，连续完美还能让方块变宽。','连续 8 次完美落点，可获得一次抵挡失误的护盾。','塔越高，速度越快。保持冷静，抓准节奏。'],
 modes:['{Classic}：只有一条命，尽量叠到最高。','{Timed Rush}：限时 60 秒，完美落点可以加时间。','{Lives}：三条命，只有完全失误才会扣一条。','{Hazard}：躲开滑动的炸弹，赢取额外分数。','{Zen}：不加速，也不会失败。安心叠塔，放松一下。','{Daily Twist}：每天一个新规则。','{Campaign}：4 个世界、24 个关卡，每关最多三颗星。'],
 best:['最佳纪录的“幽灵”会显示需要超越的高度。','26 项成就、等级，以及每日连续奖励。','一键把成绩卡分享给朋友。'],
 themes:'{free}，以及高级主题{premium}。可以通过游玩、用赚到的金币解锁，也可以直接购买。购买仅限外观：买到的任何东西都不会让游戏变简单。',
 fair:['无广告。','离线也能玩。','无需注册账号，进度保存在你的设备上。','为新手准备的简短练习局，以及可选的节奏辅助。','支持 13 种语言，另有音效和减少动态效果的选项。'],
 news:'越高越快的节奏、13 种语言、平板支持，以及适配小屏手机的菜单。'}
};

const list=(arr,code)=> code==='ja'?arr.join('、') : code==='ko'?arr.join(', ') : code==='zh'?arr.slice(0,-1).join('、')+'和'+arr[arr.length-1]
  : arr.slice(0,-1).join(', ')+' '+AND[code]+' '+arr[arr.length-1];
const LIM={title:30,short:80,full:4000,news:500};
fs.mkdirSync(out,{recursive:true}); let bad=0;
const rows=[];
for(const [code,t] of Object.entries(T)){
  const dict=code==='en'?{}:JSON.parse(fs.readFileSync(path.join(root,'lang',code+'.json'),'utf8'));
  const nm=k=>dict[k]||k;
  const fill=s=>s.replace(/\{(free|premium)\}/g,(m,k)=>k==='free'?(code==='zh'||code==='ja'?FREE.map(nm).join('、'):FREE.map(nm).join(', ')):list(PREMIUM.map(nm),code))
                 .replace(/\{([^}]+)\}/g,(m,k)=>nm(k));
  const bullets=a=>a.map(x=>'• '+fill(x)).join('\n');
  const full=[fill(t.intro),'',t.h[0],bullets(t.how),'',t.h[1],bullets(t.modes),'',t.h[2],bullets(t.best),'',t.h[3],fill(t.themes),'',t.h[4],bullets(t.fair)].join('\n');
  const len={title:[...t.title].length,short:[...t.short].length,full:[...full].length,news:[...t.news].length};
  const over=Object.keys(LIM).filter(k=>len[k]>LIM[k]); if(over.length) bad++;
  const emoji=/\p{Extended_Pictographic}/u.test(t.title+t.short+full+t.news);
  if(emoji) bad++;
  rows.push(`${code.padEnd(3)} title ${String(len.title).padStart(2)}/30  short ${String(len.short).padStart(2)}/80  full ${String(len.full).padStart(4)}/4000  news ${String(len.news).padStart(3)}/500${over.length?'   ✗ TOO LONG: '+over.join(', '):''}${emoji?'   ✗ emoji':''}`);
  fs.writeFileSync(path.join(out,code+'.md'),`# ${t.title}\n\n_${NAME[code]} (${code}): paste each section into the matching field of the Play Console listing._\n\n## Short description (${len.short}/80)\n${t.short}\n\n## Full description (${len.full}/4000)\n${full}\n\n## What's new (${len.news}/500)\n${t.news}\n`);
}
console.log(rows.join('\n')); console.log(bad?`\n${bad} problem(s)`:`\n✓ ${rows.length} listings written to ${path.relative(process.cwd(),out)||'.'}`);
process.exit(bad?1:0);
