import type { TeaCategory, TeaProfile } from "./types";
import { CATEGORY_LABELS } from "./types";

export type Lang = "en" | "zh";

const EN = {
  // nav
  navTeas: "Teas",
  navLog: "Log",
  navStash: "Stash",
  navSettings: "Settings",

  // home
  homeEyebrow: "一盏茶 · a cup's time",
  homeTitle: "What are we steeping?",
  searchPlaceholder: "Search teas…",
  newTea: "New tea",
  yourTeas: "Your teas",
  favoritesTitle: "Favorites",
  recentlyBrewed: "Recently brewed",
  favorite: "Add to favorites",
  unfavorite: "Remove from favorites",
  continueBrewing: "Continue brewing",
  viewDetails: "View details",
  manage: "Manage",
  noMatch: (q: string) =>
    `No tea matches “${q}”. Try another name, or create it as a new tea.`,
  cardMeta: (steeps: number, first: string, temp: number) =>
    `${steeps} steeps · first ${first} · ${temp}°C`,

  // session
  back: "← Back",
  steepOf: (n: number, total: number) => `Steep ${n} of ${total}`,
  steeping: "steeping…",
  paused: "paused",
  tapStart: "tap start when the water’s in",
  pourThenStart: "pour, then start when ready",
  pouredReady: "poured — ready for the next?",
  startSteep: "Start steep",
  pause: "Pause",
  resume: "Resume",
  nextSteep: "Next steep →",
  skipSteep: "Skip this steep",
  strengthChip: (x: string) => `strength ×${x}`,
  vesselLabel: "Vessel",
  decreaseVessel: "Smaller vessel",
  increaseVessel: "Larger vessel",
  decreaseGrams: "Less leaf",
  increaseGrams: "More leaf",
  sessionStats: (steeps: number, totalMl: number, time: string) =>
    `${steeps} poured · ${totalMl} ml water · ${time} brewed`,
  lastSteepTitle: "That’s the last steep",
  lastSteepBody: (done: number, total: number) =>
    `${done} of ${total} steeps poured. How was it?`,
  notePlaceholder: "Tasting note — aroma, body, how many steeps it held…",
  saveToLog: "Save to log",
  saved: "Saved ✓",
  done: "Done",
  teaNotFound: "This tea isn’t on the shelf.",
  backToTeas: "Back to teas",

  // profiles
  shelfEyebrow: "Your teas",
  shelfTitle: "Tea shelf",
  shelfEmpty:
    "No custom teas yet. Create one to set your own steep times, color, and leaf shape — then share it as a link.",
  createFirst: "Create your first tea",
  brew: "Brew",
  share: "Share",
  copied: "Copied ✓",
  edit: "Edit",
  del: "Delete",
  sure: "Sure?",
  profileMeta: (steeps: number, temp: number) => `${steeps} steeps · ${temp}°C`,
  newTeaEyebrow: "New tea",
  newTeaTitle: "Add to your shelf",
  editTeaEyebrow: "Edit tea",
  notOnShelf: "This tea isn’t on your shelf.",
  backToShelf: "Back to your teas",
  detailsEyebrow: "Tea details",
  cloneAndCustomize: "Clone & customize",

  // editor
  fName: "Name",
  fNamePlaceholder: "Grandpa’s Tieguanyin",
  fChineseName: "Chinese name",
  fOptional: "(optional)",
  fType: "Type",
  fTemp: "Water °C",
  fRatio: "g / 100 ml",
  fSteeps: "Steep times, seconds",
  steepsPreview: (n: number) => `${n} steeps: `,
  fColor: "Liquor color",
  fIcon: "Leaf shape",
  fAutoAdvance: "Move to the next steep automatically after each pour",
  errName: "Give the tea a name.",
  errSteeps: "Add at least one steep time, in seconds — e.g. 15, 20, 30.",
  saveTea: "Save tea",
  cancel: "Cancel",

  // log
  logEyebrow: "记 · brew log",
  logTitle: "Sessions past",
  logEmpty:
    "No brews yet. Your sessions land here automatically — with room for a rating and a tasting note.",
  pickTea: "Pick a tea",
  logMeta: (done: number, total: number) => `${done}/${total} steeps`,
  grams: (g: number) => `${g} g`,
  addNote: "Add note",
  editNote: "Edit note",
  close: "Close",
  save: "Save",
  deleteSession: "Delete session",
  shortNotePlaceholder: "Tasting note…",
  totalBrewed: (time: string) => `${time} brewed`,
  gramsUsedLabel: "Grams used",
  steepsCompletedLabel: "Steeps completed",
  favoriteLabel: "Favorite",
  tagsLabel: "Tags",
  tagsPlaceholder: "morning, cold day…",
  steepsToggle: "steeps",
  steepRow: (n: number, time: string, duration: string) =>
    `Steep ${n} — ${time} · ${duration}`,
  resumeSession: "Resume",

  // stash
  stashEyebrow: "藏 · tea stash",
  stashTitle: "What’s in the jar",
  addTea: "＋ Add tea",
  chooseTea: "Choose a tea…",
  gramsOnHand: "Grams on hand",
  addToStash: "Add to stash",
  stashEmpty:
    "Track the teas you own. Each brew session subtracts its leaf automatically, so you’ll know when a jar runs low.",
  stashMeta: (g: number, sessions: number) =>
    `${g} g left · ~${sessions} session${sessions === 1 ? "" : "s"}`,
  runningLow: " — running low",
  remove: "Remove",

  // settings
  settingsEyebrow: "调 · settings",
  settingsTitle: "To your taste",
  strengthSection: "Steep strength",
  strengthLabel: (x: string) => `All steep times ×${x}`,
  lighter: "lighter",
  stronger: "stronger",
  asWritten: "as written",
  lighterEnd: "lighter · 0.7×",
  strongerEnd: "stronger · 1.4×",
  reset: "reset",
  alertsSection: "When a steep finishes",
  chime: "Chime",
  chimeHint: "A soft bell, made right in the browser",
  notification: "Notification",
  notificationHint: "Reaches you even when the tab is in the background",
  vibration: "Vibration",
  vibrationHint: "On phones that support it",
  brewingSection: "While brewing",
  keepAwake: "Keep the screen awake",
  keepAwakeHint: "So the timer stays visible mid-steep",
  appearanceSection: "Appearance",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  languageSection: "Language · 语言",
  profilesSection: "Your tea profiles",
  exportJson: "Export as JSON",
  importJson: "Import JSON",

  // import page
  importEyebrow: "A tea, shared with you",
  importMeta: (steeps: number) => `${steeps} steeps: `,
  addToShelf: "Add to my shelf",
  added: "Added ✓",
  noThanks: "No thanks",
  badLink: "This share link is missing or malformed — ask for a fresh one.",

  // alerts
  steepDoneTitle: (tea: string, n: number) => `${tea} — steep ${n} done`,
  steepDoneBody: "Time to pour 🫖",
};

