import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleList, Checklist, LinkGrid, QuestionList, SeoText } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { LawyerCard } from "@/components/LawyerCard";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { StickyCta } from "@/components/StickyCta";
import { breadcrumbJsonLd, faqJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import {
  buildMetadata,
  canIndexCityPage,
  canIndexSeoPage,
  canIndexServicePage,
  type SearchParams
} from "@/lib/seo";
import {
  getArticles,
  getCities,
  getCity,
  getFaqs,
  getPublicServiceLinks,
  getLawyers,
  getQuestions,
  getSeoMerge,
  getSeoPage,
  getService,
  getServices,
  getStaticPage
} from "@/lib/repositories";
import type { Lawyer, SeoPage, StaticPage } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
};

const commercialPages: Record<string, SeoPage> = {
  "yuridicheskaya-konsultaciya-online": {
    id: "seo-commercial-online-consultation",
    type: "STATIC",
    slug: "yuridicheskaya-konsultaciya-online",
    title: "Юридическая консультация онлайн — задайте вопрос юристу",
    description:
      "Задайте юридический вопрос онлайн и получите ответы юристов после модерации. Сравните ответы, откройте профиль специалиста и обратитесь через платформу без публичной передачи контактов.",
    h1: "Юридическая консультация онлайн",
    seoText:
      "Юридическая консультация онлайн начинается с вопроса пользователя без раннего сбора контактов. Опишите ситуацию, выберите город и тему. После модерации вопрос может появиться в публичном разделе, а юристы смогут дать полезные ответы. Сравните ответы и профили специалистов. Приватное обращение к выбранному юристу доступно через платформу.",
    canonical: "/yuridicheskaya-konsultaciya-online/",
    isIndexable: true
  },
  "besplatnaya-yuridicheskaya-konsultaciya": {
    id: "seo-commercial-free-consultation",
    type: "STATIC",
    slug: "besplatnaya-yuridicheskaya-konsultaciya",
    title: "Бесплатная юридическая консультация — задать вопрос юристу",
    description:
      "Задайте юридический вопрос без передачи телефона на первом шаге. Вопрос проходит модерацию, после чего юристы могут дать публичные ответы, а вы сможете сравнить специалистов.",
    h1: "Бесплатная юридическая консультация",
    seoText:
      "Бесплатная юридическая консультация на платформе начинается с публичного вопроса, а не с передачи телефона или мессенджера. Опишите ситуацию, выберите город и тему, укажите email только для уведомлений о ходе вопроса и ответах. После модерации вопрос может быть опубликован в разделе Q&A, где проверенные юристы смогут дать полезные ответы без прямых контактов и рекламных призывов. Такой формат помогает получить первичную оценку ситуации, сравнить подходы специалистов и осознанно перейти в профиль юриста. Приватное обращение к выбранному специалисту происходит через платформу и остается модерируемым.",
    canonical: "/besplatnaya-yuridicheskaya-konsultaciya/",
    isIndexable: true
  },
  "konsultaciya-yurista": {
    id: "seo-commercial-lawyer-consultation",
    type: "STATIC",
    slug: "konsultaciya-yurista",
    title: "Консультация юриста — задать вопрос и получить первичную оценку",
    description:
      "Консультация юриста через Q&A: задайте вопрос, дождитесь модерации, сравните ответы и профили специалистов, затем обратитесь через платформу.",
    h1: "Консультация юриста",
    seoText:
      "Консультация юриста помогает понять правовую позицию, сроки, документы, риски и следующий шаг. На платформе первый шаг остается безопасным: пользователь задает вопрос без телефона, мессенджеров, документов и лишних персональных данных. После модерации вопрос может стать публичным, а юристы с подтвержденным статусом смогут дать ответы. Пользователь сравнивает качество ответов, опыт, специализацию и профиль, а затем при необходимости отправляет приватное модерируемое обращение выбранному юристу через платформу. Такой маршрут сохраняет контроль над контактами и не превращает страницу в прямую лид-форму.",
    canonical: "/konsultaciya-yurista/",
    isIndexable: true
  },
  documenty: {
    id: "seo-commercial-docs",
    type: "STATIC",
    slug: "documenty",
    title: "Юридические документы — иски, претензии, договоры",
    description: "Подберите юриста для подготовки юридических документов: исков, претензий, договоров, жалоб и правовых заключений.",
    h1: "Юридические документы",
    seoText:
      "Подготовка документов требует учета фактов, доказательств, сроков и адресата. Шаблон помогает начать, но итоговый документ должен соответствовать конкретной ситуации и судебной практике.",
    canonical: "/documenty/",
    isIndexable: true
  },
};

