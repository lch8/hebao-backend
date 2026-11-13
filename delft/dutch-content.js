// Original A2 practice. Official links describe requirements, not ownership of these questions.
export const CONTENT_CHECKED = '2026-11-13';
export const SKILLS = {read:'阅读',listen:'听力',speak:'口语',write:'写作',knm:'KNM'};
export const SOURCES = {
  integration:{name:'IND · 永居相关融入要求',url:'https://ind.nl/en/living-in-the-netherlands-with-a-residence-permit/civic-integration-for-more-secure-residence-permit'},
  exams:{name:'DUO · A2 考试形式',url:'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp'},
  practice:{name:'DUO · 官方练习',url:'https://www.inburgeren.nl/examen-doen/oefenen.jsp'},
  results:{name:'DUO · 成绩等待时间',url:'https://www.inburgeren.nl/examen-doen/uitslag.jsp'},
  ona:{name:'DUO · ONA 工作豁免',url:'https://www.inburgeren.nl/minder-of-geen-examens/vrijstelling-orientatie-op-de-nederlandse-arbeidsmarkt.jsp'},
  account:{name:'Mijn Inburgering',url:'https://www.inburgeren.nl/'},
  move:{name:'Government.nl · 搬家登记',url:'https://www.government.nl/themes/government-and-democracy/personal-data/question-and-answer/when-should-i-register-with-the-personal-records-database-as-a-resident'},
  emergency:{name:'Government.nl · 紧急求助',url:'https://www.government.nl/themes/justice-security-and-defence/emergency-number-112'},
  equality:{name:'Government.nl · 平等对待',url:'https://www.government.nl/themes/migration-and-travel/discrimination/prohibition-of-discrimination'},
  waste:{name:'Avalex · 本地垃圾日历',url:'https://avalex.nl/'}
};
const pick = (skill,text,prompt,options,answer,explanation,translation,source) => ({kind:'choice',skill,text,prompt,options,answer,explanation,translation,...(source?{source}:{})});
const output = (skill,prompt,checks,example,tip) => ({kind:'output',skill,prompt,checks,example,tip});
const lesson = (id,title,subtitle,phrase,tasks) => ({id,title,subtitle,phrase,tasks:tasks.map((task,index)=>({...task,id:`${id}-${index+1}`}))});

