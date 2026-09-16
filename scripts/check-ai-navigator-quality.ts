export {};

type NavigatorResponse = {
  primaryAction: { label: string; href: string } | null;
  sections: {
    situations: Array<{ href: string }>;
    instructions: Array<{ href: string }>;
    documents: Array<{ href: string }>;
  };
};

const baseUrl = process.env.AI_NAVIGATOR_CHECK_URL || "http://localhost:3000";
const allowedProblem = "/problems/semya-i-deti/brak-zags-i-smena-familii/";
const allowedDocument = "/documents/zayavlenie-v-zags/";
const divorceProblem = "/problems/semya-i-deti/razvod-i-razdel-imushchestva/";
const divorceDocuments = [
  "/documents/zayavlenie-o-rastorzhenii-braka-v-zags/",
  "/documents/isk-o-rastorzhenii-braka/",
  "/documents/soglashenie-o-razdele-imushchestva/",
  "/documents/isk-o-razdele-imushchestva-suprugov/"
];
const guardianshipProblem = "/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/";
const guardianshipDocuments = [
  "/documents/zayavlenie-o-naznachenii-opekuna-rebenku/",
  "/documents/zayavlenie-roditelya-o-naznachenii-opekuna/",
  "/documents/dokumenty-po-imushchestvu-podopechnogo/",
  "/documents/zhaloba-na-organ-opeki/"
];
const guardianshipContent = [guardianshipProblem, ...guardianshipDocuments];
const parentsChildProblem = "/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/";
const parentsChildDocuments = [
  "/documents/mesto-zhitelstva-rebenka-posle-razvoda/",
  "/documents/poryadok-obshcheniya-s-rebenkom/",
  "/documents/izmenenie-poryadka-po-rebenku/",
  "/documents/ispolnenie-resheniya-o-rebenke/"
];
const parentsChildContent = [parentsChildProblem, ...parentsChildDocuments];
const childSupportProblem = "/problems/semya-i-deti/alimenty-na-rebenka/";
const childSupportDocuments = [
  "/documents/soglashenie-ob-uplate-alimentov-na-rebenka/",
  "/documents/vzyskanie-alimentov-na-rebenka/",
  "/documents/izmenenie-razmera-alimentov-na-rebenka/",
  "/documents/raschet-zadolzhennosti-po-alimentam/",
  "/documents/ispolnenie-alimentov-na-rebenka/"
];
const childSupportContent = [childSupportProblem, ...childSupportDocuments];
const deprivationProblem = "/problems/semya-i-deti/lishenie-roditelskih-prav/";
const deprivationDocuments = [
  "/documents/proverka-osnovaniy-lisheniya-roditelskih-prav/",
  "/documents/isk-o-lishenii-roditelskih-prav/",
  "/documents/uchet-resheniy-pri-lishenii-roditelskih-prav/",
  "/documents/lishenie-roditelskih-prav-i-alimenty/"
];
const deprivationContent = [deprivationProblem, ...deprivationDocuments];
const restrictionProblem = "/problems/semya-i-deti/ogranichenie-roditelskih-prav/";
const restrictionDocuments = [
  "/documents/ogranichenie-prav-po-nezavisyashchim-obstoyatelstvam/",
  "/documents/proverka-opasnogo-povedeniya-roditelya/",
  "/documents/isk-ob-ogranichenii-roditelskih-prav/"
];
const restrictionContent = [restrictionProblem, ...restrictionDocuments];
const paternityProblem = "/problems/semya-i-deti/ustanovlenie-otcovstva/";
const paternityDocuments = [
  "/documents/zayavlenie-ob-ustanovlenii-otcovstva/",
  "/documents/isk-ob-ustanovlenii-otcovstva/",
  "/documents/ustanovlenie-otcovstva-umershego/",
  "/documents/zapis-ob-otce-uzhe-sushchestvuet/",
  "/documents/ustanovlenie-otcovstva-i-drugoe-trebovanie/"
];
const paternityContent = [paternityProblem, ...paternityDocuments];
const paternityContestProblem = "/problems/semya-i-deti/osparivanie-otcovstva/";
const paternityContestDocuments = [
  "/documents/isk-ob-osparivanii-otcovstva-zapisannym-roditelem/",
  "/documents/isk-ob-osparivanii-zapisi-biologicheskim-roditelem/",
  "/documents/isk-ob-osparivanii-otcovstva-rebenkom-ili-opekunom/",
  "/documents/osparivanie-otcovstva-posle-smerti/"
];
const paternityContestContent = [paternityContestProblem, ...paternityContestDocuments];
const adoptionProblem = "/problems/semya-i-deti/usynovlenie-rebenka/";
const adoptionDocuments = [
  "/documents/usynovlenie-rebenka-suprugom-roditelya/",
  "/documents/chek-list-vnutrirossiyskogo-usynovleniya/",
  "/documents/soglasiya-pri-usynovlenii-rebenka/",
  "/documents/mezhdunarodnoe-usynovlenie-proverka/"
];
const adoptionContent = [adoptionProblem, ...adoptionDocuments];
const childTravelProblem = "/problems/semya-i-deti/vyezd-rebenka-za-granitsu/";
const childTravelDocuments = [
  "/documents/vyezd-rebenka-s-odnim-roditelem/",
  "/documents/soglasie-na-vyezd-rebenka-bez-roditeley/",
  "/documents/spor-o-vyezde-rebenka-za-granitsu/",
  "/documents/dokumenty-dlya-vyezda-rebenka-v-inostrannoe-gosudarstvo/"
];
const childTravelContent = [childTravelProblem, ...childTravelDocuments];
const childNameProblem = "/problems/semya-i-deti/imya-familiya-otchestvo-rebenka/";
const childNameDocuments = [
  "/documents/izmenenie-imeni-ili-familii-rebenka-do-14-let/",
  "/documents/izmenenie-familii-rebenka-pri-razdelnom-prozhivanii/",
  "/documents/peremena-imeni-rebenkom-ot-14-do-18-let/",
  "/documents/izmenenie-otchestva-rebenka-do-14-let/"
];
const childNameContent = [childNameProblem, ...childNameDocuments];
const restorationProblem = "/problems/semya-i-deti/vosstanovlenie-v-roditelskih-pravah/";
const restorationDocuments = [
  "/documents/isk-o-vosstanovlenii-v-roditelskih-pravah/",
  "/documents/vosstanovlenie-roditelskih-prav-i-vozvrat-rebenka/",
  "/documents/proverka-prepyatstviy-k-vosstanovleniyu-roditelskih-prav/"
];
const restorationContent = [restorationProblem, ...restorationDocuments];
const restrictionCancellationProblem = "/problems/semya-i-deti/otmena-ogranicheniya-roditelskih-prav/";
const restrictionCancellationDocuments = [
  "/documents/isk-ob-otmene-ogranicheniya-roditelskih-prav/",
  "/documents/otmena-ogranicheniya-roditelskih-prav-i-vozvrat-rebenka/",
  "/documents/proverka-usloviy-otmeny-ogranicheniya-roditelskih-prav/"
];
const restrictionCancellationContent = [restrictionCancellationProblem, ...restrictionCancellationDocuments];
const parentalDisagreementsProblem = "/problems/semya-i-deti/raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu/";
const parentalDisagreementsDocuments = [
  "/documents/sovmestnoe-reshenie-roditeley-po-vospitaniyu-i-obrazovaniyu/",
  "/documents/obrashchenie-v-organ-opeki-po-raznoglasiyu-roditeley/",
  "/documents/sudebnyy-spor-po-vospitaniyu-i-obrazovaniyu-rebenka/"
];
const parentalDisagreementsContent = [parentalDisagreementsProblem, ...parentalDisagreementsDocuments];
const additionalChildExpensesProblem = "/problems/semya-i-deti/dopolnitelnye-rashody-na-rebenka/";
const additionalChildExpensesDocuments = [
  "/documents/proverka-dopolnitelnyh-rashodov-na-rebenka/",
  "/documents/soglashenie-o-dopolnitelnyh-rashodah-na-rebenka/",
  "/documents/vzyskanie-ponesennyh-dopolnitelnyh-rashodov-na-rebenka/",
  "/documents/vzyskanie-budushchih-dopolnitelnyh-rashodov-na-rebenka/"
];
const additionalChildExpensesContent = [additionalChildExpensesProblem, ...additionalChildExpensesDocuments];
const spousalSupportProblem = "/problems/semya-i-deti/soderzhanie-supruga-i-byvshego-supruga/";
const spousalSupportDocuments = ["/documents/proverka-prava-na-soderzhanie-supruga/", "/documents/soglashenie-o-soderzhanii-supruga/", "/documents/isk-o-soderzhanii-supruga-v-brake/", "/documents/isk-o-soderzhanii-byvshego-supruga/"];
const spousalSupportContent = [spousalSupportProblem, ...spousalSupportDocuments];
const prenuptialAgreementProblem = "/problems/semya-i-deti/brachnyy-dogovor/";
const prenuptialAgreementDocuments = ["/documents/brachnyy-dogovor-do-braka/", "/documents/brachnyy-dogovor-v-brake/", "/documents/izmenenie-brachnogo-dogovora/", "/documents/rastorzhenie-brachnogo-dogovora/", "/documents/spor-o-brachnom-dogovore/"];
const prenuptialAgreementContent = [prenuptialAgreementProblem, ...prenuptialAgreementDocuments];
const invalidMarriageProblem = "/problems/semya-i-deti/priznanie-braka-nedeystvitelnym/";
const invalidMarriageDocuments = ["/documents/isk-o-nedeystvitelnosti-braka-bez-soglasiya/", "/documents/isk-o-nedeystvitelnosti-braka-s-nesovershennoletnim/", "/documents/isk-o-nedeystvitelnosti-braka-pri-prepyatstvii/", "/documents/isk-o-fiktivnom-brake/", "/documents/isk-o-nedeystvitelnosti-braka-pri-sokrytii-zabolevaniya/"];
const invalidMarriageContent = [invalidMarriageProblem, ...invalidMarriageDocuments];
const complexMaritalPropertyProblem = "/problems/semya-i-deti/slozhnye-imushchestvennye-spory-suprugov/";
const complexMaritalPropertyDocuments = ["/documents/slozhnyy-spor-ob-obshchih-dolgah-suprugov/", "/documents/slozhnyy-spor-ob-ipotechnom-imushchestve-suprugov/", "/documents/slozhnyy-spor-o-biznes-aktivah-suprugov/", "/documents/slozhnyy-spor-s-pravami-tretih-lits-i-kompensatsiey/", "/documents/slozhnyy-spor-pri-bankrotstve-i-obespechitelnye-mery/"];
const complexMaritalPropertyContent = [complexMaritalPropertyProblem, ...complexMaritalPropertyDocuments];
const allowedContentPrefixes = [allowedProblem, allowedDocument, divorceProblem, ...divorceDocuments, ...guardianshipContent, ...parentsChildContent, ...childSupportContent, ...deprivationContent, ...restrictionContent, ...paternityContent, ...paternityContestContent, ...adoptionContent, ...childTravelContent, ...childNameContent, ...restorationContent, ...restrictionCancellationContent, ...parentalDisagreementsContent, ...additionalChildExpensesContent, ...spousalSupportContent, ...prenuptialAgreementContent, ...invalidMarriageContent, ...complexMaritalPropertyContent];