const infoSectionPagesContent: Array<{ slug: string; h1: string; description: string; seoText: string }> = [
  {
    slug: "chto-delat-esli",
    h1: "Что делать, если",
    description:
      "Что делать, если пришёл иск, не платят зарплату, отказали в возврате или списали деньги: первый шаг, сроки, документы и когда нужен юрист.",
    seoText:
      "Раздел «Что делать, если» помогает не растеряться в первый момент, когда возникла правовая проблема: пришёл иск или судебный приказ, работодатель не платит, продавец отказывает в возврате, списали деньги или поступили угрозы взыскания. Главное правило — сначала зафиксировать факты и проверить сроки, а уже потом действовать.\nНачните с короткого описания ситуации: что произошло, когда, какие документы и переписка есть на руках, какие суммы и стороны участвуют. Это помогает понять, какой документ нужен и куда обращаться — в суд, к продавцу, в инспекцию или к приставам.\nДля большинства ситуаций есть пошаговый маршрут: какие бумаги собрать, в какой срок подать обращение и когда без юриста уже не обойтись. Если ситуация срочная или цена ошибки высока, опишите её и задайте вопрос — после модерации специалисты подскажут безопасный первый шаг."
  },
  {
    slug: "instrukcii",
    h1: "Инструкции",
    description:
      "Пошаговые юридические инструкции: какие документы собрать, куда подать обращение, как не пропустить срок и избежать типичных ошибок.",
    seoText:
      "Пошаговые инструкции показывают, как решать типовые юридические задачи последовательно: от сбора документов до подачи обращения и контроля результата. Они не заменяют консультацию, но помогают не пропустить важный этап и не потерять срок.\nКаждая инструкция строится по понятной логике: с чего начать, какие документы подготовить, куда и в какой форме подать обращение, что делать после ответа и какие ошибки чаще всего приводят к отказу. Такой формат экономит время и снижает риск формальных нарушений.\nИнструкции полезны и тогда, когда вы планируете действовать самостоятельно, и тогда, когда хотите проконтролировать работу специалиста. Если на каком-то шаге появляются сомнения — по срокам, формулировкам или доказательствам, — задайте вопрос юристу, чтобы уточнить детали под свою ситуацию."
  },
  {
    slug: "oshibki",
    h1: "Частые ошибки",
    description:
      "Частые юридические ошибки, из-за которых теряют деньги и сроки: неверный адресат, пропуск срока, отсутствие доказательств — и как их избежать.",
    seoText:
      "Многие юридические проблемы возникают не из-за сложности закона, а из-за типичных ошибок: пропущенный срок, неверный адресат претензии, отсутствие подтверждения отправки, эмоциональные формулировки вместо фактов. Этот раздел собирает такие ошибки, чтобы их можно было заранее избежать.\nЧастые ошибки касаются и формы документа, и порядка действий: люди подписывают бумаги не глядя, не сохраняют доказательства, пропускают досудебный порядок или подают обращение не в тот орган. Любая из этих мелочей может стоить времени, денег и самого права на защиту.\nЗнание распространённых ошибок помогает действовать аккуратнее и увереннее. Если вы не уверены, что выбрали правильный путь или верно составили документ, опишите ситуацию и задайте вопрос — специалист подскажет, что стоит проверить до подачи."
  },
  {
    slug: "sroki",
    h1: "Юридические сроки",
    description:
      "Юридические сроки: исковая давность, сроки обжалования, ответа на претензию. Как их считать и что делать, если срок пропущен.",
    seoText:
      "Сроки — один из самых критичных элементов в праве. Пропуск срока на обжалование, подачу возражений, претензию или обращение в суд может лишить возможности защитить свои права, даже если по существу вы правы. Поэтому проверка сроков — почти всегда первый шаг.\nСроки бывают разными: срок исковой давности (по общему правилу — три года, но для отдельных требований он иной), процессуальные сроки на обжалование решений и приказов, сроки ответа на претензию, гарантийные сроки. Их считают по-разному: с момента, когда вы узнали о нарушении, со дня получения документа или со дня события.\nЕсли срок уже пропущен, не всегда всё потеряно: иногда его можно восстановить при наличии уважительных причин и подтверждающих документов. Чтобы не ошибиться с расчётом именно в вашей ситуации, проверьте ключевые даты и задайте вопрос юристу."
  },
  {
    slug: "riski",
    h1: "Юридические риски",
    description:
      "Юридические риски сделок и споров: как оценить последствия, собрать доказательства, соблюсти сроки и снизить вероятность потерь.",
    seoText:
      "Юридические риски — это возможные неблагоприятные последствия действий или бездействия: потеря денег, имущества, времени или самого права на защиту. Оценка рисков помогает выбрать стратегию заранее, а не реагировать на проблему постфактум.\nРиски стоит оценивать перед каждым важным шагом: подписанием договора, отправкой претензии, подачей иска, признанием долга. Важно понимать не только вероятность негативного исхода, но и его цену — например, неустойку, судебные расходы, обращение взыскания на имущество.\nГрамотная работа с рисками — это сбор доказательств, соблюдение сроков и аккуратные формулировки в документах. Если ставки высоки или ситуация неоднозначна, опишите её и задайте вопрос: специалист поможет увидеть скрытые риски и подскажет, как их снизить."
  },
  {
    slug: "dokazatelstva",
    h1: "Доказательства",
    description:
      "Доказательства в споре и суде: какие документы и переписку собрать, как их зафиксировать и оформить, чтобы подтвердить свою позицию.",
    seoText:
      "Доказательства — это то, чем подтверждается ваша позиция: документы, переписка, чеки, договоры, акты, фотографии, показания свидетелей. В большинстве споров выигрывает не тот, кто прав на словах, а тот, кто может это доказать.\nВажно собирать и сохранять доказательства заранее: переписку и сообщения, подтверждения оплаты, квитанции об отправке писем, описи вложения. Часть доказательств теряет силу или становится недоступной со временем, поэтому фиксировать их лучше сразу.\nК доказательствам предъявляются требования: они должны относиться к делу, быть допустимыми и достоверными. Если вы не уверены, какие доказательства понадобятся и как их правильно оформить для претензии или суда, задайте вопрос юристу — он подскажет, что собрать в вашей ситуации."
  },
  {
    slug: "zhaloba",
    h1: "Жалобы",
    description:
      "Как и куда подать жалобу: выбор инстанции, структура обращения, сроки рассмотрения, образцы и помощь юриста.",
    seoText:
      "Жалоба — это официальное обращение, которым человек сообщает о нарушении своих прав и просит его устранить. Жалобы подают в разные инстанции: в трудовую инспекцию, прокуратуру, Роспотребнадзор, вышестоящему должностному лицу, на действия судебного пристава.\nЧтобы жалоба сработала, важно правильно выбрать адресата, чётко изложить факты, указать, какое право нарушено и чего вы требуете, и приложить подтверждающие документы. Эмоции и оценки лучше заменить конкретными датами, суммами и ссылками на обстоятельства.\nУ жалоб есть сроки рассмотрения, а у некоторых — и срок на подачу. Если вы не уверены, куда и как правильно жаловаться, воспользуйтесь готовыми образцами или задайте вопрос юристу, чтобы жалоба была составлена по существу и не осталась без ответа."
  },
  {
    slug: "pretenziya",
    h1: "Претензии",
    description:
      "Как составить претензию: обязательный досудебный порядок, требования, сроки ответа, способ вручения и образцы документов.",
    seoText:
      "Претензия — это письменное требование к другой стороне устранить нарушение: вернуть деньги, заменить товар, исполнить обязательство, возместить ущерб. Часто претензия — обязательный досудебный шаг: без неё суд может не принять иск или оставить его без рассмотрения.\nГрамотная претензия содержит данные сторон, описание ситуации, конкретное требование, срок на ответ и перечень приложений. Её важно вручить так, чтобы осталось подтверждение: заказным письмом с описью вложения или под подпись о получении.\nДаже если спор всё равно дойдёт до суда, правильно оформленная претензия усиливает позицию и иногда позволяет решить вопрос без разбирательства. Используйте образец претензии или задайте вопрос юристу, чтобы сформулировать требование точно под вашу ситуацию."
  },
  {
    slug: "otkaz",
    h1: "Отказы",
    description:
      "Что делать при отказе в возврате денег, выплате или приёме документов: как получить письменный отказ и законно его обжаловать.",
    seoText:
      "Отказ — частая, но не окончательная ситуация: отказали в возврате денег, в выплате, в приёме документов, в удовлетворении жалобы. Важно понимать, что отказ можно оспорить, а иногда он и вовсе незаконен.\nПервый шаг — получить отказ в письменном виде с указанием причины. Это фиксирует позицию другой стороны и помогает понять, как действовать дальше: устранить формальное препятствие, подать жалобу в вышестоящий орган или обратиться в суд.\nМногие отказы основаны на формальностях, которые можно исправить, или на неверном толковании закона. Если вы получили отказ и не согласны с ним, опишите ситуацию и задайте вопрос юристу — специалист подскажет, обоснован ли отказ и как его обжаловать."
  },
  {
    slug: "sudebnaya-praktika",
    h1: "Судебная практика",
    description:
      "Судебная практика по типовым спорам: как суды применяют закон, какие аргументы работают и как оценить перспективы вашего дела.",
    seoText:
      "Судебная практика показывает, как суды на самом деле применяют закон в похожих ситуациях. Она помогает оценить перспективы спора, понять типичные аргументы сторон и подобрать формулировки, которые суды воспринимают.\nОсобое значение имеют разъяснения высших судов и устойчивые позиции по конкретным категориям дел: защита прав потребителей, трудовые споры, взыскание долгов, семейные вопросы. Опираясь на практику, можно заранее увидеть слабые и сильные места своей позиции.\nПри этом каждое дело индивидуально: похожая практика не гарантирует такой же исход, потому что значение имеют детали и доказательства. Чтобы понять, как практика применима именно к вашей ситуации, опишите обстоятельства и задайте вопрос юристу."
  },
  {
    slug: "sudy",
    h1: "Суды",
    description:
      "Как защитить права в суде: подсудность, этапы процесса, сроки, госпошлина и оформление иска без формальных ошибок.",
    seoText:
      "Чтобы защитить права в суде, важно правильно определить, куда обращаться. От категории и суммы спора зависит, рассматривает дело мировой судья или районный суд, а также территориальная подсудность — как правило, по месту жительства ответчика, но из этого правила есть исключения.\nСудебный процесс состоит из этапов: подготовка иска и доказательств, подача документов, заседания, решение и при необходимости обжалование. На каждом этапе действуют свои сроки и правила, а ошибки с подсудностью или формой иска приводят к возврату документов.\nПо ряду споров — например, о защите прав потребителей — предусмотрены льготы по госпошлине и выбор суда. Если вы не уверены, в какой суд подавать и как оформить документы, задайте вопрос юристу, чтобы не потерять время на формальных отказах."
  },
  {
    slug: "slovar",
    h1: "Юридический словарь",
    description:
      "Юридический словарь простыми словами: исковая давность, подсудность, неустойка и другие термины из договоров и судебных документов.",
    seoText:
      "Юридический язык часто мешает понять суть проблемы. Этот словарь простыми словами объясняет термины, которые встречаются в документах, претензиях, исках и судебных актах: исковая давность, подсудность, неустойка, цессия, реституция, обеспечительные меры и другие.\nПонимание терминов помогает правильно прочитать договор, повестку или решение суда и не упустить важное. Когда вы понимаете, что означает формулировка, проще оценить свои права и риски и принять решение осознанно.\nСловарь — это справочная опора, а не замена консультации: одно и то же понятие может по-разному работать в конкретной ситуации. Если вам встретился непонятный термин в вашем документе, задайте вопрос юристу — специалист объяснит, что он означает именно в вашем случае."
  },
  {
    slug: "zakony",
    h1: "Законы простым языком",
    description:
      "Законы простым языком: что говорит закон, к каким ситуациям применяется и какие у вас права — без сложных формулировок.",
    seoText:
      "Раздел «Законы простым языком» переводит нормы права на понятный язык: что именно говорит закон, к каким ситуациям он применяется и какие права и обязанности из него следуют. Это помогает разобраться без долгого чтения кодексов.\nМы объясняем ключевые положения, которые чаще всего нужны людям: защита прав потребителей, трудовые гарантии, взыскание долгов, процессуальные сроки и порядок обращения в суд. Акцент — на практическом смысле нормы, а не на её дословной формулировке.\nЗакон всегда применяется с учётом обстоятельств, поэтому общее объяснение не заменяет анализа вашей ситуации. Если вы хотите понять, как конкретная норма работает в вашем случае, опишите обстоятельства и задайте вопрос юристу."
  },
  {
    slug: "life",
    h1: "Жизненные ситуации",
    description:
      "Жизненные правовые ситуации: судебный приказ, долги по зарплате, спор с продавцом или банком — понятные маршруты решения.",
    seoText:
      "Жизненные ситуации — это раздел, который описывает правовые проблемы так, как они возникают в реальной жизни: пришёл судебный приказ, не отдают зарплату, затопили квартиру, навязали ненужную услугу, возник спор с продавцом или банком.\nДля каждой ситуации показан понятный маршрут: что произошло с точки зрения права, какие у вас есть варианты, какие документы понадобятся и в какой срок лучше действовать. Это помогает быстро сориентироваться без юридического образования.\nЖизненные ситуации связаны с инструкциями, документами и калькуляторами по теме, поэтому от описания проблемы легко перейти к конкретным действиям. Если ваша ситуация сложнее типовой, опишите её и задайте вопрос юристу."
  },
  {
    slug: "posledstviya",
    h1: "Последствия",
    description:
      "Последствия правовых решений: что будет, если не ответить на претензию, пропустить срок или признать долг. Оцените шаги заранее.",
    seoText:
      "Прежде чем принять решение, полезно понимать его последствия: что будет, если не ответить на претензию, пропустить заседание, признать долг, подписать договор или не обжаловать решение в срок. Этот раздел помогает оценить шаги заранее.\nПоследствия бывают финансовыми (неустойка, расходы, взыскание), процессуальными (потеря права на обжалование) и практическими (арест счетов, ограничения). Иногда бездействие обходится дороже, чем активные, но обдуманные действия.\nПонимание последствий помогает выбирать стратегию, а не действовать наугад. Если вы взвешиваете варианты и хотите понять, чем обернётся каждый из них в вашей ситуации, опишите обстоятельства и задайте вопрос юристу."
  },
  {
    slug: "compare",
    h1: "Сравнения",
    description:
      "Сравнение правовых вариантов: претензия или иск, мировое или суд, обмен или возврат — сроки, риски и результат каждого пути.",
    seoText:
      "Раздел сравнений помогает выбрать между похожими, но разными по последствиям вариантами: претензия или сразу иск, мировое соглашение или суд, расторжение или изменение договора, отказ от товара или его обмен. У каждого пути свои сроки, риски и результат.\nСравнение строится по понятным критериям: что быстрее, что дешевле, что надёжнее, какие документы нужны и какие риски возникают. Это помогает принять решение осознанно, а не по первому впечатлению.\nПравильный выбор зависит от деталей: суммы, доказательств, поведения второй стороны. Если вы колеблетесь между вариантами, опишите ситуацию и задайте вопрос юристу — специалист подскажет, какой путь выгоднее и безопаснее именно в вашем случае."
  },
  {
    slug: "online",
    h1: "Онлайн-помощь",
    description:
      "Онлайн-помощь юриста: задайте вопрос, изучите ответы по похожим ситуациям, подготовьте документ и проверьте сроки — без передачи телефона.",
    seoText:
      "Онлайн-помощь юриста позволяет получить первичную правовую оценку, не выходя из дома: вы описываете ситуацию, а специалисты отвечают после модерации. Это удобно, когда нужно быстро понять, есть ли проблема и что делать дальше.\nЧерез платформу можно задать вопрос, изучить ответы юристов по похожим ситуациям, подготовить документ по образцу и проверить сроки калькулятором. Личные контакты специалистов при этом не раскрываются, а первый шаг не требует передачи телефона.\nОнлайн-формат хорошо подходит для первичной оценки и типовых вопросов; для сложных дел может понадобиться очная работа с документами. Чтобы начать, опишите ситуацию и задайте вопрос — после модерации на него ответят проверенные специалисты."
  },
  {
    slug: "video",
    h1: "Видео",
    description:
      "Видеоразборы юридических тем: претензия, судебный приказ, проверка договора, поведение в суде — наглядно и по делу.",
    seoText:
      "Видеоматериалы помогают разобраться в юридических темах наглядно: как составить претензию, что делать с судебным приказом, как вести себя в суде, как проверить договор. Формат коротких разборов экономит время и облегчает понимание сложных вопросов.\nВидео дополняет инструкции и образцы документов: посмотрев разбор, проще перейти к конкретным действиям — собрать документы, рассчитать срок или задать вопрос по своей ситуации. Тематические подборки связаны с соответствующими разделами навигатора.\nВидео объясняет общие правила, но не учитывает детали вашего дела. Если после просмотра остались вопросы по вашей конкретной ситуации, опишите её и задайте вопрос юристу для точного ответа."
  },
  {
    slug: "proverka",
    h1: "Проверка",
    description:
      "Проверки по праву: сроки, законность требования, корректность документа и статус специалиста — убедитесь в важном заранее.",
    seoText:
      "Раздел проверок помогает заранее убедиться в важных вещах: не пропущен ли срок, законно ли требование, корректен ли документ, действителен ли статус специалиста. Простая проверка часто экономит деньги и время и предотвращает ошибки.\nПроверять стоит ключевые моменты: даты и сроки, реквизиты и адресата документа, основания требования, наличие подтверждающих доказательств. Для расчёта сроков удобно использовать калькуляторы, а для статуса адвоката — официальные реестры.\nПроверка даёт ориентир, но в спорных случаях нужна оценка специалиста. Если результат проверки вызывает сомнения или ситуация серьёзная, опишите её и задайте вопрос юристу."
  },
  {
    slug: "proverka-dokumenta",
    h1: "Проверка документа",
    description:
      "Проверка документа перед подписанием: стороны, условия, ответственность, сроки и подсудность — на что обратить внимание в договоре.",
    seoText:
      "Проверка документа помогает понять, что вы подписываете или получаете: договор, претензию, расписку, судебный акт, уведомление. Невнимательность к формулировкам часто оборачивается лишними обязательствами, штрафами или потерей прав.\nПри проверке документа важно обращать внимание на стороны и их реквизиты, предмет и условия, ответственность и неустойку, сроки, порядок расторжения и подсудность. Особое внимание — мелкому шрифту, отсылкам к другим документам и невыгодным условиям по умолчанию.\nСамостоятельная проверка снижает очевидные риски, но юридические нюансы лучше оценивает специалист. Если документ важный или вызывает сомнения, не подписывайте его наспех — опишите ситуацию и задайте вопрос юристу, чтобы проверить условия до подписания."
  }
];

