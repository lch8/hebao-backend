// All passages and questions are original. Keep the two assessment forms separate from practice.
export const A2_OBJECTIVE = {
  read: {
    practice: [
      {
        id: 'read-p-gym-door', type: 'notice',
        text: 'De voordeur van de sporthal krijgt nieuw glas. Kom deze week binnen via de deur naast de kantine. Zet je fiets zoals altijd achter het gebouw.',
        prompt: 'Hoe komen sporters deze week binnen?',
        options: ['Door de voordeur.', 'Door de deur bij de kantine.', 'Door de deur bij de fietsen.'], answer: 1,
        why: 'via de deur naast de kantine 指食堂旁的入口。楼后是停车的位置。'
      },
      {
        id: 'read-p-pottery', type: 'notice',
        text: 'Heb je vorige maand een beker gemaakt in ons atelier? De bekers zijn klaar. Haal je eigen beker zaterdag tussen tien en twaalf op. De volgende les begint pas in juni.',
        prompt: 'Waarvoor kun je zaterdag naar het atelier?',
        options: ['Om een les te volgen.', 'Om je voor juni in te schrijven.', 'Om je eigen werk mee te nemen.'], answer: 2,
        why: '通知发给已经做过杯子的人，haal je eigen beker op 表示去领回自己的作品。'
      },
      {
        id: 'read-p-parcel', type: 'message',
        text: 'Hoi Dana, er kwam een pakket voor jou. Ik heb het aangenomen. Ik ben vanavond weg, dus ik heb het aan mevrouw Bakker op nummer 12 gegeven. Groetjes, Mo',
        prompt: 'Bij wie kan Dana haar pakket vanavond ophalen?',
        options: ['Bij mevrouw Bakker.', 'Bij Mo.', 'Bij de bezorger.'], answer: 0,
        why: 'Mo 先代收，后来又交给了 12 号的 Bakker 女士。要看包裹最后在谁手里。'
      },
      {
        id: 'read-p-choir', type: 'message',
        text: 'Beste koorleden, ons optreden is vrijdag. Hebben jullie thuis nog een zwarte map? Neem die donderdag mee naar de laatste repetitie. De bladmuziek ligt al in de zaal. Groet, Sara',
        prompt: 'Wat vraagt Sara aan de koorleden?',
        options: ['Donderdag de muziek uit te printen.', 'Donderdag een map mee te nemen.', 'Vrijdag thuis te oefenen.'], answer: 1,
        why: 'die 指前一句的 zwarte map。周四彩排要带文件夹，乐谱已经在场地里。'
      },
      {
        id: 'read-p-bike-loan', type: 'conditions',
        text: 'Bij onze fietsenmaker kun je een fiets lenen tijdens de reparatie. Reserveer hem vooraf. Voor een gewone fiets betaal je niets. Voor een elektrische fiets betaal je acht euro per dag.',
        prompt: 'Tess wil tijdens de reparatie gratis fietsen. Wat kan ze doen?',
        options: ['Vooraf een gewone fiets reserveren.', 'Vooraf een elektrische fiets reserveren.', 'Een elektrische fiets voor één dag nemen.'], answer: 0,
        why: '免费的是普通自行车，而且要提前预订。电动车即使只借一天也收费。'
      },
      {
        id: 'read-p-course-lunch', type: 'conditions',
        text: 'Bij de cursus fotografie krijg je koffie en thee. De lunch kost zes euro extra. Je mag ook zelf eten meenemen. Voor de wandeling na de lunch heb je geen kaartje nodig.',
        prompt: 'Iman wil lunchen zonder extra te betalen. Wat kan ze doen?',
        options: ['Een kaartje voor de wandeling kopen.', 'In de ochtend zes euro betalen.', 'Zelf brood meenemen.'], answer: 2,
        why: '可以带自己的午饭。六欧元是订午餐的额外费用，徒步活动的门票与午餐无关。'
      },
      {
        id: 'read-p-library-hours', type: 'notice',
        text: 'Let op: deze zaterdag sluit de bibliotheek al om drie uur in plaats van vijf uur. Vanaf maandag gelden weer de normale tijden. Geleende boeken kunt u altijd inleveren via de brievenbus bij de ingang.',
        prompt: 'Mila wil zaterdag om vier uur een boek terugbrengen. Wat kan ze doen?',
        options: ['Het boek binnen aan de balie geven.', 'Het boek in de brievenbus bij de ingang doen.', 'Wachten tot maandag, want inleveren kan niet.'], answer: 1,
        why: '周六三点闭馆，但门口的还书投递口（brievenbus）全天都可以还书。'
      },
      {
        id: 'read-p-train-bus', type: 'notice',
        text: 'Zondag rijden er geen treinen tussen Delft en Rotterdam door werk aan het spoor. De vervangende bus vertrekt vanaf de achterzijde van het station. Vergeet niet in te checken bij de gele paal naast de bushalte.',
        prompt: 'Waar moet een reiziger zondag opstappen voor de bus naar Rotterdam?',
        options: ['Bij de hoofdingang van het station.', 'Op spoor 1 bij de trein.', 'Aan de achterkant van het station.'], answer: 2,
        why: 'achterzijde 指车站后门/背面。乘替代巴士前也要记得在站台旁的黄柱刷卡。'
      },
      {
        id: 'read-p-dentist-move', type: 'notice',
        text: 'Onze tandartspraktijk verhuist op 1 mei naar de Koornmarkt 24. Heeft u deze week nog een afspraak? Dan verwachten we u gewoon op ons oude adres aan de Voorstraat. Ons telefoonnummer verandert niet.',
        prompt: 'Niels heeft donderdag een afspraak bij de tandarts. Waar gaat hij naartoe?',
        options: ['Naar de Voorstraat.', 'Naar de Koornmarkt 24.', 'Hij moet eerst bellen voor een nieuw nummer.'], answer: 0,
        why: '诊所 5 月 1 日才搬去新址。本周的预约仍在旧地址 Voorstraat，电话号码也不变。'
      },
      {
        id: 'read-p-market-parking', type: 'notice',
        text: 'Zaterdag is er weekmarkt op de Markt. Tussen zes uur ’s ochtends en vijf uur ’s middags mogen auto’s hier niet rijden. Komt u op de fiets? Loop dan met uw fiets aan de hand over het plein. Auto’s kunnen parkeren in garage Zuidpoort.',
        prompt: 'Wat geldt zaterdagmiddag voor bezoekers met een fiets op de Markt?',
        options: ['Ze mogen langzaam over de markt fietsen.', 'Ze moeten afstappen en met de fiets lopen.', 'Ze moeten hun fiets in garage Zuidpoort zetten.'], answer: 1,
        why: 'met uw fiets aan de hand lopen 表示下车推着自行车走。Zuidpoort 是给汽车停的。'
      },
      {
        id: 'read-p-potluck', type: 'message',
        text: 'Hoi team, vrijdag eten we samen bij mij thuis. Ik maak al tomatensoep en een grote salade. Eva neemt taart mee voor na het eten. Kun jij brood en iets te drinken meenemen? Tot vrijdag! Groet, Bram',
        prompt: 'Wat vraagt Bram aan zijn collega om mee te nemen?',
        options: ['Tomatensoep en salade.', 'Taart voor na het eten.', 'Brood en drinken.'], answer: 2,
        why: '汤和沙拉是 Bram 自己做，蛋糕是 Eva 带，请收信人带的是面包和饮料。'
      },
      {
        id: 'read-p-class-room', type: 'message',
        text: 'Beste cursisten, dinsdagavond hebben we een ander lokaal. De schilder werkt in lokaal 204. We zitten daarom beneden in lokaal 108. De les begint nog steeds om zeven uur. Neem je werkboek mee. Groet, docent Lotte',
        prompt: 'Wat is dinsdagavond anders aan de taalles?',
        options: ['Het lokaal waarin de les is.', 'De tijd waarop de les begint.', 'Het boek dat cursisten moeten meenemen.'], answer: 0,
        why: '204 教室在粉刷，所以改到一楼 108 教室；上课时间仍是七点，同样要带练习册。'
      },
      {
        id: 'read-p-babysit', type: 'message',
        text: 'Hoi Karin, mijn trein heeft veel vertraging en ik red het niet om drie uur bij school te zijn. Kun jij Sam ophalen en even bij jou laten spelen? Ik ben rond half zes bij jou voor de deur. Heel erg bedankt! Groetjes, Mei',
        prompt: 'Hoe laat komt Mei haar kind ophalen bij Karin?',
        options: ['Om drie uur.', 'Rond half zes.', 'Zodra de trein vertrekt.'], answer: 1,
        why: '三点是请 Karin 去学校接孩子的时间，Mei 自己大约五点半（rond half zes）到 Karin 家接回孩子。'
      },
      {
        id: 'read-p-sofa-sale', type: 'message',
        text: 'Dag Omar, bedankt voor je bericht. De eettafel is vanochtend al verkocht, maar de grijze bank staat er nog. Als je wilt komen kijken, ben ik woensdagavond na zeven uur thuis. Laat je weten of je komt? Groet, Tim',
        prompt: 'Wat kan Omar woensdagavond nog bekijken?',
        options: ['Alleen de eettafel.', 'De eettafel en de grijze bank.', 'Alleen de grijze bank.'], answer: 2,
        why: '餐桌（eettafel）今天上午已经卖出，目前只剩灰色沙发（de grijze bank）还在。'
      },
      {
        id: 'read-p-museum-card', type: 'conditions',
        text: 'Een kaartje voor het museum kost 14 euro. Met een Museumkaart is de toegang altijd gratis. Studenten betalen niets op woensdag. Kinderen onder de twaalf jaar mogen elke dag gratis naar binnen. Een rondleiding met gids kost voor iedereen 4 euro extra.',
        prompt: 'Anouk is student en wil op woensdag met de gids mee. Hoeveel betaalt ze?',
        options: ['4 euro.', '14 euro.', 'Niets.'], answer: 0,
        why: '学生周三免门票，但导览（rondleiding）明确写明 voor iedereen 4 euro extra（所有人另付 4 欧）。'
      },
      {
        id: 'read-p-swim-pass', type: 'conditions',
        text: 'Met een 10-badenkaart zwem je goedkoper. De kaart staat op naam en mag niet worden uitgeleend. Je kunt de tien beurten zes maanden lang gebruiken. Voor een kluisje heb je een munt van 50 cent nodig; die krijg je na afloop terug.',
        prompt: 'Youssef heeft een 10-badenkaart. Wat mag hij wel doen?',
        options: ['De kaart een keer aan zijn broer lenen.', 'De kaart na acht maanden nog gebruiken.', 'Zijn spullen voor 50 cent statiegeld in een kluisje doen.'], answer: 2,
        why: '次卡记名不可外借且有效期仅六个月；存物柜投 50 欧分硬币用完会退还（statiegeld）。'
      },
      {
        id: 'read-p-library-print', type: 'conditions',
        text: 'Leden van de bibliotheek mogen elke maand tien pagina’s gratis in zwart-wit printen. Extra zwart-wit pagina’s kosten 10 cent. Voor kleurenprints betaalt iedereen 25 cent per pagina, ook leden. Ben je geen lid? Dan betaal je altijd 10 cent voor zwart-wit.',
        prompt: 'Sanne is lid en print deze maand twee pagina’s in kleur. Hoeveel betaalt ze?',
        options: ['Niets.', '50 cent.', '20 cent.'], answer: 1,
        why: '会员免费额度仅限黑白打印；彩色打印所有人每页 25 分，2 页就是 50 分。'
      },
      {
        id: 'read-p-shop-return', type: 'conditions',
        text: 'Kleding mag binnen veertien dagen worden teruggebracht als het kaartje er nog aan zit en u de bon meeneemt. Voor artikelen uit de uitverkoop geven wij geen geld terug. U kunt die wel ruilen voor een andere maat of een tegoedbon krijgen.',
        prompt: 'Fleur kocht een jas in de uitverkoop, maar hij is te klein. Ze heeft de bon nog. Wat kan ze krijgen?',
        options: ['Een andere maat of een tegoedbon.', 'Haar geld contant terug.', 'Niets, want uitverkoop mag nooit terug.'], answer: 0,
        why: '打折商品（uitverkoop）不退现金，但带小票和吊牌可以换尺码或换代金券（tegoedbon）。'
      }
    ],
    a: [
      {
        id: 'read-a-ticket-desk', type: 'notice',
        text: 'Welkom in het theater. Heeft u al een kaartje op uw telefoon? Loop direct naar de zaal. Wilt u nog een kaartje kopen? Ga dan eerst naar de kassa naast de garderobe.',
        prompt: 'Noor heeft haar kaartje op haar telefoon. Waar gaat ze eerst naartoe?',
        options: ['Naar de kassa.', 'Naar de garderobe.', 'Naar de zaal.'], answer: 2,
        why: '已有电子票的观众可直接去演出厅，售票处是给尚未买票的人用的。'
      },
      {
        id: 'read-a-school-box', type: 'notice',
        text: 'Voor de tekenles zoeken we oude tijdschriften met kleurenfoto’s. Leg ze deze week in de doos bij lokaal 4. Voor kranten en lege schriften hebben we al genoeg papier.',
        prompt: 'Wat kan een ouder voor deze tekenles meenemen?',
        options: ['Een tijdschrift met kleurenfoto’s.', 'Een stapel kranten.', 'Een leeg schrift.'], answer: 0,
        why: '美术课征集有彩色照片的杂志。后面两样材料学校已经够用。'
      },
      {
        id: 'read-a-kits', type: 'message',
        text: 'Hoi Bas, ik was na de training de gele shirts. Wil jij de blauwe shirts terug in de kast leggen? De ballen mag je op het veld laten voor het volgende team. Bedankt, Evi',
        prompt: 'Wat moet Bas na de training doen?',
        options: ['De gele shirts wassen.', 'De blauwe shirts opruimen.', 'De ballen in de kast leggen.'], answer: 1,
        why: 'Evi 自己洗黄色球衣，她请 Bas 把蓝色球衣放回柜子。球留给下一队。'
      },
      {
        id: 'read-a-dinner', type: 'message',
        text: 'Dag Mila, de tafel in het restaurant is nu om half zeven gereserveerd. Ik heb het al aan papa verteld. Kun jij onze neef bellen? Hij denkt nog dat we om zes uur gaan eten. Liefs, Lea',
        prompt: 'Wat wil Lea dat Mila doet?',
        options: ['Het restaurant opnieuw bellen.', 'Haar vader uitnodigen.', 'Haar neef de nieuwe tijd vertellen.'], answer: 2,
        why: '餐桌时间已改，爸爸也已经知道。Mila 需要通知仍以为六点吃饭的表亲。'
      },
      {
        id: 'read-a-walk', type: 'conditions',
        text: 'Wil je zondag mee met de stadswandeling? Tot en met woensdag kun je je online aanmelden. Daarna bel je de gids om te vragen of er nog plaats is. Betalen doe je zondag bij vertrek.',
        prompt: 'Het is vrijdag. Hoe kan Amir nog proberen mee te gaan?',
        options: ['Door nu online te betalen.', 'Door de gids te bellen.', 'Door woensdag een kaartje op te halen.'], answer: 1,
        why: '线上报名持续到周三。周五要打电话问导游是否还有名额，费用是出发时付。'
      },
      {
        id: 'read-a-tool', type: 'conditions',
        text: 'Je kunt ons gereedschap maandag terugbrengen. Kleine spullen mogen na sluitingstijd in de blauwe bak. Grote machines nemen we alleen aan de balie aan. De balie sluit om vijf uur.',
        prompt: 'Daan wil maandag een grote machine terugbrengen. Wat moet hij doen?',
        options: ['Vóór vijf uur naar de balie gaan.', 'De machine na vijf uur in de bak leggen.', 'Na sluitingstijd bij de balie wachten.'], answer: 0,
        why: '大机器必须交到柜台，小件才可以放入蓝箱。柜台五点关门。'
      }
    ],
    b: [
      {
        id: 'read-b-boat', type: 'notice',
        text: 'Vanaf vandaag vertrekken onze rondvaartboten tijdelijk vanaf steiger B. Bij steiger A wordt gewerkt. Uw kaartje blijft geldig en ook de tijden op uw kaartje blijven hetzelfde.',
        prompt: 'Wat is er veranderd voor de passagiers?',
        options: ['De plek waar ze op de boot stappen.', 'De tijd waarop de boot vertrekt.', 'Het kaartje dat ze moeten kopen.'], answer: 0,
        why: '施工只影响登船码头。原票和票上的出发时间都继续有效。'
      },
      {
        id: 'read-b-payment', type: 'notice',
        text: 'Onze winkel is gewoon open. Contactloos betalen werkt vandaag niet. Stop uw bankpas in het apparaat en toets uw pincode in. Contant betalen kan ook.',
        prompt: 'Sam wil met zijn bankpas betalen. Hoe doet hij dat vandaag?',
        options: ['Hij houdt zijn pas boven het apparaat.', 'Hij steekt zijn pas in het apparaat en gebruikt zijn code.', 'Hij bewaart zijn pas en gebruikt papiergeld.'], answer: 1,
        why: '今天使用银行卡要插卡和输密码。现金也收，但题目问的是持卡付款。'
      },
      {
        id: 'read-b-photo', type: 'message',
        text: 'Beste Jo, voor de muur in het buurthuis zoeken we foto’s van het park. Mail mij voor vrijdag één foto. Als we jouw foto kiezen, vragen we je later om een grote afdruk. Groet, Elif',
        prompt: 'Wat wil Elif nu van Jo ontvangen?',
        options: ['Een grote afdruk voor aan de muur.', 'Een map met alle foto’s van het park.', 'Eén foto per e-mail.'], answer: 2,
        why: '现在先发一张电子照片。只有作品被选中后，才会要求提供大尺寸印件。'
      },
      {
        id: 'read-b-key', type: 'message',
        text: 'Hoi Lin, ik geef je morgen mijn planten water. Je hoeft je sleutel niet meer onder de mat te leggen. Geef hem vanavond aan mijn broer. Ik haal hem na mijn werk daar op. Groeten, Noor',
        prompt: 'Wat moet Lin met de sleutel doen?',
        options: ['Hem aan de broer van Noor geven.', 'Hem onder de mat leggen.', 'Hem morgen naar Noors werk brengen.'], answer: 0,
        why: 'niet meer 取消了原来放门垫下的安排。新指示是今晚把钥匙交给 Noor 的哥哥或弟弟。'
      },
      {
        id: 'read-b-exhibit', type: 'conditions',
        text: 'Voor deze tentoonstelling betalen bezoekers vanaf twaalf jaar vijf euro. Jongere kinderen mogen gratis mee met een volwassene. Neem voor ieder kind ook een gratis kaartje mee bij de ingang.',
        prompt: 'Een moeder komt met haar zoon van tien. Welke kaartjes hebben ze nodig?',
        options: ['Twee kaartjes van vijf euro.', 'Eén kaartje van vijf euro en verder niets.', 'Een betaald kaartje en een gratis kinderkaartje.'], answer: 2,
        why: '十岁儿童在成人陪同下免费，同时也要领儿童票，所以两人各持一张票。'
      },
      {
        id: 'read-b-baking', type: 'conditions',
        text: 'Kun je niet naar de bakles komen? Tot twee dagen van tevoren krijg je je geld terug. Op de dag van de les kan iemand anders jouw plaats gebruiken. Mail ons dan vóór tien uur zijn of haar naam.',
        prompt: 'Op de ochtend van de les wil Rosa haar plek aan Noor geven. Wat moet ze doen?',
        options: ['Na de les haar geld terugvragen.', 'Vóór tien uur Noors naam mailen.', 'Noor twee dagen laten wachten.'], answer: 1,
        why: '当天可以换人。Rosa 需要在十点前发邮件告知替补者的姓名。'
      }
    ]
  },
  listen: {
    practice: [
      {
        id: 'listen-p-station', type: 'announcement',
        text: 'Beste reizigers, de bus naar het strand stopt vandaag op een andere plek. Loop langs het hotel en wacht achter het hotel. Bij de ingang van het station stopt vandaag alleen de stadsbus.',
        prompt: 'Waar wacht je vandaag op de bus naar het strand?',
        options: ['Bij de ingang van het station.', 'Voor het hotel.', 'Achter het hotel.'], answer: 2,
        why: '海滩方向的车在酒店后面。车站入口今天只停市内公交。'
      },
      {
        id: 'listen-p-pool', type: 'announcement',
        text: 'Goedemorgen zwemmers. Het diepe bad blijft open voor de zwemwedstrijd. De les voor beginners gaat ook door, maar in het kleine bad. De les begint zoals altijd om tien uur.',
        prompt: 'Wat verandert er voor de beginners?',
        options: ['Hun les begint later.', 'Ze krijgen les in een ander bad.', 'Ze doen mee aan een wedstrijd.'], answer: 1,
        why: '初学班正常上课、时间不变，变化的是改在小池上课。'
      },
      {
        id: 'listen-p-barber', type: 'conversation',
        text: 'Kan ik woensdagmiddag mijn haar laten knippen? Woensdag zit ik vol. Donderdagochtend om tien uur kan wel. Dan werk ik nog. Heeft u die dag ook na vieren tijd? Ja, om half vijf. Fijn, dan kom ik.',
        prompt: 'Wanneer gaat de klant naar de kapper?',
        options: ['Donderdag om half vijf.', 'Woensdagmiddag.', 'Donderdag om tien uur.'], answer: 0,
        why: '周三已满，周四十点客人要上班。最后双方确认周四下午四点半。'
      },
      {
        id: 'listen-p-lamp', type: 'conversation',
        text: 'Jules, kan ik even iets lenen? Natuurlijk. Heb je mijn fietslamp nodig? Nee, mijn lamp is goed. De batterij is leeg en mijn oplader ligt op mijn werk. Goed, hier is mijn oplader.',
        prompt: 'Wat leent Jules uit?',
        options: ['Een fietslamp.', 'Een batterij.', 'Een oplader.'], answer: 2,
        why: '灯能用，只是电池没电，而自己的充电器在单位。Jules 最后借出充电器。'
      },
      {
        id: 'listen-p-laundry', type: 'instruction',
        text: 'Voor de wasruimte boek je een tijd in de app. Kies eerst een vrije machine. Daarna zie je wanneer die vrij is. Kies dan een tijd en druk op de groene knop om te boeken.',
        prompt: 'Wat moet je als eerste kiezen?',
        options: ['Een tijd in de agenda.', 'Een vrije wasmachine.', 'De groene knop.'], answer: 1,
        why: 'eerst 后说先选空闲机器。选时间和点绿键是后续步骤。'
      },
      {
        id: 'listen-p-plant', type: 'instruction',
        text: 'Bedankt dat je voor mijn plant zorgt. Voel eerst aan de aarde. Is de aarde nog nat? Laat de plant dan staan. Geef alleen water als de aarde droog is.',
        prompt: 'Wat doe je als de aarde nat is?',
        options: ['Je geeft geen water.', 'Je geeft een klein beetje water.', 'Je zet de plant in water.'], answer: 0,
        why: '泥土仍湿时让植物保持原样。only/alleen 的条件是土干了才浇水。'
      },
      {
        id: 'listen-p-train-split', type: 'announcement',
        text: 'Beste reizigers, op station Rotterdam Centraal wordt deze trein gesplitst. Het voorste deel rijdt verder naar Den Haag en Leiden. Het achterste deel blijft achter in Rotterdam. Reist u naar Leiden? Loop dan nu alvast naar voren.',
        prompt: 'Waar moeten reizigers naar Leiden gaan zitten?',
        options: ['In het voorste deel van de trein.', 'In het achterste deel van de trein.', 'Ze moeten in Rotterdam een andere bus nemen.'], answer: 0,
        why: '列车在鹿特丹解编，前半截（het voorste deel）继续开往海牙和莱顿，后半截留在鹿特丹。'
      },
      {
        id: 'listen-p-supermarket', type: 'announcement',
        text: 'Beste klanten, over vijf minuten sluit kassa drie. Heeft u een volle winkelwagen? Dan helpen wij u graag bij kassa één of twee. Klanten met een mandje kunnen direct doorlopen naar de zelfscankassa’s rechts van de uitgang.',
        prompt: 'Waar kunnen klanten met alleen een mandje het snelst betalen?',
        options: ['Bij kassa drie.', 'Bij de zelfscankassa’s.', 'Alleen bij kassa één.'], answer: 1,
        why: '3 号收银台五分钟后关闭，推满车去 1、2 号，拎篮子（met een mandje）可直接去自助结账区。'
      },
      {
        id: 'listen-p-museum-close', type: 'announcement',
        text: 'Dames en heren, het is bijna kwart voor vijf. Het museumcafé sluit nu zijn deuren. De zalen blijven nog open tot vijf uur. Onze museumwinkel bij de uitgang is vandaag extra open tot kwart over vijf. Vergeet uw jas niet uit de garderobe.',
        prompt: 'Welke ruimte in het museum blijft het langst open?',
        options: ['Het museumcafé.', 'De tentoonstellingszalen.', 'De museumwinkel.'], answer: 2,
        why: '咖啡馆 16:45 关，展厅 17:00 关，博物馆商店（museumwinkel）开到 17:15。'
      },
      {
        id: 'listen-p-clinic-wait', type: 'announcement',
        text: 'Goedemorgen patiënten in de wachtkamer. Dokter de Vries heeft een spoedgeval gehad en loopt ongeveer twintig minuten uit. Heeft u een afspraak bij de assistente voor bloedprikken? Dan wordt u gewoon op de afgesproken tijd binnengeroepen.',
        prompt: 'Voor wie gaat de afspraak gewoon op tijd door?',
        options: ['Voor patiënten die komen bloedprikken.', 'Voor alle patiënten van dokter de Vries.', 'Voor niemand, iedereen wacht twintig minuten.'], answer: 0,
        why: '只有 de Vries 医生延误二十分钟；找助理抽血（bloedprikken）的预约按原定时间叫号。'
      },
      {
        id: 'listen-p-shoe-size', type: 'conversation',
        text: 'Goedemiddag, heeft u deze zwarte sportschoenen in maat 41? Ik kijk even voor u. Zwart hebben we alleen nog in maat 42. In maat 41 heb ik wel donkerblauw. Mag ik die donkerblauwe even passen? Ja hoor. Ze zitten heerlijk, ik neem ze mee.',
        prompt: 'Welke schoenen koopt de klant uiteindelijk?',
        options: ['Zwarte schoenen in maat 41.', 'Zwarte schoenen in maat 42.', 'Donkerblauwe schoenen in maat 41.'], answer: 2,
        why: '黑色 41 码售罄，店员拿来深蓝色 41 码试穿后，顾客觉得很合脚并买下。'
      },
      {
        id: 'listen-p-doctor-appt', type: 'conversation',
        text: 'Huisartsenpraktijk Centrum, goedemorgen. Hallo, ik wil graag een afspraak maken voor dinsdagochtend. Dinsdag zitten we helaas helemaal vol. Woensdag om half elf is er plek. Dan moet ik werken. Kan het woensdag in de middag? Ja, om kwart over twee. Prima, noteert u die maar.',
        prompt: 'Wanneer heeft de beller de afspraak bij de huisarts?',
        options: ['Dinsdagochtend.', 'Woensdag om kwart over twee.', 'Woensdag om half elf.'], answer: 1,
        why: '周二已满，周三十点半要上班，最后敲定周三下午两点一刻（kwart over twee）。'
      },
      {
        id: 'listen-p-train-ticket', type: 'conversation',
        text: 'Mag ik een kaartje naar Utrecht, alstublieft? Gaat u vandaag ook weer terug? Dan is een dagretour makkelijker. Nee, ik blijf het hele weekend bij mijn zus en reis pas zondag terug. Goed, dan geef ik u een enkele reis.',
        prompt: 'Welk treinkaartje koopt de reiziger?',
        options: ['Een enkele reis.', 'Een dagretour.', 'Een weekendkaart voor twee personen.'], answer: 0,
        why: '售票员先推荐当日往返票，但乘客周末住姐姐家、周日才回，所以买了单程票（enkele reis）。'
      },
      {
        id: 'listen-p-farewell-gift', type: 'conversation',
        text: 'Wat zullen we kopen voor het afscheid van onze collega Maya? Misschien bloemen? Die zijn snel uitgebloeid als ze volgende week op vakantie gaat. Chocolade dan? Nee, ze eet geen suiker. Ik zag een leuk Nederlands kookboek. Wat een goed idee, laten we dat samen halen.',
        prompt: 'Wat besluiten de collega’s voor Maya te kopen?',
        options: ['Een boeket bloemen.', 'Een doos chocolade.', 'Een Nederlands kookboek.'], answer: 2,
        why: '花容易谢、巧克力含糖都被否决，两人最终决定一起买一本荷兰语食谱书。'
      },
      {
        id: 'listen-p-coffee-machine', type: 'instruction',
        text: 'Zo werkt het nieuwe koffieapparaat op kantoor. Zet eerst een beker onder het tuitje. Kies daarna of je koffie of thee wilt. Knippert het rode lampje rechtsboven? Leeg dan eerst de lekbak voordat je op start drukt.',
        prompt: 'Wat moet je doen als het rode lampje knippert?',
        options: ['Meteen op start drukken.', 'Eerst de lekbak legen.', 'Een grotere beker pakken.'], answer: 1,
        why: '红灯闪烁时的指令是 eerst de lekbak legen（先倒掉接水盘），再按开始键。'
      },
      {
        id: 'listen-p-bike-garage', type: 'instruction',
        text: 'Welkom in de fietsenstalling van het station. Houd uw OV-chipkaart tegen de scanner bij het poortje. Zet een gewone fiets alleen in de groene rijen. De gele vakken vooraan zijn alleen voor bakfietsen. Onthoud het nummer van uw rij.',
        prompt: 'Waar mag je een gewone fiets parkeren?',
        options: ['In de gele vakken vooraan.', 'In de groene rijen.', 'Direct naast het poortje.'], answer: 1,
        why: '普通自行车停在绿色排（groene rijen），前面黄色区域仅供载货车（bakfietsen）。'
      },
      {
        id: 'listen-p-waste-pass', type: 'instruction',
        text: 'Wilt u uw vuilniszak weggooien in de container op straat? Houd uw afvalpas tegen het scherm totdat u een klik hoort. Trek dan de klep open, doe de dichtgeknoopte zak erin en sluit de klep weer. Oud karton hoort niet hierin, maar in de blauwe bak ernaast.',
        prompt: 'Wat doe je met een oude kartonnen doos?',
        options: ['Die doe je in de blauwe bak naast de container.', 'Die doe je samen met de vuilniszak in de container.', 'Die leg je boven op de klep.'], answer: 0,
        why: '最后一句明确提示旧纸板（oud karton）不要丢进垃圾井，而要放进旁边的蓝色纸张回收箱。'
      },
      {
        id: 'listen-p-ear-drops', type: 'instruction',
        text: 'U gebruikt deze oordruppels vijf dagen lang, ’s ochtends en ’s avonds. Houd het flesje eerst een minuut in uw hand zodat de druppels niet te koud zijn. Buig uw hoofd opzij en doe drie druppels in het oor. Bewaar het flesje in de kast, niet in de koelkast.',
        prompt: 'Waar moet je het flesje oordruppels bewaren?',
        options: ['In de koelkast.', 'In de kast op kamertemperatuur.', 'In warm water.'], answer: 1,
        why: '用手捂一分钟是滴之前的操作；存放位置在末句：in de kast, niet in de koelkast（放柜子里，不要放冰箱）。'
      }
    ],
    a: [
      {
        id: 'listen-a-parents', type: 'announcement',
        text: 'Welkom op de ouderavond. De stoelen in de grote zaal staan nog klaar voor het schoolfeest. Daarom beginnen we vanavond in de aula. Na het praatje van de directeur gaat u naar het lokaal van uw kind.',
        prompt: 'Waar moeten de ouders aan het begin van de avond zijn?',
        options: ['In de aula.', 'In het lokaal van hun kind.', 'In de grote zaal.'], answer: 0,
        why: 'beginnen 指开场地点在 aula。校长讲完之后家长才去孩子的教室。'
      },
      {
        id: 'listen-a-market', type: 'announcement',
        text: 'Even een bericht voor de bezoekers van de markt. Iemand heeft bij de bloemen een paar rode handschoenen gevonden. Zijn ze van u? Haal ze dan bij de informatiekraam, naast de bakker.',
        prompt: 'Waar kan de eigenaar de handschoenen ophalen?',
        options: ['Bij de bloemen.', 'Bij de bakker zelf.', 'Bij de informatiekraam.'], answer: 2,
        why: '花摊是发现手套的地方。领取地点是面包摊旁的信息台。'
      },
      {
        id: 'listen-a-gift', type: 'conversation',
        text: 'Ik zoek een cadeau voor mijn zus. Houdt ze van lezen? Ja, maar ze heeft al veel boeken. Dan is deze leeslamp misschien iets voor haar. Dat is een goed idee. Wilt u die voor mij inpakken?',
        prompt: 'Wat koopt de klant voor zijn zus?',
        options: ['Een boek.', 'Een leeslamp.', 'Cadeaupapier.'], answer: 1,
        why: '姐姐已有很多书。顾客接受读书灯的建议，随后请店员把它包装起来。'
      },
      {
        id: 'listen-a-lift', type: 'conversation',
        text: 'Zullen we samen naar de cursus rijden? Ja, haal je me thuis op? Dat is ver om. Kun je naar de bushalte bij het plein lopen? Prima, ik wacht bij die halte. Dan zijn we op tijd bij school.',
        prompt: 'Waar ontmoeten de twee mensen elkaar?',
        options: ['Bij de bushalte op het plein.', 'Bij de schooldeur.', 'Bij het huis van de cursist.'], answer: 0,
        why: '先提出到家接，后来因绕路改在广场的公交站集合。学校是目的地。'
      },
      {
        id: 'listen-a-atelier', type: 'instruction',
        text: 'We gaan het atelier opruimen. Was je kwast uit en zet hem in het glas bij de kraan. De doeken zijn nog nat. Leg die in de gele mand. Het schone papier mag op tafel blijven.',
        prompt: 'Wat leg je in de gele mand?',
        options: ['De schone vellen papier.', 'De kwasten.', 'De natte doeken.'], answer: 2,
        why: 'die 接的是刚提到的湿布。画笔放到水龙头旁的玻璃杯里。'
      },
      {
        id: 'listen-a-keys', type: 'instruction',
        text: 'Vertrek je voordat de receptie open is? Doe je kamersleutel dan in het kleine kastje met het nummer drie. De grote brievenbus eronder is alleen voor post. Je hoeft niet te wachten tot wij er zijn.',
        prompt: 'Waar laat je de kamersleutel als je vroeg vertrekt?',
        options: ['In de grote brievenbus.', 'In het kastje met nummer drie.', 'Op de balie bij de receptie.'], answer: 1,
        why: '提早退房要用标着 3 的小柜子。下方的大信箱只收信。'
      }
    ],
    b: [
      {
        id: 'listen-b-bread', type: 'announcement',
        text: 'Beste klanten, we maken de broodafdeling even schoon. U kunt nu geen vers brood laten snijden. De zakken brood bij de kassa kunt u wel gewoon kopen. Over een halfuur helpen we u weer bij de broodafdeling.',
        prompt: 'Wat kunnen klanten nu doen?',
        options: ['Bij de broodafdeling een vers brood laten snijden.', 'Een zak brood bij de kassa kopen.', 'Een halfuur bij de kassa geen brood kopen.'], answer: 1,
        why: '切新鲜面包的服务暂停，收银台旁包装好的面包仍可购买。'
      },
      {
        id: 'listen-b-story', type: 'announcement',
        text: 'Een bericht voor de kinderen die naar het verhaal komen luisteren. Het regent harder dan we dachten. We gaan daarom niet naar het park. Het verhaal begint over tien minuten binnen, op de bovenste verdieping van de bibliotheek.',
        prompt: 'Wat horen de kinderen over het verhaal?',
        options: ['Ze kunnen het vandaag in de bibliotheek horen.', 'Ze moeten nog tien minuten in het park wachten.', 'Ze kunnen het pas op een andere dag horen.'], answer: 0,
        why: '雨大所以活动搬进图书馆顶层。十分钟后照常开始。'
      },
      {
        id: 'listen-b-cafe', type: 'conversation',
        text: 'Wat wilt u drinken? Een koffie met melk, graag. De gewone melk is op. We hebben nog melk van haver. Nee, dank u. Doe dan maar thee zonder melk. Goed, die breng ik naar uw tafel.',
        prompt: 'Welk drankje brengt de medewerker?',
        options: ['Koffie met gewone melk.', 'Koffie met havermelk.', 'Thee zonder melk.'], answer: 2,
        why: '两种咖啡都是先前的选项。客人最后点的是不加奶的茶。'
      },
      {
        id: 'listen-b-dog', type: 'conversation',
        text: 'Kun jij vrijdag met mijn hond wandelen, Linde? Vrijdag ben ik de hele dag op cursus. Ik kan wel zaterdagochtend. Dat zou fijn zijn. Dan vraag ik mijn buurman voor vrijdag en kom jij de dag erna.',
        prompt: 'Wanneer gaat Linde met de hond wandelen?',
        options: ['Vrijdag overdag.', 'Zaterdagochtend.', 'Vrijdagavond.'], answer: 1,
        why: '周五要另外请邻居。Linde 答应的时间是第二天，也就是周六上午。'
      },
      {
        id: 'listen-b-soup', type: 'instruction',
        text: 'De soep staat nog op het vuur. Als het water kookt, zet je het vuur laag. Doe dan de groenten in de pan. De verse kruiden komen er pas bij als je het vuur uit hebt gezet.',
        prompt: 'Wanneer voeg je de verse kruiden toe?',
        options: ['Nadat je het vuur hebt uitgezet.', 'Voordat je het water kookt.', 'Tegelijk met de groenten.'], answer: 0,
        why: 'pas 表示“要等到……才”。香草等关火后加，蔬菜是在调小火后加。'
      },
      {
        id: 'listen-b-helmet', type: 'instruction',
        text: 'Je gaat zo met de fiets op pad. Zet je helm op en maak het bandje vast. Beweegt de helm nog als je met je hoofd schudt? Trek het bandje dan wat strakker. We vertrekken als iedereen klaar is.',
        prompt: 'Wat doe je als de helm nog beweegt?',
        options: ['Je vertrekt alvast.', 'Je maakt het bandje los.', 'Je trekt het bandje strakker.'], answer: 2,
        why: '说话人先让人戴好头盔。题目问摇头后仍会晃动的情况，接下来的指示是把带子收紧。'
      }
    ]
  },
  knm: {
    practice: [
      {
        id: 'knm-p-cv', type: 'work',
        text: 'Nadia reageert op een baan in een winkel. De winkel wil in één document kunnen zien waar zij eerder werkte en welke opleiding zij deed.',
        prompt: 'Welk document past hierbij?',
        options: ['Haar cv.', 'Haar laatste loonstrook.', 'Haar schooldiploma.'], answer: 0,
        why: 'cv（简历）可以同时介绍工作经历和教育经历。单张工资单或学历证书只说明其中一部分。',
        source: 'https://students.uu.nl/sites/default/files/CV%20checklist_NL.pdf'
      },
      {
        id: 'knm-p-holiday', type: 'work',
        text: 'Aron werkt in een magazijn. Hij wil in juli een week vrij nemen. Hij heeft nog genoeg vakantie-uren.',
        prompt: 'Bij wie vraagt hij die vakantiedagen aan?',
        options: ['Bij de gemeente.', 'Bij de vakbond.', 'Bij zijn werkgever.'], answer: 2,
        why: '使用自己的年假，要向雇主提出休假申请。vakantiedagen 指休假天数。',
        source: 'https://www.rijksoverheid.nl/themas/werk/vakantiedagen-en-vakantiegeld/vraag-en-antwoord/vakantiedagen-en-vakantiegeld/hoe-kan-ik-mijn-vakantiedagen-opnemen'
      },
      {
        id: 'knm-p-moving', type: 'services',
        text: 'Rami verhuist van Delft naar Gouda. Hij wil dat zijn nieuwe woonadres goed in het bevolkingsregister staat.',
        prompt: 'Bij welke gemeente geeft hij zijn verhuizing door?',
        options: ['Bij de gemeente waar hij werkt.', 'Bij de gemeente Gouda.', 'Bij de gemeente Delft.'], answer: 1,
        why: '搬家要向新居所在的 gemeente 申报。Rami 的新住址在 Gouda。',
        source: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/gemeenten/hoe-kan-ik-mijn-verhuizing-doorgeven-aan-de-gemeente'
      },
      {
        id: 'knm-p-machtigen', type: 'services',
        text: 'Sofia wil haar zus online de belastingaangifte voor haar laten regelen. Haar zus woont in een andere stad en heeft een eigen DigiD.',
        prompt: 'Hoe kan Sofia dit regelen?',
        options: ['Haar zus toestemming geven via DigiD Machtigen.', 'Haar zus haar eigen wachtwoord sturen.', 'Voor haar zus een tweede DigiD op Sofia’s naam aanvragen.'], answer: 0,
        why: 'DigiD Machtigen 可以针对指定事项授权他人办理。被授权的姐姐用自己的 DigiD 登录。',
        source: 'https://www.digid.nl/aanvragen-en-activeren/machtigen'
      },
      {
        id: 'knm-p-council', type: 'society',
        text: 'Bij verkiezingen in zijn gemeente ziet Bram posters van kandidaten. De gekozen mensen gaan onder meer over plannen voor straten en woningen in zijn stad.',
        prompt: 'Wie kiest Bram bij deze verkiezingen?',
        options: ['De ministers.', 'De burgemeester.', 'De leden van de gemeenteraad.'], answer: 2,
        why: '市议会选举选出 gemeenteraadsleden（市议员），市议会决定本市道路、住房等事务。',
        source: 'https://www.rijksoverheid.nl/themas/overheid-en-democratie/verkiezingen/vraag-en-antwoord/verkiezingen/waar-stem-ik-voor-bij-gemeenteraadsverkiezingen'
      },
      {
        id: 'knm-p-remembrance', type: 'society',
        text: 'Yara volgt op vier mei de Nationale Herdenking op televisie. Het is bijna acht uur in de avond.',
        prompt: 'Wat gebeurt er om acht uur tijdens deze herdenking?',
        options: ['Er begint een optocht voor Koningsdag.', 'Er zijn twee minuten stilte.', 'De mensen vieren het begin van het nieuwe jaar.'], answer: 1,
        why: '5 月 4 日是全国悼念日。晚上八点默哀两分钟。',
        source: 'https://www.4en5mei.nl/herdenken/nationale-herdenking-op-de-dam'
      },
      {
        id: 'knm-p-sick', type: 'work',
        text: 'Joris wordt op maandagochtend wakker met koorts. Hij kan vandaag niet werken. Hij belt zijn leidinggevende om zich ziek te melden.',
        prompt: 'Wat mag zijn werkgever tijdens dit telefoongesprek NIET vragen?',
        options: ['Op welk telefoonnummer Joris bereikbaar is.', 'Welke medische ziekte Joris precies heeft.', 'Wanneer Joris denkt weer te kunnen werken.'], answer: 1,
        why: '根据荷兰隐私与劳动法，雇主可以问联系地址和预计返岗时间，但无权追问具体病情，医疗信息仅由职业健康医生（bedrijfsarts）了解。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/ziekteverzuim-van-het-werk/vraag-en-antwoord/ziek-melden-bij-werkgever'
      },
      {
        id: 'knm-p-proeftijd', type: 'work',
        text: 'Layla begint bij een nieuw bedrijf en heeft een proeftijd van één maand in haar contract. Na twee weken merkt ze dat het werk helemaal niet bij haar past.',
        prompt: 'Wat geldt tijdens een geldige proeftijd in Nederland?',
        options: ['Zowel Layla als de werkgever mag het contract direct stoppen.', 'Alleen de werkgever mag het contract stoppen.', 'Layla moet altijd eerst nog een maand blijven werken.'], answer: 0,
        why: '在合法试用期（proeftijd）内，员工与雇主双方都可以立即终止劳动合同，无需提前通知期。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/arbeidsovereenkomst-en-cao/vraag-en-antwoord/wat-is-een-proeftijd'
      },
      {
        id: 'knm-p-ww', type: 'work',
        text: 'Het bedrijf waar Karim drie jaar werkte gaat failliet. Hij verliest zonder eigen schuld zijn baan en wil een werkloosheidsuitkering (WW) aanvragen.',
        prompt: 'Bij welke organisatie vraagt Karim een WW-uitkering aan?',
        options: ['Bij de Belastingdienst.', 'Bij het UWV.', 'Bij zijn zorgverzekeraar.'], answer: 1,
        why: '非因本人过错失业时，应向荷兰员工保险机构 UWV 申请失业金（WW-uitkering），并履行求职义务。',
        source: 'https://www.uwv.nl/nl/ww-uitkering'
      },
      {
        id: 'knm-p-minimumloon', type: 'work',
        text: 'Noa van 23 jaar werkt bij een klein restaurant. Ze ziet op haar loonstrook dat haar uurloon lager is dan het wettelijk minimumuurloon.',
        prompt: 'Wat is waar over het wettelijk minimumloon in Nederland?',
        options: ['Kleine bedrijven mogen zelf minder betalen.', 'Elke werkgever moet minstens het wettelijk minimumloon betalen.', 'Het minimumloon geldt alleen voor werk bij de overheid.'], answer: 1,
        why: '荷兰法定最低时薪适用于所有企业和行业，雇主无论规模大小都不得低于法定标准发薪。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/minimumloon'
      },
      {
        id: 'knm-p-huisarts', type: 'services',
        text: 'Daria hoest al een week en slaapt daardoor slecht. Ze heeft geen levensbedreigende klachten, maar wil wel medisch advies.',
        prompt: 'Wie neemt Daria in Nederland als eerste contact mee op?',
        options: ['Met haar eigen huisarts.', 'Met de spoedeisende hulp in het ziekenhuis.', 'Met alarmnummer 112.'], answer: 0,
        why: '荷兰实行分级诊疗，非危及生命的日常不适先联系家庭医生（huisarts）；112 和医院急诊仅用于紧急重症。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/eerstelijnszorg/huisarts'
      },
      {
        id: 'knm-p-zorgverzekering', type: 'services',
        text: 'Ali en Sara wonen in Nederland en hebben een dochter van zes jaar. Ze willen weten hoe het zit met de basiszorgverzekering voor hun kind.',
        prompt: 'Wat geldt voor de basiszorgverzekering van kinderen onder de 18 jaar?',
        options: ['Kinderen onder de 18 zijn gratis meeverzekerd bij een ouder.', 'Ouders moeten een apart duur pakket voor schoolkinderen betalen.', 'Kinderen mogen pas vanaf hun 18e naar de huisarts.'], answer: 0,
        why: '在荷兰居住满 18 岁须强制投保基础医保，18 岁以下儿童免费随父母之一参保（gratis meeverzekerd），且免除自付额。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/zorgverzekering/vraag-en-antwoord/wanneer-moet-ik-een-zorgverzekering-afsluiten'
      },
      {
        id: 'knm-p-huurtoeslag', type: 'services',
        text: 'Tarek woont alleen in een zelfstandige huurwoning en heeft een laag inkomen. Hij wil onderzoeken of hij recht heeft op huurtoeslag.',
        prompt: 'Waar vraagt Tarek huurtoeslag aan?',
        options: ['Bij zijn verhuurder.', 'Bij de gemeente.', 'Bij Dienst Toeslagen (Mijn Toeslagen).'], answer: 2,
        why: '租房补贴（huurtoeslag）由税务局下属补贴署 Dienst Toeslagen 审核发放，通过 DigiD 在 Mijn Toeslagen 申请。',
        source: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/huurtoeslag'
      },
      {
        id: 'knm-p-eigen-risico', type: 'services',
        text: 'Mina gaat met keelpijn op bezoek bij haar huisarts. Ze vraagt zich af of dit bezoek van haar verplichte eigen risico afgaat.',
        prompt: 'Betaalt Mina eigen risico voor een gewoon bezoek aan de huisarts?',
        options: ['Nee, een bezoek aan de huisarts valt buiten het eigen risico.', 'Ja, ze betaalt elk bezoek volledig zelf.', 'Alleen als ze in het weekend belt.'], answer: 0,
        why: '看家庭医生（huisarts）本身不计入年度自付额（eigen risico），由基础医保直接全额覆盖；抽血化验或转诊医院才可能触发自付额。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/zorgverzekering/vraag-en-antwoord/eigen-risico-zorgverzekering'
      },
      {
        id: 'knm-p-leerplicht', type: 'society',
        text: 'De ouders van een jongen van zeven jaar willen in november een week goedkoop op vakantie gaan. Dat is buiten de officiële schoolvakanties.',
        prompt: 'Mag een kind van zeven jaar zomaar een week wegblijven van school voor vakantie?',
        options: ['Ja, als de ouders het een week vooraf melden.', 'Nee, vanwege de leerplicht moet het kind naar school.', 'Ja, onder de tien jaar geldt nog geen leerplicht.'], answer: 1,
        why: '荷兰自满 5 岁起实行强制义务教育（leerplicht），家长不得因机票便宜擅自在非官方假期带孩子离校旅游。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/leerplicht/vraag-en-antwoord/leerplicht-en-kwalificatieplicht'
      },
      {
        id: 'knm-p-discriminatie', type: 'society',
        text: 'Omid solliciteert naar een baan als bezorger. Het bedrijf wijst hem af en schrijft dat ze alleen mensen aannemen die in Nederland zijn geboren.',
        prompt: 'Wat zegt de Nederlandse wet over deze reden voor afwijzing?',
        options: ['Dat is verboden discriminatie volgens artikel 1 van de Grondwet.', 'Dat mag, zolang het bedrijf dat per e-mail uitlegt.', 'Dat mag alleen bij kleine winkels.'], answer: 0,
        why: '荷兰宪法第一条（Artikel 1）明确禁止基于出身、宗教、性别等的歧视，雇主不得以出生地拒绝求职者。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/discriminatie'
      },
      {
        id: 'knm-p-koningsdag', type: 'society',
        text: 'Op 27 april ziet Wei overal in de stad mensen in oranje kleding. Op straat verkopen kinderen en buurtbewoners tweedehands spullen op kleedjes.',
        prompt: 'Welke nationale feestdag wordt er gevierd?',
        options: ['Bevrijdingsdag.', 'Sinterklaas.', 'Koningsdag.'], answer: 2,
        why: '4 月 27 日是荷兰国王节（Koningsdag），标志是橙色服饰和全城自由二手地摊市集（vrijmarkt）。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/koningshuis/koningsdag'
      },
      {
        id: 'knm-p-bike-rules', type: 'society',
        text: 'Het is donker en Lucas fietst naar huis. Onderweg krijgt hij een appje op zijn telefoon en zijn voorlicht is kapot.',
        prompt: 'Wat is volgens de Nederlandse verkeersregels verplicht op de fiets?',
        options: ['Goede verlichting gebruiken in het donker en geen telefoon vasthouden.', 'Alleen achterlicht gebruiken; een telefoon vasthouden mag langzaam wel.', 'Op de stoep fietsen als het licht kapot is.'], answer: 0,
        why: '荷兰交规强制要求天黑骑车须开启前白/黄灯与后红灯，且骑行时严禁手持手机，违者将被警方罚款。',
        source: 'https://www.rijksoverheid.nl/onderwerpen/fiets/vraag-en-antwoord/wat-zijn-de-regels-voor-fietsverlichting-en-reflectie-op-een-fiets'
      }
    ],
    a: [
      {
        id: 'knm-a-pay', type: 'work',
        text: 'Eline heeft haar eerste salaris ontvangen. Ze wil controleren welk bedrag voor haar pensioen is ingehouden en voor welke maand ze betaald is.',
        prompt: 'Op welk document kan ze dat vinden?',
        options: ['Op haar werkrooster.', 'Op haar loonstrook.', 'Op haar diploma.'], answer: 1,
        why: '工资单列出计薪期间，若通过雇主缴养老金，也列有相应的扣款。',
        source: 'https://www.rijksoverheid.nl/themas/werk/werkloos-worden/vraag-en-antwoord/arbeidsovereenkomst-en-cao/wat-staat-er-op-mijn-loonstrook'
      },
      {
        id: 'knm-a-contract', type: 'work',
        text: 'Timo gaat bij een drukkerij werken. Vóór zijn eerste werkdag wil hij de persoonlijke afspraken over zijn baan en salaris controleren.',
        prompt: 'Welk document leest hij hiervoor?',
        options: ['Zijn arbeidscontract.', 'Het rooster voor één werkdag.', 'De brief waarmee hij solliciteerde.'], answer: 0,
        why: 'arbeidscontract 是个人与雇主订立的劳动合同，里面可以核对双方约定的工作条件。',
        source: 'https://www.rijksoverheid.nl/themas/werk/werktijden/vraag-en-antwoord/arbeidsovereenkomst-en-cao/waaraan-moet-mijn-werkgever-zich-houden-bij-een-arbeidsovereenkomst'
      },
      {
        id: 'knm-a-sofa', type: 'services',
        text: 'De oude bank van Bo is helemaal kapot. Hij past niet in de afvalbak. Bo heeft een busje en wil de bank zelf als grofvuil wegbrengen.',
        prompt: 'Waar kan hij de bank naartoe brengen?',
        options: ['Naar de glasbak in de straat.', 'Naar de bak voor oud papier.', 'Naar de milieustraat van zijn gemeente.'], answer: 2,
        why: '破损沙发属于 grofvuil（大件废弃物），可以自行送到市政的 milieustraat（废物回收站）。',
        source: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/afval/wat-kan-ik-doen-met-grofvuil'
      },
      {
        id: 'knm-a-school', type: 'services',
        text: 'De dochter van Wen staat al ingeschreven bij een basisschool. Haar ouders willen weten vanaf welke verjaardag ze daar gewoon naar school mag, na de wendagen.',
        prompt: 'Vanaf welke leeftijd mag ze naar de basisschool?',
        options: ['Vanaf drie jaar.', 'Vanaf vier jaar.', 'Vanaf zes jaar.'], answer: 1,
        why: '孩子满四岁可以正式开始读小学。提前报名和入学前的适应日是另外的安排。',
        source: 'https://www.rijksoverheid.nl/themas/onderwijs/kansengelijkheid-in-het-onderwijs/basisonderwijs/vraag-en-antwoord/basisonderwijs/wanneer-mag-mijn-kind-naar-de-basisschool'
      },
      {
        id: 'knm-a-water', type: 'society',
        text: 'Bij een dijk ziet Lien mensen aan het werk. Een bord zegt dat het waterschap hier werkt. Ze vraagt zich af wat zo’n organisatie doet.',
        prompt: 'Welke taak hoort bij een waterschap?',
        options: ['Dijken beheren.', 'Paspoorten uitgeven.', 'Drinkwater in flessen verkopen.'], answer: 0,
        why: 'waterschap（水务委员会）的职责包括管理堤坝，保护地区免受水患。',
        source: 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/waterschappen/taken-waterschap'
      },
      {
        id: 'knm-a-ballot', type: 'society',
        text: 'Na het stemmen vraagt een collega op wie Salim heeft gestemd. Salim houdt dat liever voor zichzelf.',
        prompt: 'Wat mag Salim doen?',
        options: ['Hij moet de naam van de partij noemen.', 'Hij moet zijn keuze later aan zijn werkgever doorgeven.', 'Hij mag zijn keuze geheimhouden.'], answer: 2,
        why: 'stemgeheim 是投票保密。选民有权自己决定是否向别人透露投给了谁。',
        source: 'https://www.rijksoverheid.nl/themas/overheid-en-democratie/verkiezingen/vraag-en-antwoord/verkiezingen/wat-mag-er-wel-en-niet-in-het-stemhokje'
      }
    ],
    b: [
      {
        id: 'knm-b-letter', type: 'work',
        text: 'Mei wil bij een bakkerij werken. Ze schrijft een sollicitatiebrief. De bakkerij vraagt waarom zij juist daar graag wil werken.',
        prompt: 'Welk stukje uit haar brief beantwoordt die vraag?',
        options: ['“Mijn adres en telefoonnummer staan bovenaan.”', '“Ik hoor graag op welke dag het gesprek is.”', '“Ik bak graag brood en wil in uw kleine team werken.”'], answer: 2,
        why: '雇主问的是求职动机。表达对烘焙工作的兴趣和选择这个团队的原因，才回答了 waarom。',
        source: 'https://www.werk.nl/werkzoekenden/images/Sollicitatiebrief_open_voorbeeld.pdf'
      },
      {
        id: 'knm-b-cao', type: 'work',
        text: 'Rik werkt in een sector waar werkgevers en vakbonden samen afspraken hebben gemaakt over loon en vrije dagen. Hij wil die afspraken opzoeken.',
        prompt: 'Hoe heet zo’n overeenkomst?',
        options: ['Een cv.', 'Een cao.', 'Een jaaropgave.'], answer: 1,
        why: 'cao 是集体劳动协议，雇主方和员工代表在其中约定薪酬、休假等劳动条件。',
        source: 'https://www.rijksoverheid.nl/themas/werk/arbeidsovereenkomst-en-cao/vraag-en-antwoord/arbeidsovereenkomst-en-cao/wat-is-een-cao'
      },
      {
        id: 'knm-b-inbox', type: 'services',
        text: 'Lies krijgt een melding dat de overheid een digitale brief voor haar heeft klaargezet. In de melding staat de brief zelf niet.',
        prompt: 'Waar kan Lies haar digitale overheidspost lezen?',
        options: ['In de Berichtenbox van MijnOverheid.', 'In het overzicht van haar bankbetalingen.', 'In de agenda van het gemeentehuis.'], answer: 0,
        why: 'MijnOverheid 的 Berichtenbox 是接收政府电子信函的个人信箱，可以登录后阅读正文。',
        source: 'https://mijn.overheid.nl/wat-is-de-berichtenbox'
      },
      {
        id: 'knm-b-register', type: 'services',
        text: 'Ivo woont en staat ingeschreven in Tilburg. Voor een nieuwe huurwoning heeft hij een uittreksel uit de Basisregistratie Personen nodig. Hij werkt in Breda.',
        prompt: 'Waar vraagt Ivo het uittreksel aan?',
        options: ['Bij zijn werkgever in Breda.', 'Bij de gemeente Breda.', 'Bij de gemeente Tilburg.'], answer: 2,
        why: 'BRP 居民登记摘录向本人居住并登记的市镇申请，所以要找 Tilburg。',
        source: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/privacy-en-persoonsgegevens/uittreksel-bevolkingsregister-aanvragen'
      },
      {
        id: 'knm-b-belief', type: 'society',
        text: 'De volwassen Samira denkt anders over geloof dan haar ouders. Zij wil zelf kiezen of zij een geloof volgt.',
        prompt: 'Wie mag hierover beslissen?',
        options: ['Haar ouders, omdat zij bij hen is opgegroeid.', 'Samira zelf.', 'De gemeente waar Samira woont.'], answer: 1,
        why: '信仰自由包括自己选择宗教、改变信仰和选择不信教。',
        source: 'https://www.rijksoverheid.nl/themas/internationale-samenwerking/mensenrechten/mensenrechten-wereldwijd/vrijheid-van-godsdienst-en-levensovertuiging'
      },
      {
        id: 'knm-b-parliament', type: 'society',
        text: 'Op televisie ziet Koen leden van de Tweede Kamer vragen stellen aan een minister. Ze willen weten wat de minister met overheidsgeld heeft gedaan.',
        prompt: 'Welke taak van de Tweede Kamer ziet Koen hier?',
        options: ['Het werk van de regering controleren.', 'De verkiezingen in een gemeente organiseren.', 'Beslissen wie minister wordt in een ander land.'], answer: 0,
        why: '议员向部长质询是在监督政府，controleren 在这里是“监督、检查”。',
        source: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/parlement/welke-taken-heeft-de-tweede-kamer'
      }
    ]
  }
};