const queries = [
  { query: "хочу зарегистрировать брак", expected: [allowedProblem, allowedDocument] },
  { query: "сменить фамилию после свадьбы", expected: [allowedProblem, allowedDocument] },
  { query: "получить повторное свидетельство", expected: [allowedProblem, allowedDocument] },
  { query: "исправить ошибку в записи загс", expected: [allowedProblem, allowedDocument] },
  { query: "как развестись", expected: [divorceProblem, ...divorceDocuments.slice(0, 2)] },
  { query: "развод через загс", expected: [divorceProblem, divorceDocuments[0]] },
  { query: "супруг не согласен на развод", expected: [divorceProblem, divorceDocuments[1]] },
  { query: "раздел имущества после развода", expected: [divorceProblem, divorceDocuments[2], divorceDocuments[3]], forbidden: complexMaritalPropertyContent },
  { query: "соглашение о разделе имущества", expected: [divorceProblem, divorceDocuments[2]], forbidden: complexMaritalPropertyContent },
  { query: "ипотека при разводе", expected: [divorceProblem, divorceDocuments[2], divorceDocuments[3]] },
  { query: "супруг продал имущество перед разводом", expected: [divorceProblem, divorceDocuments[3]] },
  { query: "срок раздела имущества", expected: [divorceProblem, divorceDocuments[3]] },
  { query: "оформить опеку над ребёнком", expected: guardianshipContent },
  { query: "стать опекуном ребёнка", expected: guardianshipContent },
  { query: "опека над ребёнком до 14 лет", expected: guardianshipContent },
  { query: "попечительство над ребёнком 15 лет", expected: guardianshipContent },
  { query: "предварительная опека", expected: guardianshipContent },
  { query: "срочно назначить опекуна ребёнку", expected: guardianshipContent },
  { query: "опека бабушкой по заявлению родителей на определённый период", expected: guardianshipContent },
  { query: "родители уезжают ребёнок остаётся с родственником", expected: guardianshipContent },
  { query: "заявление родителей о назначении опекуна", expected: guardianshipContent },
  { query: "отчёт опекуна", expected: guardianshipContent },
  { query: "номинальный счёт опекуна", expected: guardianshipContent },
  { query: "разрешение опеки на имущество ребёнка", expected: guardianshipContent },
  { query: "продажа квартиры ребёнка разрешение опеки", expected: guardianshipContent },
  { query: "орган опеки отказал", expected: guardianshipContent },
  { query: "орган опеки не отвечает", expected: guardianshipContent },
  { query: "усыновить ребёнка", expected: adoptionContent, forbidden: [...guardianshipContent, ...childSupportContent, ...deprivationContent] },
  { query: "опека над недееспособным взрослым", expected: [], forbidden: [...guardianshipContent, ...parentsChildContent, ...deprivationContent] },
  { query: "После развода ребёнок должен жить со мной", expected: [parentsChildProblem, parentsChildDocuments[0]] },
  { query: "С кем останется ребёнок после развода", expected: [parentsChildProblem, parentsChildDocuments[0]] },
  { query: "Бывшая жена не даёт видеть сына", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "Бывший муж хочет видеть ребёнка", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "Хотим договориться о порядке общения", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "изменить график общения с ребёнком", expected: [parentsChildProblem, parentsChildDocuments[2]] },
  { query: "Есть решение суда, но ребёнка всё равно не дают видеть", expected: [parentsChildProblem, parentsChildDocuments[3]] },
  { query: "Как определить место жительства ребёнка", expected: [parentsChildProblem, parentsChildDocuments[0]], forbidden: parentalDisagreementsContent },
  { query: "взыскать алименты на ребёнка", expected: [childSupportProblem, childSupportDocuments[1]], forbidden: parentsChildContent },
  { query: "соглашение об алиментах на ребёнка", expected: [childSupportProblem, childSupportDocuments[0]] },
  { query: "алименты в твёрдой сумме на ребёнка", expected: [childSupportProblem, childSupportDocuments[1]] },
  { query: "изменить размер алиментов на ребёнка", expected: [childSupportProblem, childSupportDocuments[2]] },
  { query: "задолженность по алиментам на ребёнка", expected: [childSupportProblem, childSupportDocuments[3], childSupportDocuments[4]] },
  { query: "бывший муж не платит алименты на сына", expected: [childSupportProblem, childSupportDocuments[3], childSupportDocuments[4]] },
  { query: "алименты жене", expected: [spousalSupportProblem, spousalSupportDocuments[0]], forbidden: [...childSupportContent, ...deprivationContent] },
  { query: "соглашение о содержании супруга", expected: [spousalSupportProblem, spousalSupportDocuments[1]], forbidden: childSupportContent },
  { query: "алименты супруге в браке", expected: [spousalSupportProblem, spousalSupportDocuments[2]], forbidden: childSupportContent },
  { query: "алименты бывшей жене", expected: [spousalSupportProblem, spousalSupportDocuments[3]], forbidden: childSupportContent },
  { query: "брачный договор до свадьбы", expected: [prenuptialAgreementProblem, prenuptialAgreementDocuments[0]], forbidden: spousalSupportContent },
  { query: "заключить брачный договор в браке", expected: [prenuptialAgreementProblem, prenuptialAgreementDocuments[1]], forbidden: spousalSupportContent },
  { query: "изменить брачный договор", expected: [prenuptialAgreementProblem, prenuptialAgreementDocuments[2]], forbidden: divorceDocuments },
  { query: "расторгнуть брачный договор", expected: [prenuptialAgreementProblem, prenuptialAgreementDocuments[3]], forbidden: divorceDocuments },
  { query: "оспорить брачный договор", expected: [prenuptialAgreementProblem, prenuptialAgreementDocuments[4]], forbidden: [divorceProblem] },
  { query: "признать брак недействительным", expected: [invalidMarriageProblem], forbidden: [divorceProblem, prenuptialAgreementProblem] },
  { query: "брак заключен под принуждением", expected: [invalidMarriageProblem, invalidMarriageDocuments[0]], forbidden: divorceDocuments },
  { query: "брак с несовершеннолетним без разрешения", expected: [invalidMarriageProblem, invalidMarriageDocuments[1]], forbidden: divorceDocuments },
  { query: "второй брак не расторгнув первый", expected: [invalidMarriageProblem, invalidMarriageDocuments[2]], forbidden: divorceDocuments },
  { query: "фиктивный брак без намерения создать семью", expected: [invalidMarriageProblem, invalidMarriageDocuments[3]], forbidden: divorceDocuments },
  { query: "скрыл ВИЧ при заключении брака", expected: [invalidMarriageProblem, invalidMarriageDocuments[4]], forbidden: divorceDocuments },
  { query: "разделить общие долги супругов", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[0]], forbidden: divorceDocuments },
  { query: "ипотека при разделе имущества", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[1]], forbidden: divorceDocuments },
  { query: "раздел доли в ооо", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[2]], forbidden: divorceDocuments },
  { query: "раздел бизнеса супругов", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[2]], forbidden: divorceDocuments },
  { query: "имущество оформлено на третье лицо", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[3]], forbidden: divorceDocuments },
  { query: "компенсация за проданное имущество супругов", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[3]], forbidden: divorceDocuments },
  { query: "имущество супругов при банкротстве", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[4]], forbidden: divorceDocuments },
  { query: "арест имущества при разделе супругов", expected: [complexMaritalPropertyProblem, complexMaritalPropertyDocuments[4]], forbidden: divorceDocuments },
  { query: "дополнительные расходы на ребёнка", expected: [additionalChildExpensesProblem, additionalChildExpensesDocuments[0]], forbidden: childSupportContent },
  { query: "соглашение о дополнительных расходах на ребёнка", expected: [additionalChildExpensesProblem, additionalChildExpensesDocuments[1]], forbidden: childSupportContent },
  { query: "взыскать расходы на лечение ребёнка", expected: [additionalChildExpensesProblem, additionalChildExpensesDocuments[2]], forbidden: childSupportContent },
  { query: "будущие расходы на лечение ребёнка", expected: [additionalChildExpensesProblem, additionalChildExpensesDocuments[3]], forbidden: childSupportContent },
  { query: "лишить отца родительских прав", expected: [deprivationProblem, deprivationDocuments[1]], forbidden: [...guardianshipContent, ...parentsChildContent] },
  { query: "есть ли основания лишить родительских прав", expected: [deprivationProblem, deprivationDocuments[0]] },
  { query: "лишение родительских прав после решения об ограничении", expected: [deprivationProblem, deprivationDocuments[2]] },
  { query: "лишить родительских прав и взыскать алименты", expected: [deprivationProblem, deprivationDocuments[3]], forbidden: childSupportContent },
  { query: "ограничить родительские права", expected: [restrictionProblem, restrictionDocuments[2]], forbidden: deprivationContent },
  { query: "ограничение родительских прав из-за болезни", expected: [restrictionProblem, restrictionDocuments[0]], forbidden: deprivationContent },
  { query: "ограничить родительские права из-за опасного поведения", expected: [restrictionProblem, restrictionDocuments[1], restrictionDocuments[2]], forbidden: deprivationContent },
  { query: "иск об ограничении родительских прав", expected: [restrictionProblem, restrictionDocuments[2]], forbidden: deprivationContent },
  { query: "лишить мать родительских прав", expected: [deprivationProblem, deprivationDocuments[1]], forbidden: restrictionContent },
  { query: "восстановить родительские права после лишения", expected: [restorationProblem, restorationDocuments[0]], forbidden: [...deprivationContent, ...restrictionContent] },
  { query: "восстановить права и вернуть ребёнка", expected: [restorationProblem, restorationDocuments[1]], forbidden: deprivationContent },
  { query: "ребёнок против восстановления родительских прав", expected: [restorationProblem, restorationDocuments[2]], forbidden: restrictionContent },
  { query: "ребёнок усыновлён можно восстановить родительские права", expected: [restorationProblem, restorationDocuments[2]], forbidden: adoptionContent },
  { query: "отменить ограничение родительских прав", expected: [restrictionCancellationProblem, restrictionCancellationDocuments[0]], forbidden: [...restrictionContent, ...restorationContent] },
  { query: "отменить ограничение и вернуть ребёнка", expected: [restrictionCancellationProblem, restrictionCancellationDocuments[1]], forbidden: restorationContent },
  { query: "основания ограничения отпали", expected: [restrictionCancellationProblem, restrictionCancellationDocuments[2]], forbidden: restrictionContent },
  { query: "ребёнок против отмены ограничения", expected: [restrictionCancellationProblem, restrictionCancellationDocuments[2]], forbidden: restorationContent },
  { query: "соглашение родителей о выборе школы", expected: [parentalDisagreementsProblem, parentalDisagreementsDocuments[0]], forbidden: parentsChildContent },
  { query: "родители не согласны по школе орган опеки", expected: [parentalDisagreementsProblem, parentalDisagreementsDocuments[1]], forbidden: parentsChildContent },
  { query: "обратиться в опеку из-за разногласия родителей", expected: [parentalDisagreementsProblem, parentalDisagreementsDocuments[1]], forbidden: guardianshipContent },
  { query: "суд разрешить вопрос воспитания ребёнка", expected: [parentalDisagreementsProblem, parentalDisagreementsDocuments[2]], forbidden: parentsChildContent },
  { query: "установить отцовство через загс", expected: [paternityProblem, paternityDocuments[0]] },
  { query: "иск об установлении отцовства", expected: [paternityProblem, paternityDocuments[1]] },
  { query: "установить отцовство после смерти отца", expected: [paternityProblem, paternityDocuments[2]] },
  { query: "в свидетельстве записан другой отец", expected: [paternityProblem, paternityDocuments[3]] },
  { query: "установление отцовства и алименты", expected: [paternityProblem, paternityDocuments[4]], forbidden: deprivationContent },
  { query: "оспорить отцовство", expected: [paternityContestProblem, paternityContestDocuments[0]], forbidden: paternityContent },
  { query: "биологический отец хочет оспорить запись", expected: [paternityContestProblem, paternityContestDocuments[1]], forbidden: paternityContent },
  { query: "совершеннолетний ребенок хочет оспорить отцовство", expected: [paternityContestProblem, paternityContestDocuments[2]], forbidden: paternityContent },
  { query: "оспорить отцовство после смерти", expected: [paternityContestProblem, paternityContestDocuments[3]], forbidden: paternityContent },
  { query: "днк экспертиза при оспаривании отцовства", expected: paternityContestContent, forbidden: paternityContent },
  { query: "усыновить ребёнка жены", expected: [adoptionProblem, adoptionDocuments[0]], forbidden: guardianshipContent },
  { query: "как усыновить ребёнка в россии", expected: [adoptionProblem, adoptionDocuments[1]], forbidden: guardianshipContent },
  { query: "усыновление без согласия отца", expected: [adoptionProblem, adoptionDocuments[2]], forbidden: guardianshipContent },
  { query: "международное усыновление", expected: [adoptionProblem, adoptionDocuments[3]], forbidden: guardianshipContent },
  { query: "ребёнок едет за границу с одним родителем", expected: [childTravelProblem, childTravelDocuments[0]], forbidden: parentsChildContent },
  { query: "согласие на выезд ребёнка с бабушкой", expected: [childTravelProblem, childTravelDocuments[1]], forbidden: guardianshipContent },
  { query: "несогласие на выезд ребёнка", expected: [childTravelProblem, childTravelDocuments[2]], forbidden: parentsChildContent },
  { query: "документы ребёнку для въезда в иностранное государство", expected: [childTravelProblem, childTravelDocuments[3]], forbidden: adoptionContent },
  { query: "сменить имя ребёнку до 14 лет", expected: [childNameProblem, childNameDocuments[0]], forbidden: [...guardianshipContent, allowedProblem, allowedDocument] },
  { query: "сменить фамилию ребёнку без согласия отца", expected: [childNameProblem, childNameDocuments[1]], forbidden: [...guardianshipContent, ...parentsChildContent] },
  { query: "сменить имя подростку в 15 лет", expected: [childNameProblem, childNameDocuments[2]], forbidden: [allowedProblem, allowedDocument] },
  { query: "изменить отчество ребёнку", expected: [childNameProblem, childNameDocuments[3]], forbidden: [...guardianshipContent, allowedProblem, allowedDocument] },
  { query: "как развестись без спора о детях", expected: [divorceProblem], forbidden: [...parentsChildContent, ...invalidMarriageContent] }
];