const infoSectionPages: Record<string, SeoPage> = Object.fromEntries(
  infoSectionPagesContent.map(({ slug, h1, description, seoText }) => [
    slug,
    qualifySeoPage({
      id: `seo-section-${slug}`,
      type: "STATIC",
      slug,
      title: `${h1} — юридический навигатор, документы, риски, помощь юриста`,
      description,
      h1,
      seoText,
      canonical: `/${slug}/`,
      isIndexable: true
    } as SeoPage)
  ])
);

export const revalidate = 900;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = searchParams ? await searchParams : undefined;
  const [staticPage, city, service] = await Promise.all([getStaticPage(slug), getCity(slug), getService(slug)]);

  if (commercialPages[slug]) {
    const page = qualifySeoPage(commercialPages[slug]);
    return buildMetadata({
      title: page.title,
      description: page.description,
      path: page.canonical,
      isIndexable: canIndexSeoPage({ seoPage: page, searchParams: query }),
      searchParams: query
    });
  }

  if (infoSectionPages[slug]) {
    const page = infoSectionPages[slug];
    return buildMetadata({
      title: page.title,
      description: page.description,
      path: page.canonical,
      isIndexable: canIndexSeoPage({ seoPage: page, searchParams: query }),
      searchParams: query
    });
  }

  if (staticPage) {
    return buildMetadata({
      title: staticPage.title,
      description: staticPage.description,
      path: `/${staticPage.slug}/`,
      isIndexable: staticPage.isIndexable,
      searchParams: query
    });
  }

  if (city) {
    const [seo, faqs, lawyers] = await Promise.all([
      getSeoPage("CITY", city.slug),
      getFaqs("CITY", city.id),
      getLawyers({ citySlug: city.slug })
    ]);
    const fallbackPage = {
      title: `Юристы в ${city.namePrepositional}`,
      description: `Подберите юриста в ${city.namePrepositional}.`,
      seoText: city.seoText
    };
    const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : null;
    return buildMetadata({
      title: page?.title ?? fallbackPage.title,
      description: page?.description ?? fallbackPage.description,
      path: `/${city.slug}/`,
      // Городские страницы закрыты от индексации (тонкие/шаблонные, наполнены dev-юристами).
      isIndexable: false,
      searchParams: query
    });
  }

  if (service) {
    const [seo, faqs, lawyers] = await Promise.all([
      getSeoPage("SERVICE", service.slug),
      getFaqs("SERVICE", service.id),
      getLawyers({ serviceSlug: service.slug })
    ]);
    const fallbackPage = {
      title: `${service.name} — консультация юриста`,
      description: `Юристы по направлению «${service.name}».`,
      seoText: service.fullDescription
    };
    const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : null;
    return buildMetadata({
      title: page?.title ?? fallbackPage.title,
      description: page?.description ?? fallbackPage.description,
      path: `/${service.slug}/`,
      isIndexable: canIndexServicePage({ service, seoPage: seo, faqCount: faqs.length, lawyerCount: lawyers.length, searchParams: query }),
      searchParams: query
    });
  }

  const merge = await getSeoMerge(`/${slug}/`);
  if (merge) {
    return buildMetadata({
      title: "Страница объединена с основным разделом",
      description: merge.reason,
      path: merge.newUrl ?? `/${slug}/`,
      isIndexable: false
    });
  }

  return buildMetadata({
    title: "Страница не найдена",
    description: "Страница не найдена.",
    path: `/${slug}/`,
    isIndexable: false
  });
}