export const LESSONS = [
  lesson('coffee','约朋友喝咖啡','时间、地点，再加一个简单的理由。','Zullen we koffie drinken?',[
    pick('read','Hoi! Zullen we zaterdag koffie drinken? Ik kan niet om twee uur. Om drie uur kan ik wel. We zien elkaar bij het station in Delft.','Hoe laat kan Anna koffie drinken?',['Om twee uur.','Om drie uur.','Om vier uur.'],1,'两点对应 niet（不行），三点对应 wel（可以）。找最终可行的时间。','周六约咖啡：两点不行，三点可以，在 Delft 车站见。'),
    pick('listen','Hoi, met Sam. Het café is zaterdag dicht. Zullen we zondag om elf uur gaan? Tot dan!','Wanneer wil Sam naar het café?',['Zaterdag om elf uur.','Zondag om twaalf uur.','Zondag om elf uur.'],2,'Het café is zaterdag dicht：周六关门。Sam 提议的是 zondag om elf uur。','咖啡馆周六关门，Sam 提议周日上午十一点去。'),
    output('write','Je wilt met een vriend koffie drinken. Schrijf een kort bericht. Noem een dag, een tijd en een plaats.',['邀请朋友喝咖啡','写出日期或星期和时间','写出见面地点'],'Hoi Lin, zullen we zondag om elf uur koffie drinken? We kunnen bij het station in Delft afspreken. Groetjes!','先完成时间、地点和邀请这三件事，句子短一点也可以。')
  ]),
  lesson('leave','给同事请个假','说明情况，约定下一步。','Ik ben ziek. Ik kan vandaag niet komen.',[
    pick('read','Ben je ziek? Bel je leidinggevende vóór negen uur. Een e-mail alleen is niet genoeg.','Wat moet je volgens dit bericht doen als je ziek bent?',['Vóór negen uur bellen.','Alleen een e-mail sturen.','Na de lunch bellen.'],0,'这道题依据的是通知中的要求：bel vóór negen uur。不同单位的请假流程可能不同。','这份工作通知要求：生病时九点前打电话，仅发邮件不够。'),
    pick('listen','Goedemorgen. Ik ben ziek en blijf vandaag thuis. De afspraak met Eva kan morgen om tien uur.','Wanneer kan de afspraak met Eva zijn?',['Vandaag om tien uur.','Morgen om tien uur.','Morgen om negen uur.'],1,'今天留在家里；会议改为 morgen om tien uur，明天十点。','说话者今天生病在家，和 Eva 的约定可以改到明天十点。'),
    output('speak','Je bent ziek en kunt vandaag niet werken. Vertel dit aan je collega en zeg wanneer je weer belt.',['说明今天生病','说明今天不能工作','说明何时再联系'],'Ik ben ziek. Ik kan vandaag niet werken. Ik bel morgen weer.','用三个短句把事情说清楚，先练清晰表达。')
  ]),
  lesson('doctor','预约看医生','描述一个问题，确认时间。','Ik wil graag een afspraak maken.',[
    pick('read','Uw afspraak is op dinsdag om 10.20 uur. Kom tien minuten eerder en neem uw identiteitsbewijs mee.','Hoe laat moet u aanwezig zijn?',['Om 10.20 uur.','Om 10.30 uur.','Om 10.10 uur.'],2,'10:20 的预约，提前十分钟到，就是 10:10。','预约在周二 10:20，请提前十分钟，并带身份证件。'),
    pick('listen','De dokter heeft maandag geen tijd. U kunt dinsdag om half tien komen.','Wanneer kunt u komen?',['Dinsdag om 9.30 uur.','Dinsdag om 10.30 uur.','Maandag om 9.30 uur.'],0,'荷兰语 half tien 是九点半：距离十点还有半小时。','医生周一没时间，可以周二九点半来。'),
    output('speak','Je belt om een afspraak te maken. Vertel dat je al drie dagen hoest en vraag of je morgen kunt komen.',['提出预约','说明咳嗽已持续三天','询问明天能否就诊'],'Goedemorgen, ik wil graag een afspraak maken. Ik hoest al drie dagen. Kan ik morgen komen?','重点练习预约表达；练习中的人物情况是虚构的。')
  ]),
  lesson('repair','给房东报修','描述问题，提出请求。','Kunt u iemand sturen?',[
    pick('read','De monteur komt donderdag tussen 13.00 en 15.00 uur. Zorg dat er iemand thuis is.','Wat moet u doen?',['Om 12.00 uur naar kantoor gaan.','Donderdagmiddag thuis zijn.','De monteur vrijdag bellen.'],1,'通知给出周四 13:00–15:00 的时间段，并要求有人在家。','维修人员周四下午一点到三点间来，请确保家里有人。'),
    output('write','De verwarming in je woning werkt niet. Schrijf aan de verhuurder wat het probleem is en wanneer je thuis bent. Vraag om hulp.',['写清暖气不工作','提出报修请求','写出可以上门的时间'],'Beste verhuurder, de verwarming werkt niet. Kunt u iemand sturen? Ik ben donderdagmiddag thuis. Met vriendelijke groet, Li','描述问题用 de … werkt niet；提出请求用 Kunt u …?'),
    output('speak','De monteur vraagt wat er kapot is. Vertel dat de verwarming niet werkt en dat het sinds gisteren koud is in huis.',['说明暖气不工作','说明从昨天开始','说明房间很冷'],'De verwarming werkt niet. Sinds gisteren is het koud in huis.','先说问题，再补充从什么时候开始。')
  ]),
  lesson('shopping','问清购物规则','读懂条件，提出自己的需求。','Kan ik deze ruilen?',[
    pick('read','Ruilen kan binnen veertien dagen. Neem de kassabon mee. Dit geldt niet voor afgeprijsde artikelen.','Wat moet u meenemen om iets te ruilen?',['Een pasfoto.','Een treinkaartje.','De kassabon.'],2,'kassabon 是购物小票。本题仅练习理解这家示例商店的通知。','示例商店：十四天内可换货，请带小票，打折商品不适用。'),
    pick('listen','Deze jas is te klein. We hebben dezelfde jas ook in maat M. Die ligt naast de kassa.','Waar ligt de jas in maat M?',['Naast de kassa.','Buiten de winkel.','Achter de ingang.'],0,'定位线索是 naast de kassa：收银台旁边。','这件外套太小了，M 码的同款在收银台旁边。'),
    output('write','Je wilt weten of een winkel een jas in maat M heeft. Schrijf een kort bericht en vraag ook tot hoe laat de winkel vandaag open is.',['说明想要 M 码外套','询问是否有货','询问今天的关门时间'],'Hallo, heeft u deze jas in maat M? Tot hoe laat bent u vandaag open? Alvast bedankt!','把两个问题分别写成短句，避免漏掉任务。')
  ]),
  lesson('train','看懂出行变化','换站台、晚点，也能抓住重点。','Van welk spoor vertrekt de trein?',[
    pick('read','De trein naar Rotterdam vertrekt vandaag van spoor 4 in plaats van spoor 2. De vertrektijd blijft 14.15 uur.','Wat verandert er?',['De vertrektijd.','Het spoor.','De bestemming.'],1,'in plaats van 表示“代替”。站台从 2 变成 4，发车时间不变。','去 Rotterdam 的车今天改从四站台发车，不是二站台，仍在 14:15 出发。'),
    pick('listen','De bus naar Delft vertrekt over tien minuten. U kunt wachten bij halte drie.','Waar moet u wachten?',['Bij halte één.','Bij halte twee.','Bij halte drie.'],2,'问题问在哪里等，听 halte drie。over tien minuten 是十分钟后。','去 Delft 的公交十分钟后出发，请在三号站台等。'),
    output('speak','Je kunt het juiste perron niet vinden. Vraag een medewerker van welk spoor de trein naar Rotterdam vertrekt.',['礼貌引起注意','说明目的地 Rotterdam','询问出发站台'],'Pardon, van welk spoor vertrekt de trein naar Rotterdam?','Pardon 是简洁自然的开场；目的地也要说清。')
  ]),
  lesson('neighbours','和邻居好好商量','说清不便，给出一个请求。','Kunt u de muziek zachter zetten?',[
    pick('read','Beste buren, zaterdag vieren we een verjaardag. Het feest begint om zeven uur en is om elf uur afgelopen. Groeten, nummer 18.','Hoe laat eindigt het feest?',['Om elf uur.','Om zeven uur.','Om acht uur.'],0,'afgelopen 表示结束。开始时间是七点，结束时间是十一点。','18 号邻居周六办生日聚会，晚上七点开始，十一点结束。'),
    output('write','Je buurman maakt vanavond veel lawaai. Schrijf een vriendelijk bericht. Vertel waarom je last hebt en vraag of het zachter kan.',['礼貌说明噪音问题','给出一个受到影响的原因','提出调低音量的请求'],'Hoi buurman, de muziek staat erg hard. Ik moet morgen vroeg werken. Kan de muziek wat zachter? Bedankt!','请求具体一点；一个简单原因就足够。'),
    output('speak','Je geeft zaterdag een klein feest. Vertel je buurvrouw hoe laat het begint en hoe laat het eindigt.',['说明周六有聚会','给出开始时间','给出结束时间'],'Ik geef zaterdag een klein feest. Het begint om zeven uur en eindigt om elf uur.','begint 和 eindigt 分别对应开始与结束。')
  ]),
  lesson('move','搬家后办登记','找对机构，读懂所需材料。','Ik wil mijn nieuwe adres doorgeven.',[
    pick('read','Voor uw afspraak neemt u een geldig identiteitsbewijs en uw huurcontract mee. U kunt de afspraak online wijzigen.','Hoe kunt u de afspraak wijzigen?',['Alleen per brief.','Door de verhuurder te bellen.','Online.'],2,'通知直接说明 online wijzigen：可以在线改预约。','本例预约要求带有效身份证件和租约，预约可以在线修改。'),
    output('write','Je bent verhuisd en wilt weten hoe je je nieuwe adres kunt doorgeven. Schrijf aan de gemeente en vraag welke documenten nodig zijn.',['说明已经搬家','提出变更地址的需求','询问需要哪些材料'],'Goedemorgen, ik ben verhuisd en wil mijn nieuwe adres doorgeven. Welke documenten heb ik nodig? Met vriendelijke groet, Li','练习咨询材料；具体办理要求仍需查看所在市政府。'),
    pick('knm','','U verhuist van Delft naar Rotterdam. Bij welke gemeente meldt u uw nieuwe adres?',['Bij de gemeente Rotterdam.','Alleen bij de gemeente Delft.','Bij de bibliotheek.'],0,'在荷兰搬到另一座城市，应向新住所所在的市政府登记新地址。','你从 Delft 搬到 Rotterdam，应该向哪座城市的市政府报告新地址？','move')
  ]),
  lesson('course','安排一门课程','报名、缺课、换时间。','Kan ik op een andere dag komen?',[
    pick('read','De cursus Nederlands begint op 6 maart. De lessen zijn elke dinsdag en donderdag van 19.00 tot 20.30 uur.','Op welke dagen is er les?',['Maandag en woensdag.','Dinsdag en donderdag.','Alleen donderdag.'],1,'elke dinsdag en donderdag：每周二和周四。','荷语课三月六日开始，每周二、周四 19:00–20:30 上课。'),
    pick('listen','De les van donderdag gaat niet door. De docent is ziek. Volgende week dinsdag is er weer les.','Wanneer is de volgende les?',['Deze donderdag.','Volgende week donderdag.','Volgende week dinsdag.'],2,'gaat niet door 表示取消；下一次是 volgende week dinsdag。','周四的课因老师生病取消，下周二恢复上课。'),
    output('write','Je kunt donderdag niet naar de les. Schrijf aan je docent waarom je niet kunt komen en vraag naar het huiswerk.',['说明周四无法上课','给出一个原因','询问作业'],'Beste docent, ik kan donderdag niet komen, want ik moet werken. Wat is het huiswerk? Met vriendelijke groet, Li','用 want 连接一个简单原因即可。')
  ]),
  lesson('work','聊聊工作与机会','介绍自己，理解平等对待。','Ik heb ervaring met …',[
    pick('read','Wij zoeken een medewerker voor drie ochtenden per week. Stuur uw cv vóór vrijdag naar ons. Een brief is niet nodig.','Wat moet u opsturen?',['Alleen een cv.','Een cv en een lange brief.','Alleen een brief.'],0,'本例招聘通知要求发送 cv，说明不需要求职信。','示例岗位每周工作三个上午，周五前发送简历，不需要求职信。'),
    output('speak','Je stelt jezelf voor aan een nieuwe collega. Vertel je naam, wat voor werk je doet en wat je leuk vindt aan je werk.',['介绍姓名','说明自己的工作','说出喜欢这份工作的一个原因'],'Ik heet Li. Ik ben onderzoeker. Ik vind mijn werk leuk, want ik leer veel nieuwe dingen.','可以替换职业和原因，让句子适合自己。'),
    pick('knm','','Wat betekent gelijke behandeling?',['Iedereen moet hetzelfde werk doen.','Mensen worden in gelijke situaties gelijk behandeld.','Iedereen moet hetzelfde geloven.'],1,'平等对待指在同等情况下受到同等对待；不要求大家有相同职业或信仰。','gelijke behandeling（平等对待）是什么意思？','equality')
  ]),
  lesson('waste','读懂社区通知','查日历，按通知安排。','Wanneer wordt het afval opgehaald?',[
    pick('read','Let op: deze week wordt het papier op donderdag opgehaald, niet op woensdag. Zet de bak vóór 7.30 uur buiten.','Op welke dag wordt het papier deze week opgehaald?',['Woensdag.','Vrijdag.','Donderdag.'],2,'这份虚构通知把收纸日从周三改到周四。实际安排请查地址对应的垃圾日历。','本周收纸改到周四，不是周三；通知要求 7:30 前放出垃圾桶。'),
    pick('listen','De afvalbak is vol. Kijk op de kaart waar de volgende container staat. Zet de zak niet naast de bak.','Wat moet u volgens dit bericht doen?',['De zak naast de bak zetten.','Een andere container op de kaart zoeken.','De zak op straat laten liggen.'],1,'通知要求查地图寻找下一个垃圾容器，不要把袋子留在旁边。','垃圾桶满了，请查地图找下一个，不要把袋子放在桶旁。'),
    pick('knm','','U woont in Delft. Waar vindt u de ophaaldagen voor uw eigen adres?',['In de afvalkalender van Avalex.','Op een treinkaartje.','In de openingstijden van een winkel.'],0,'Delft 的收集机构 Avalex 提供按地址查询的垃圾日历。具体垃圾种类与时间按地址核对。','在 Delft，到哪里查自己地址的收垃圾日期？','waste')
  ]),
  lesson('help','在需要时寻求帮助','说清在哪里，发生了什么。','Ik heb hulp nodig.',[
    pick('read','De ingang aan de voorkant is gesloten. Gebruik vandaag de deur aan de zijkant. De receptie is open tot vijf uur.','Welke deur moet u vandaag gebruiken?',['De deur aan de voorkant.','De deur aan de zijkant.','De deur achter de receptie.'],1,'voorkant 是前面，zijkant 是侧面。今天要走侧门。','正门关闭，今天请走侧门，接待处开放到五点。'),
    output('speak','Je bent bij een receptie en kunt de juiste kamer niet vinden. Vertel voor wie je komt en vraag waar je moet zijn.',['说明来找谁','说明找不到房间','询问应该去哪里'],'Goedemorgen, ik heb een afspraak met mevrouw Jansen. Ik kan de kamer niet vinden. Waar moet ik zijn?','先说明来意，再提出具体请求。'),
    pick('knm','','Er is brand in een woning en mensen zijn in gevaar. Welk nummer belt u voor directe hulp?',['Het nummer van de bibliotheek.','Het nummer van de winkel.','112.'],2,'遇到需要立即救援的危险，例如本题中人员受威胁的火灾，拨打 112。','住宅发生火灾，人员处于危险中，要立即求助应该拨打什么号码？','emergency')
  ])
];