async function main() {
  let failed = 0;

  for (const testCase of queries) {
    const { query, expected } = testCase;
    const forbidden: string[] = "forbidden" in testCase ? testCase.forbidden ?? [] : [];
    const url = new URL("/api/ai-navigator?fast=1", baseUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      failed += 1;
      console.error("FAIL " + query + ": HTTP " + response.status);
      continue;
    }

    const data = (await response.json()) as NavigatorResponse;
    const contentLinks = [
      ...data.sections.situations,
      ...data.sections.instructions,
      ...data.sections.documents
    ].map((item) => item.href);
    const invalidLinks = contentLinks.filter(
      (href) => !allowedContentPrefixes.some((allowed) => href.startsWith(allowed))
    );
    const primaryHref = data.primaryAction?.href ?? "";
    const primaryIsAllowed = expected.length === 0 || expected.some((allowed) => primaryHref.startsWith(allowed));
    const forbiddenLinks = [primaryHref, ...contentLinks].filter(
      (href) => href && forbidden.some((blocked) => href.startsWith(blocked))
    );

    if (!primaryIsAllowed || invalidLinks.length || forbiddenLinks.length) {
      failed += 1;
      console.error(
        "FAIL " + query + ": primary=" + (primaryHref || "none") + " invalid=" + (invalidLinks.join(",") || "none") + " forbidden=" + (forbiddenLinks.join(",") || "none")
      );
    } else {
      console.log("PASS " + query + ": " + primaryHref);
    }
  }

  if (failed) {
    throw new Error("AI navigator quality failed: " + failed + "/" + queries.length);
  }

  console.log("AI navigator quality passed: " + queries.length + "/" + queries.length);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