export default async function SlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : undefined;
  const [staticPage, city, service, cities, services] = await Promise.all([
    getStaticPage(slug),
    getCity(slug),
    getService(slug),
    getCities(),
    getServices()
  ]);

  if (commercialPages[slug]) {
    const page = qualifySeoPage(commercialPages[slug]);
    const [lawyers, faqs, articles, questions] = await Promise.all([
      getLawyers(slug === "advokaty" ? { status: "ADVOCATE" } : {}),
      getFaqs("GENERAL", "home"),
      getArticles(),
      getQuestions()
    ]);

    return (
      <LandingPage
        page={page}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: page.h1, path: page.canonical }
        ]}
        cities={cities}
        services={services}
        lawyers={lawyers}
        faqs={faqs}
        articles={articles}
        questions={questions}
        questionOnly
        qaFirstHub={slug === "yuridicheskaya-konsultaciya-online"}
      />
    );
  }

  if (infoSectionPages[slug]) {
    const page = infoSectionPages[slug];
    const [lawyers, faqs, articles, questions] = await Promise.all([
      getLawyers(),
      getFaqs("GENERAL", "home"),
      getArticles(),
      getQuestions()
    ]);

    return (
      <LandingPage
        page={page}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: page.h1, path: page.canonical }
        ]}
        cities={cities}
        services={services}
        lawyers={lawyers}
        faqs={faqs}
        articles={articles}
        questions={questions}
      />
    );
  }

  if (staticPage) {
    const faqs = await getFaqs("GENERAL", "home");
    return <StaticTrustPage page={staticPage} faqs={faqs} />;
  }

  if (city) {
    const [seo, faqs, lawyers, articles, questions] = await Promise.all([
      getSeoPage("CITY", city.slug),
      getFaqs("CITY", city.id),
      getLawyers({ citySlug: city.slug }),
      getArticles(),
      getQuestions()
    ]);

    const fallbackPage = {
      id: `fallback-city-${city.slug}`,
      type: "CITY" as const,
      slug: city.slug,
      cityId: city.id,
      title: `Юристы в ${city.namePrepositional}`,
      description: `Подберите юриста в ${city.namePrepositional}.`,
      h1: `Юристы в ${city.namePrepositional}`,
      seoText: city.seoText,
      canonical: `/${city.slug}/`,
      isIndexable: false
    };
    const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : fallbackPage;

    return (
      <LandingPage
        page={page}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: city.name, path: `/${city.slug}/` }
        ]}
        cities={cities}
        services={services}
        lawyers={lawyers}
        faqs={faqs}
        articles={articles}
        questions={questions}
        cityId={city.id}
        citySlug={city.slug}
        cityName={city.namePrepositional}
        query={query}
      />
    );
  }

  if (service) {
    const [seo, faqs, lawyers, articles, questions] = await Promise.all([
      getSeoPage("SERVICE", service.slug),
      getFaqs("SERVICE", service.id),
      getLawyers({ serviceSlug: service.slug }),
      getArticles(service.id),
      getQuestions(service.id)
    ]);

    const fallbackPage = {
      id: `fallback-service-${service.slug}`,
      type: "SERVICE" as const,
      slug: service.slug,
      serviceId: service.id,
      title: `${service.name} — консультация юриста`,
      description: `Юристы по направлению «${service.name}».`,
      h1: `Юристы по направлению «${service.name}»`,
      seoText: service.fullDescription,
      canonical: `/${service.slug}/`,
      isIndexable: false
    };
    const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : fallbackPage;

    return (
      <LandingPage
        page={page}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: service.name, path: `/${service.slug}/` }
        ]}
        cities={cities}
        services={services}
        lawyers={lawyers}
        faqs={faqs}
        articles={articles}
        questions={questions}
        serviceId={service.id}
        serviceSlug={service.slug}
        serviceName={service.name}
        query={query}
      />
    );
  }

  const merge = await getSeoMerge(`/${slug}/`);
  if (merge?.redirectType === "REDIRECT_301" && merge.newUrl) {
    permanentRedirect(merge.newUrl);
  }
  if (merge?.redirectType === "GONE_410") {
    notFound();
  }
  if (merge?.redirectType === "NOINDEX") {
    return <SeoMergeNoindex merge={merge} />;
  }

  notFound();
}