// Separate self-test set: answers are shown only after submission, not while testing.
export const QUIZ = [
  pick('read','De bibliotheek is maandag gesloten. Dinsdag zijn we open van 10.00 tot 18.00 uur.','Wanneer kunt u dinsdag naar de bibliotheek?',['Om 9.00 uur.','Om 15.00 uur.','Om 19.00 uur.'],1,'周二开放时间为 10:00–18:00，15:00 在此范围内。'),
  pick('read','Uw pakket ligt bij de buren op nummer 24. Neem uw identiteitsbewijs mee.','Waar kunt u uw pakket ophalen?',['Bij de buren op nummer 24.','Bij het station.','In de bibliotheek.'],0,'包裹在 24 号邻居处。'),
  pick('read','De training begint om 18.30 uur. We verzamelen een kwartier eerder bij de ingang.','Hoe laat verzamelt de groep?',['Om 18.45 uur.','Om 18.30 uur.','Om 18.15 uur.'],2,'een kwartier 是十五分钟，18:30 提前十五分钟为 18:15。'),
  pick('read','U kunt uw bestelling tot vrijdag 12.00 uur ophalen. Daarna gaat deze terug naar de winkel.','Wat moet u doen als u de bestelling wilt houden?',['Na vrijdag langskomen.','Vóór vrijdag 12.00 uur ophalen.','Wachten tot volgende week.'],1,'要在截止时间周五中午十二点前取件。'),
  pick('knm','','U verhuist naar een andere gemeente in Nederland. Waar geeft u het nieuwe adres door?',['Bij de nieuwe gemeente.','Bij uw supermarkt.','Alleen bij de vorige verhuurder.'],0,'应向新住所所在市政府报告新地址。',undefined,'move'),
  pick('knm','','Er is een ernstig ongeluk. Iemand is in levensgevaar en er is direct hulp nodig. Welk nummer belt u?',['Het nummer van de school.','Het nummer van het café.','112.'],2,'危及生命、需要立即救援时拨打 112。',undefined,'emergency')
].map((task,index)=>({...task,id:`quiz-${index+1}`}));

export const TASKS = LESSONS.flatMap(lesson=>lesson.tasks);
export const EXAMS = [
  {id:'read',name:'阅读 · Lezen',duration:'65 分钟',format:'电脑作答，阅读文本并回答问题。'},
  {id:'listen',name:'听力 · Luisteren',duration:'45 分钟',format:'电脑作答，听取文本或观看短片后回答问题。'},
  {id:'speak',name:'口语 · Spreken',duration:'35 分钟',format:'电脑录音作答，练习听懂问题并独立回答。'},
  {id:'write',name:'写作 · Schrijven',duration:'40 分钟',format:'纸笔作答，四项任务；也要安排手写练习。'},
  {id:'knm',name:'社会知识 · KNM',duration:'45 分钟',format:'电脑作答，理解荷兰社会与生活相关的问题。'},
  {id:'ona',name:'就业导向 · ONA',duration:'先核对是否需要',format:'部分申请人可申请工作豁免，结果由 DUO 确认。'}
];