const ZH: typeof EN = {
  navTeas: "茶",
  navLog: "记录",
  navStash: "茶仓",
  navSettings: "设置",

  homeEyebrow: "一盏茶 · a cup's time",
  homeTitle: "今天泡什么茶？",
  searchPlaceholder: "搜索茶叶…",
  newTea: "添加茶",
  yourTeas: "我的茶",
  favoritesTitle: "收藏",
  recentlyBrewed: "最近冲泡",
  favorite: "加入收藏",
  unfavorite: "移出收藏",
  continueBrewing: "继续冲泡",
  viewDetails: "查看详情",
  manage: "管理",
  noMatch: (q) => `没有找到「${q}」。换个名字试试，或者自己创建一款。`,
  cardMeta: (steeps, first, temp) => `${steeps} 泡 · 首泡 ${first} · ${temp}°C`,

  back: "← 返回",
  steepOf: (n, total) => `第 ${n} 泡 · 共 ${total} 泡`,
  steeping: "冲泡中…",
  paused: "已暂停",
  tapStart: "注水后点击开始",
  pourThenStart: "出汤后，准备好再开始",
  pouredReady: "已出汤——继续下一泡？",
  startSteep: "开始冲泡",
  pause: "暂停",
  resume: "继续",
  nextSteep: "下一泡 →",
  skipSteep: "跳过这一泡",
  strengthChip: (x) => `浓度 ×${x}`,
  vesselLabel: "容量",
  decreaseVessel: "减少容量",
  increaseVessel: "增加容量",
  decreaseGrams: "减少茶叶",
  increaseGrams: "增加茶叶",
  sessionStats: (steeps, totalMl, time) =>
    `已出汤 ${steeps} 次 · 共 ${totalMl} 毫升水 · 冲泡 ${time}`,
  lastSteepTitle: "最后一泡结束了",
  lastSteepBody: (done, total) => `共泡了 ${done}/${total} 泡。味道如何？`,
  notePlaceholder: "品茶笔记——香气、滋味、耐泡度…",
  saveToLog: "保存到记录",
  saved: "已保存 ✓",
  done: "完成",
  teaNotFound: "茶架上没有这款茶。",
  backToTeas: "返回茶架",

  shelfEyebrow: "我的茶",
  shelfTitle: "茶架",
  shelfEmpty:
    "还没有自定义的茶。创建一款，设置自己的冲泡时间、汤色和叶形——还能用链接分享给朋友。",
  createFirst: "创建第一款茶",
  brew: "冲泡",
  share: "分享",
  copied: "已复制 ✓",
  edit: "编辑",
  del: "删除",
  sure: "确定？",
  profileMeta: (steeps, temp) => `${steeps} 泡 · ${temp}°C`,
  newTeaEyebrow: "添加茶",
  newTeaTitle: "放上茶架",
  editTeaEyebrow: "编辑茶",
  notOnShelf: "你的茶架上没有这款茶。",
  backToShelf: "返回我的茶",
  detailsEyebrow: "茶叶详情",
  cloneAndCustomize: "复制并自定义",

  fName: "名称",
  fNamePlaceholder: "爷爷的铁观音",
  fChineseName: "英文名",
  fOptional: "（可选）",
  fType: "类别",
  fTemp: "水温 °C",
  fRatio: "克 / 100 毫升",
  fSteeps: "每泡时间（秒）",
  steepsPreview: (n) => `${n} 泡：`,
  fColor: "汤色",
  fIcon: "叶形",
  fAutoAdvance: "每泡结束后自动进入下一泡",
  errName: "给茶起个名字。",
  errSteeps: "至少填一个冲泡时间（秒），例如 15, 20, 30。",
  saveTea: "保存",
  cancel: "取消",

  logEyebrow: "记 · 泡茶记录",
  logTitle: "过往茶席",
  logEmpty: "还没有记录。每次泡茶会自动记在这里——可以打分、写品茶笔记。",
  pickTea: "选一款茶",
  logMeta: (done, total) => `${done}/${total} 泡`,
  grams: (g) => `${g} 克`,
  addNote: "写笔记",
  editNote: "编辑笔记",
  close: "收起",
  save: "保存",
  deleteSession: "删除记录",
  shortNotePlaceholder: "品茶笔记…",
  totalBrewed: (time) => `冲泡 ${time}`,
  gramsUsedLabel: "用茶量（克）",
  steepsCompletedLabel: "已泡次数",
  favoriteLabel: "收藏",
  tagsLabel: "标签",
  tagsPlaceholder: "早晨，冷天…",
  steepsToggle: "泡数",
  steepRow: (n, time, duration) => `第 ${n} 泡 — ${time} · ${duration}`,
  resumeSession: "继续",

  stashEyebrow: "藏 · 茶仓",
  stashTitle: "罐子里还有什么",
  addTea: "＋ 添加茶",
  chooseTea: "选择茶叶…",
  gramsOnHand: "现有克数",
  addToStash: "放入茶仓",
  stashEmpty: "记录你手上的茶。每泡一次自动扣掉用量，快喝完时提醒你。",
  stashMeta: (g, sessions) => `剩 ${g} 克 · 约 ${sessions} 次`,
  runningLow: "——快喝完了",
  remove: "移除",

  settingsEyebrow: "调 · 设置",
  settingsTitle: "随你口味",
  strengthSection: "冲泡浓度",
  strengthLabel: (x) => `所有时间 ×${x}`,
  lighter: "更淡",
  stronger: "更浓",
  asWritten: "原方",
  lighterEnd: "更淡 · 0.7×",
  strongerEnd: "更浓 · 1.4×",
  reset: "重置",
  alertsSection: "每泡结束时",
  chime: "铃声",
  chimeHint: "浏览器合成的一声轻钟",
  notification: "通知",
  notificationHint: "标签页在后台也能提醒你",
  vibration: "震动",
  vibrationHint: "在支持的手机上",
  brewingSection: "泡茶时",
  keepAwake: "保持屏幕常亮",
  keepAwakeHint: "冲泡中计时一直可见",
  appearanceSection: "外观",
  themeSystem: "跟随系统",
  themeLight: "浅色",
  themeDark: "深色",
  languageSection: "Language · 语言",
  profilesSection: "自定义茶",
  exportJson: "导出 JSON",
  importJson: "导入 JSON",

  importEyebrow: "朋友分享给你的茶",
  importMeta: (steeps) => `${steeps} 泡：`,
  addToShelf: "加入我的茶架",
  added: "已添加 ✓",
  noThanks: "先不用",
  badLink: "分享链接缺失或已损坏——请再要一个新的。",

  steepDoneTitle: (tea, n) => `${tea}——第 ${n} 泡好了`,
  steepDoneBody: "该出汤了 🫖",
};

