/**
 * Centralized Lesson Icon System for LevelUp Educational Platform
 * Maps every lesson ID across all courses to a topic-accurate Lucide React icon name.
 * Provides resilient fallbacks based on topic keywords and course categories.
 */

export const LESSON_ICON_MAP = {
  // Course 1: Programming & IT (HTML) [prog-1 .. prog-20]
  "prog-1": "Globe",
  "prog-2": "FileCode",
  "prog-3": "Code",
  "prog-4": "Heading",
  "prog-5": "Link",
  "prog-6": "Image",
  "prog-7": "List",
  "prog-8": "LayoutTemplate",
  "prog-9": "Boxes",
  "prog-10": "Table",
  "prog-11": "ClipboardList",
  "prog-12": "TextCursorInput",
  "prog-13": "CheckSquare",
  "prog-14": "Video",
  "prog-15": "Tag",
  "prog-16": "FolderTree",
  "prog-17": "CheckCircle2",
  "prog-18": "Accessibility",
  "prog-19": "LayoutPanelTop",
  "prog-20": "Rocket",

  // Course 2: Mathematics [math-1 .. math-20]
  "math-1": "Calculator",
  "math-2": "Percent",
  "math-3": "Variable",
  "math-4": "Equal",
  "math-5": "LineChart",
  "math-6": "TrendingUp",
  "math-7": "Scale",
  "math-8": "Divide",
  "math-9": "Compass",
  "math-10": "Triangle",
  "math-11": "Dices",
  "math-12": "BarChart3",
  "math-13": "Binary",
  "math-14": "Brain",
  "math-15": "Sigma",
  "math-16": "Ruler",
  "math-17": "Grid3X3",
  "math-18": "Coins",
  "math-19": "Radical",
  "math-20": "Trophy",

  // Course 3: Physics [phy-1 .. phy-20]
  "phy-1": "Move",
  "phy-2": "Gauge",
  "phy-3": "Cog",
  "phy-4": "Weight",
  "phy-5": "Activity",
  "phy-6": "BatteryCharging",
  "phy-7": "Orbit",
  "phy-8": "Waves",
  "phy-9": "Lightbulb",
  "phy-10": "Zap",
  "phy-11": "Cpu",
  "phy-12": "Magnet",
  "phy-13": "Thermometer",
  "phy-14": "Flame",
  "phy-15": "Atom",
  "phy-16": "Droplet",
  "phy-17": "Sun",
  "phy-18": "Microscope",
  "phy-19": "Wrench",
  "phy-20": "FlaskConical",

  // Course 4: English Language [eng-1 .. eng-20]
  "eng-1": "Smile",
  "eng-2": "Home",
  "eng-3": "SpellCheck",
  "eng-4": "Clock",
  "eng-5": "History",
  "eng-6": "CalendarCheck",
  "eng-7": "HelpCircle",
  "eng-8": "Headphones",
  "eng-9": "Mic",
  "eng-10": "PenTool",
  "eng-11": "BookOpen",
  "eng-12": "Users",
  "eng-13": "Plane",
  "eng-14": "ThumbsUp",
  "eng-15": "Quote",
  "eng-16": "Briefcase",
  "eng-17": "Presentation",
  "eng-18": "FileCheck2",
  "eng-19": "Speech",
  "eng-20": "GraduationCap",

  // Course 5: CSS (mapped as kyrgyz-language course id) [ky-1 .. ky-20]
  "ky-1": "Palette",
  "ky-2": "Crosshair",
  "ky-3": "Layers",
  "ky-4": "Paintbrush",
  "ky-5": "Type",
  "ky-6": "Sparkles",
  "ky-7": "Box",
  "ky-8": "MoveHorizontal",
  "ky-9": "Square",
  "ky-10": "Eye",
  "ky-11": "Rows3",
  "ky-12": "Grid3X3",
  "ky-13": "CreditCard",
  "ky-14": "MousePointerClick",
  "ky-15": "Clapperboard",
  "ky-16": "MonitorSmartphone",
  "ky-17": "Smartphone",
  "ky-18": "WandSparkles",
  "ky-19": "Bug",
  "ky-20": "Laptop",

  // Course 6: JavaScript (mapped as russian-language course id) [ru-1 .. ru-20]
  "ru-1": "Code2",
  "ru-2": "Variable",
  "ru-3": "Shapes",
  "ru-4": "Calculator",
  "ru-5": "GitBranch",
  "ru-6": "Repeat",
  "ru-7": "FunctionSquare",
  "ru-8": "List",
  "ru-9": "Package",
  "ru-10": "Quote",
  "ru-11": "AppWindow",
  "ru-12": "MousePointerClick",
  "ru-13": "CheckCheck",
  "ru-14": "Timer",
  "ru-15": "Network",
  "ru-16": "ShieldAlert",
  "ru-17": "Database",
  "ru-18": "Sparkles",
  "ru-19": "RefreshCw",
  "ru-20": "Rocket",

  // Course 7: Artificial Intelligence [ai-1 .. ai-20]
  "ai-1": "BrainCircuit",
  "ai-2": "Cpu",
  "ai-3": "Bot",
  "ai-4": "Sliders",
  "ai-5": "PenTool",
  "ai-6": "ShieldCheck",
  "ai-7": "Scale",
  "ai-8": "GraduationCap",
  "ai-9": "Database",
  "ai-10": "Workflow",
  "ai-11": "Users",
  "ai-12": "Filter",
  "ai-13": "Zap",
  "ai-14": "Search",
  "ai-15": "RefreshCw",
  "ai-16": "Layers",
  "ai-17": "Binary",
  "ai-18": "Boxes",
  "ai-19": "Lock",
  "ai-20": "Trophy",

  // Course 8: Web Design [design-1 .. design-20]
  "design-1": "Palette",
  "design-2": "SunMedium",
  "design-3": "Layout",
  "design-4": "Grid",
  "design-5": "Type",
  "design-6": "Heading",
  "design-7": "AppWindow",
  "design-8": "DraftingCompass",
  "design-9": "Component",
  "design-10": "Smartphone",
  "design-11": "Accessibility",
  "design-12": "Sparkles",
  "design-13": "LayoutDashboard",
  "design-14": "Boxes",
  "design-15": "MousePointerClick",
  "design-16": "Workflow",
  "design-17": "Briefcase",
  "design-18": "CheckCheck",
  "design-19": "MonitorSmartphone",
  "design-20": "Trophy",
};