function SeoMergeNoindex({
  merge
}: {
  merge: NonNullable<Awaited<ReturnType<typeof getSeoMerge>>>;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Раздел временно объединен с основной страницей</h1>
      <p className="mt-4 text-lg leading-8 text-zinc-700">{merge.reason}</p>
      {merge.newUrl ? (
        <Link href={merge.newUrl} className="mt-6 inline-flex rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-trust">
          Перейти к актуальному разделу
        </Link>
      ) : null}
      <div className="mt-8 rounded-lg border border-line bg-white p-5">
        <QuestionCtaLink sourcePage={merge.oldUrl} label="Задать вопрос юристу" />
      </div>
    </section>
  );
}

function LandingPage({
  page,
  breadcrumbs,
  cities,
  services,
  lawyers,
  faqs,
  articles,
  questions,
  cityId,
  serviceId,
  citySlug,
  serviceSlug,
  cityName,
  serviceName,
  qaFirstHub = false
}: {
  page: SeoPage;
  breadcrumbs: { name: string; path: string }[];
  cities: Awaited<ReturnType<typeof getCities>>;
  services: Awaited<ReturnType<typeof getServices>>;
  lawyers: Lawyer[];
  faqs: Awaited<ReturnType<typeof getFaqs>>;
  articles: Awaited<ReturnType<typeof getArticles>>;
  questions: Awaited<ReturnType<typeof getQuestions>>;
  cityId?: string;
  serviceId?: string;
  citySlug?: string;
  serviceSlug?: string;
  cityName?: string;
  serviceName?: string;
  query?: SearchParams | null;
  questionOnly?: boolean;
  qaFirstHub?: boolean;
}) {
  const path = page.canonical;
  const service = services.find((item) => item.id === serviceId || item.slug === serviceSlug);
  const city = cities.find((item) => item.id === cityId || item.slug === citySlug);
  const publicServiceLinks = getPublicServiceLinks(services);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path,
            name: page.h1,
            description: page.description,
            city,
            service,
            lawyers
          }),
          faqJsonLd(faqs)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="bg-zinc-50">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-trust" aria-hidden="true" />
              Подбор специалистов с проверкой профиля и прозрачными условиями
            </div>
            <h1 className="mt-6 break-words text-4xl font-semibold text-ink">{page.h1}</h1>
            <p className="mt-4 max-w-3xl break-words text-lg leading-8 text-zinc-700">{page.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <QuestionCtaLink sourcePage={path} defaultCityId={cityId} defaultServiceId={serviceId} label="Задать вопрос юристу" />
            </div>
          </div>
          <div id="question" className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Задать вопрос юристу</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Опишите ситуацию в разделе вопросов. Вопрос пройдет модерацию перед публикацией.
            </p>
            <div className="mt-4">
              <QuestionCtaLink sourcePage={path} defaultCityId={cityId} defaultServiceId={serviceId} label="Задать вопрос юристу" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {lawyers.length ? (
            lawyers.slice(0, 8).map((lawyer) => <LawyerCard key={lawyer.id} lawyer={lawyer} compact hideReviewCopy={qaFirstHub} />)
          ) : (
            <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
              Профили юристов временно недоступны. Задайте вопрос, чтобы получить ответ после модерации.
            </p>
          )}
        </div>
      </section>
      <Checklist
        title={serviceName ? `Что входит в направление «${serviceName}»` : cityName ? `Как выбрать юриста в ${cityName}` : "Что важно при выборе"}
        items={[
          "Сравните опыт специалиста именно по вашей юридической проблеме, а не только общий стаж.",
          "Проверьте стоимость первой консультации, формат связи и готовность работать с документами.",
          qaFirstHub
            ? "Сравните ответы юристов и откройте профиль специалиста перед приватным обращением через платформу."
            : "Сравните опыт, специализацию, ответы и подтвержденные сведения профиля перед обращением через платформу.",
          "Если вопрос срочный, оставьте вопрос: специалист подскажет, какие действия лучше выполнить в первую очередь."
        ]}
      />
      <LinkGrid title="Связанные услуги" items={publicServiceLinks.slice(0, 8)} makeHref={(item) => `/${item.slug}/`} />
      <SeoText title="Полезная информация" text={page.seoText} />
      <QuestionList questions={questions} />
      <ArticleList articles={articles} />
      {serviceName ? (
        <section className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Документы, калькуляторы и кейсы по теме</h2>
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
            <Link href="/documents/" className="rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-trust">Документы по теме</Link>
            <Link href="/tools/" className="rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-trust">Инструменты</Link>
            <Link href="/problems/" className="rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-trust">Правовой навигатор</Link>
          </div>
        </section>
      ) : null}
      <FaqBlock items={faqs} />
      <StickyCta href="#question" label="Задать вопрос юристу" source={path} />
    </>
  );
}