export const STRINGS: Record<Lang, typeof EN> = { en: EN, zh: ZH };

const CATEGORY_LABELS_ZH: Record<TeaCategory, string> = {
  green: "绿茶",
  white: "白茶",
  yellow: "黄茶",
  "oolong-light": "清香乌龙",
  "oolong-dark": "浓香乌龙",
  black: "红茶",
  "puer-sheng": "生普洱",
  "puer-shou": "熟普洱",
  heicha: "黑茶",
  herbal: "花草茶",
};

export function categoryLabel(cat: TeaCategory, lang: Lang): string {
  return lang === "zh" ? CATEGORY_LABELS_ZH[cat] : CATEGORY_LABELS[cat];
}

/** Primary/secondary name flips in Chinese mode. */
export function teaNames(
  tea: Pick<TeaProfile, "name" | "chineseName">,
  lang: Lang,
): { primary: string; secondary?: string } {
  if (lang === "zh" && tea.chineseName) {
    return { primary: tea.chineseName, secondary: tea.name };
  }
  return { primary: tea.name, secondary: tea.chineseName };
}

export function dateLocale(lang: Lang): string | undefined {
  return lang === "zh" ? "zh-CN" : undefined;
}

/**
 * Log/stash entries store an English name snapshot at creation time (so the
 * entry still reads sensibly if the tea is later deleted). When the tea still
 * exists, re-derive the name live so it flips with the language toggle;
 * otherwise fall back to the snapshot.
 */
export function displayTeaName(
  storedName: string,
  tea: Pick<TeaProfile, "name" | "chineseName"> | undefined,
  lang: Lang,
): string {
  return tea ? teaNames(tea, lang).primary : storedName;
}