/**
 * Course category fallback icons
 */
export const CATEGORY_FALLBACK_ICONS = {
  "programming-it": "Code2",
  HTML: "FileCode",
  CSS: "Palette",
  JavaScript: "Code2",
  mathematics: "Calculator",
  physics: "Atom",
  languages: "BookOpen",
  ai: "BrainCircuit",
  design: "Palette",
  default: "BookOpen",
};

/**
 * Topic keyword fallback matching (supports Russian, Kyrgyz, and English)
 */
const TOPIC_KEYWORD_RULES = [
  // Web & HTML
  { test: /аудио|видео|video|audio|iframe|медиа|media/i, icon: "Video" },
  { test: /изображен|картинк|image|photo|figure|caption|сүрөт/i, icon: "Image" },
  { test: /таблиц|table|уяча/i, icon: "Table" },
  { test: /форм|form|input|button|label|баскыч/i, icon: "ClipboardList" },
  { test: /список|списки|list|тизме/i, icon: "List" },
  { test: /ссылк|link|anchor|навигац|navigation|якор/i, icon: "Link" },
  { test: /доступност|accessibility|a11y|инклюзив/i, icon: "Accessibility" },
  { test: /html|doctype|тег|tag|элемент|markup|семанти|semantic/i, icon: "FileCode" },
  { test: /браузер|browser|веб|web|url|домен/i, icon: "Globe" },

  // CSS & Styling
  { test: /css|стил|style|боёк/i, icon: "Palette" },
  { test: /цвет|color|оттен|түс/i, icon: "Paintbrush" },
  { test: /шрифт|типограф|font|typography|текст/i, icon: "Type" },
  { test: /селектор|selector/i, icon: "Crosshair" },
  { test: /каскад|cascade|layer|катмар/i, icon: "Layers" },
  { test: /блок|box|margin|padding|отступ/i, icon: "Box" },
  { test: /flex|flexbox|флекс/i, icon: "Rows3" },
  { test: /grid|грид|тор/i, icon: "Grid3X3" },
  { test: /анимац|animation|transition|өтүү/i, icon: "Clapperboard" },
  { test: /адаптив|responsive|media quer/i, icon: "MonitorSmartphone" },
  { test: /mobile|мобил|телефон/i, icon: "Smartphone" },

  // JavaScript & Coding
  { test: /javascript|js|скрипт/i, icon: "Code2" },
  { test: /переменн|variable|өзгөрмө|let|const|var/i, icon: "Variable" },
  { test: /услови|condition|if|else|switch|тармак/i, icon: "GitBranch" },
  { test: /цикл|loop|for|while|кайталоо/i, icon: "Repeat" },
  { test: /функци|function|параметр|маани/i, icon: "FunctionSquare" },
  { test: /массив|array|коллекци/i, icon: "List" },
  { test: /объект|object|структур/i, icon: "Package" },
  { test: /клик|click|event|окуя|событи/i, icon: "MousePointerClick" },
  { test: /асинхрон|async|await|promise|таймер/i, icon: "Timer" },
  { test: /api|fetch|json|сеть|тармак/i, icon: "Network" },
  { test: /ошибк|error|ката|try|catch/i, icon: "ShieldAlert" },
  { test: /база|database|storage|сактоо/i, icon: "Database" },

  // Mathematics
  { test: /арифмет|arithmetic|калькулятор/i, icon: "Calculator" },
  { test: /дроб|процент|percent|бөлчөк/i, icon: "Percent" },
  { test: /уравнен|equation|теңдеме/i, icon: "Equal" },
  { test: /график|graph|координат/i, icon: "LineChart" },
  { test: /геометр|geometry|угол|бурч/i, icon: "Compass" },
  { test: /треугольн|үч бурчтук|triangle|окружност/i, icon: "Triangle" },
  { test: /вероятност|probability|ыктымал/i, icon: "Dices" },
  { test: /статистик|statistic|орточо/i, icon: "BarChart3" },
  { test: /тригонометр|trigonometry/i, icon: "Ruler" },
  { test: /финанс|деньги|валют|пайыз/i, icon: "Coins" },

  // Physics
  { test: /движен|скорост|motion|speed|жылыш/i, icon: "Move" },
  { test: /ускорен|acceleration|ылдам/i, icon: "Gauge" },
  { test: /сил|force|ньютон|күч/i, icon: "Cog" },
  { test: /гравитац|gravity|масс|веc|салмак/i, icon: "Weight" },
  { test: /энерги|energy|кубат|power/i, icon: "BatteryCharging" },
  { test: /волн|звук|wave|sound|термелүү/i, icon: "Waves" },
  { test: /свет|оптик|light|жарык/i, icon: "Lightbulb" },
  { test: /электр|ток|current|charge|заряд/i, icon: "Zap" },
  { test: /магнит|magnet/i, icon: "Magnet" },
  { test: /температур|тепло|heat|термо/i, icon: "Thermometer" },
  { test: /атом|atom|бөлүкчө|particle/i, icon: "Atom" },
  { test: /давлен|liquid|суюктук|басым/i, icon: "Droplet" },
  { test: /солнц|күн|solar/i, icon: "Sun" },
  { test: /измерен|measurement|өлчөө/i, icon: "Microscope" },

  // AI
  { test: /интеллект|intelligence|нейросет|нейрон/i, icon: "BrainCircuit" },
  { test: /модел|model|обучен|training/i, icon: "Cpu" },
  { test: /промпт|prompt/i, icon: "Bot" },
  { test: /этик|ethics|справедлив|адилет/i, icon: "Scale" },
  { test: /воркфлоу|workflow|процесс/i, icon: "Workflow" },
  { test: /автоматизац|automat/i, icon: "Zap" },
  { test: /исследован|research|факт|fact/i, icon: "Search" },
  { test: /коопсуздук|безопасност|security|privacy/i, icon: "Lock" },

  // Languages & English
  { test: /привет|знаком|greet|meet|салам/i, icon: "Smile" },
  { test: /дом|үй|home|school/i, icon: "Home" },
  { test: /грамматик|grammar|сөздүк/i, icon: "SpellCheck" },
  { test: /слушан|аудио|listen|угуу/i, icon: "Headphones" },
  { test: /произношен|айтуу|speak|pronunc/i, icon: "Mic" },
  { test: /письм|жазуу|write|pen/i, icon: "PenTool" },
  { test: /чтен|окуу|read|book/i, icon: "BookOpen" },
  { test: /путешеств|саякат|travel|plane/i, icon: "Plane" },
  { test: /презентац|presentation|сөз/i, icon: "Presentation" },
  { test: /диалог|сүйлөшүү|dialogue|speech/i, icon: "Speech" },

  // Design
  { test: /дизайн|design/i, icon: "Palette" },
  { test: /макет|layout|компонов/i, icon: "Layout" },
  { test: /сетк|grid/i, icon: "Grid" },
  { test: /лендинг|landing/i, icon: "AppWindow" },
  { test: /вайрфрейм|wireframe/i, icon: "DraftingCompass" },
  { test: /компонент|component/i, icon: "Component" },
  { test: /дашборд|dashboard/i, icon: "LayoutDashboard" },
  { test: /портфолио|portfolio|кейс/i, icon: "Briefcase" },

  // Completion & Awards
  { test: /проект|project|долбоор|финал|жыйынтык|итогов|review/i, icon: "Rocket" },
];

