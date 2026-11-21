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