function StaticTrustPage({
  page,
  faqs
}: {
  page: StaticPage;
  faqs: Awaited<ReturnType<typeof getFaqs>>;
}) {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: page.h1, path: `/${page.slug}/` }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">{page.h1}</h1>
        <div className="mt-6 space-y-5 text-lg leading-8 text-zinc-700">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {page.bullets.map((item) => (
            <div key={item} className="rounded-lg border border-line bg-white p-4 text-sm font-medium leading-6 text-zinc-700">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-line bg-white p-5">
          <h2 className="text-2xl font-semibold text-ink">{page.cta}</h2>
          <p className="mt-2 text-zinc-600">Опишите ситуацию в разделе вопросов, если хотите получить ответ после модерации.</p>
          <div className="mt-5">
            <QuestionCtaLink sourcePage={`/${page.slug}/`} label="Задать вопрос юристу" />
          </div>
        </div>
      </section>
      <FaqBlock items={faqs} />
    </>
  );
}

function qualifySeoPage(page: SeoPage): SeoPage {
  return {
    ...page,
    robots: page.robots ?? "index, follow",
    seoScore: page.seoScore ?? 90,
    seoMaturity: page.seoMaturity ?? "READY_FOR_INDEX",
    primaryKeyword: page.primaryKeyword ?? page.h1.toLowerCase()
  };
}

function sanitizeLandingSeoPage<T extends SeoPage>(
  page: T,
  fallback: Pick<SeoPage, "title" | "description" | "seoText">
): T {
  return {
    ...page,
    title: safeLandingSeoCopy(page.title, fallback.title),
    description: safeLandingSeoCopy(page.description, fallback.description),
    seoText: safeLandingSeoCopy(page.seoText, fallback.seoText)
  };
}

function safeLandingSeoCopy(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return /\b(reviewCount|ratingValue|AggregateRating)\b|отзыв|рейтинг|звезд|лучши|топ/i.test(value) ? fallback : value;
}