/**
 * Matches topic text to an appropriate icon name using keyword rules
 */
export function matchTopicKeywordIcon(text) {
  if (!text || typeof text !== "string") return null;
  const match = TOPIC_KEYWORD_RULES.find((rule) => rule.test.test(text));
  return match ? match.icon : null;
}

/**
 * Resolves the appropriate icon name for any lesson
 * @param {string|object} lessonOrId - Lesson ID string or lesson object
 * @param {object} [course] - Optional course object for contextual fallback
 * @returns {string} Lucide icon name
 */
export function getLessonIconName(lessonOrId, course = null) {
  const lessonId = typeof lessonOrId === "string" ? lessonOrId : lessonOrId?.id;

  // 1. Exact lesson ID match (stable across all languages)
  if (lessonId && LESSON_ICON_MAP[lessonId]) {
    return LESSON_ICON_MAP[lessonId];
  }

  // 2. If lesson object already has a valid Lucide icon string
  if (typeof lessonOrId === "object" && lessonOrId?.icon && typeof lessonOrId.icon === "string") {
    // If not an emoji, consider it an icon name
    if (!/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(lessonOrId.icon)) {
      return lessonOrId.icon;
    }
  }

  // 3. Keyword matching on description or title
  const textToScan = typeof lessonOrId === "object"
    ? `${lessonOrId.description || ""} ${lessonOrId.title || ""}`
    : "";
  if (textToScan.trim()) {
    const keywordIcon = matchTopicKeywordIcon(textToScan);
    if (keywordIcon) return keywordIcon;
  }

  // 4. Course category fallback
  if (course) {
    if (course.categoryId && CATEGORY_FALLBACK_ICONS[course.categoryId]) {
      return CATEGORY_FALLBACK_ICONS[course.categoryId];
    }
    if (course.id && CATEGORY_FALLBACK_ICONS[course.id]) {
      return CATEGORY_FALLBACK_ICONS[course.id];
    }
    if (course.category && CATEGORY_FALLBACK_ICONS[course.category]) {
      return CATEGORY_FALLBACK_ICONS[course.category];
    }
  }

  // 5. Global platform fallback
  return CATEGORY_FALLBACK_ICONS.default;
}
