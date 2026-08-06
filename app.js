/* 好日子網頁版：所有核心查詢在瀏覽器端完成。農曆計算使用 lunar-javascript（MIT）。 */
(() => {
  const $ = (id) => document.getElementById(id);
  const calendar = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Taipei' });
  const events = [
    ['moving', '搬家或入厝'], ['wedding', '結婚或登記'], ['opening', '開工或動土'], ['grandOpening', '開幕'],
    ['contract', '簽約'], ['installation', '安床'], ['travel', '出行或旅行'], ['medical', '就醫或手術'],
    ['business', '開市或交易'], ['renovation', '修繕或裝修'], ['burial', '安葬'], ['engagement', '訂婚'],
    ['naming', '求子或命名'], ['worship', '祭祀']
  ];
  const weekdays = [['0', '星期日'], ['1', '星期一'], ['2', '星期二'], ['3', '星期三'], ['4', '星期四'], ['5', '星期五'], ['6', '星期六']];
  const keywords = {
    moving: ['入宅', '入厝', '移徙'], wedding: ['嫁娶', '結婚'], opening: ['開工', '動土', '修造'],
    grandOpening: ['開市', '開幕', '交易'], contract: ['立券', '交易', '簽約'], installation: ['安床'],
    travel: ['出行'], medical: ['求醫'], business: ['開市', '交易'], renovation: ['修造', '動土'],
    burial: ['安葬'], engagement: ['納采', '訂婚'], naming: ['求嗣', '命名'], worship: ['祭祀']
  };
  const voiceEventAliases = {
    moving: ['搬家', '入厝', '入宅', '移徙'],
    wedding: ['結婚', '登記', '嫁娶', '婚禮', '成婚'],
    opening: ['開工', '動土'],
    grandOpening: ['開幕', '新店開幕'],
    contract: ['簽約', '合約', '合同', '立券'],
    installation: ['安床'],
    travel: ['出行', '旅行', '旅遊', '出遊'],
    medical: ['就醫', '看醫生', '手術', '求醫'],
    business: ['開市', '交易'],
    renovation: ['修繕', '裝修', '修造'],
    burial: ['安葬', '下葬'],
    engagement: ['訂婚', '納采'],
    naming: ['求子', '命名', '取名'],
    worship: ['祭祀', '拜拜']
  };
  const lunarLoaded = () => typeof window.Solar !== 'undefined' && typeof window.Lunar !== 'undefined';

  function traditional(value) {
    if (value === undefined || value === null) return '資料不足';
    let text = String(value).replaceAll('闰', '閏');
    const map = [['入宅', '入厝、入宅'], ['移徙', '搬家、移徙'], ['嫁娶', '結婚、嫁娶'], ['開市', '開市、開幕'], ['立券', '簽約、立券'], ['修造', '修繕、修造'], ['出行', '出門、出行'], ['求醫', '就醫、求醫'], ['求嗣', '求子、求嗣'], ['納采', '訂婚、納采'], ['雞', '雞'], ['龍', '龍']];
    map.forEach(([from, to]) => { text = text.split(from).join(to); });
    const simplifiedToTraditional = { 馬: '馬', 龙: '龍', 马: '馬', 鸡: '雞', 猪: '豬', 盖: '蓋', 竖: '豎', 车: '車', 农: '農', 历: '曆', 阳: '陽', 阴: '陰', 节: '節', 气: '氣', 岁: '歲', 时: '時', 间: '間', 点: '點', 国: '國', 问: '問', 听: '聽', 说: '說', 对: '對', 错: '錯', 这: '這', 个: '個', 数: '數', 据: '據', 无: '無', 资: '資', 料: '料', 开: '開', 询: '詢', 查: '查', 结: '結', 习: '習', 记: '記', 录: '錄', 识: '識', 语: '語', 读: '讀', 写: '寫', 转: '轉', 换: '換', 认: '認', 证: '證', 进: '進', 杀: '殺', 复: '復', 现: '現', 过: '過', 还: '還', 让: '讓', 发: '發', 诉: '訴', 选: '選', 择: '擇', 适: '適', 筛: '篩', 统: '統', 计: '計', 果: '果', 级: '級', 明: '明', 参: '參', 考: '考', 惊: '驚', 蛰: '蟄', 处: '處', 满: '滿', 种: '種' };
    for (const [from, to] of Object.entries(simplifiedToTraditional)) text = text.split(from).join(to);
    return text;
  }

  function value(object, names, fallback = '') {
    for (const name of names) {
      if (object && typeof object[name] === 'function') {
        try { const result = object[name](); if (result !== undefined && result !== null && result !== '') return result; } catch (_) { /* try next API spelling */ }
      }
    }
    return fallback;
  }

  function parseTime(text) {
    const branch = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
    const compactText = text.replace(/\s+/g, '');
    const spokenBranches = {
      子: ['子時', '子时', '紫時', '紫时', '子石', '紫石', '止石'],
      丑: ['丑時', '丑时', '醜時', '醜时', '丑石', '醜石'],
      寅: ['寅時', '寅时', '銀時', '银时', '寅石', '銀石', '银石', '臨時', '临时'],
      卯: ['卯時', '卯时', '毛時', '毛时', '卯石', '毛石'],
      辰: ['辰時', '辰时', '誠實', '诚实', '誠時', '诚时', '辰石', '誠石', '诚石'],
      巳: ['巳時', '巳时', '四時', '四时', '巳石', '四石'],
      午: ['午時', '午时', '五時', '五时', '午石', '五石'],
      未: ['未時', '未时', '餵食', '喂食', '餵時', '喂时', '未石', '餵石', '喂石'],
      申: ['申時', '申时', '身時', '身时', '生食', '生時', '深時', '申石', '身石', '生石', '深石'],
      酉: ['酉時', '酉时', '有事', '有時', '有时', '酉石', '有石'],
      戌: ['戌時', '戌时', '需時', '需时', '徐時', '徐时', '戌石', '需石', '徐石', '趨勢', '趋势', '虛實', '虚实'],
      亥: ['亥時', '亥时', '海時', '海时', '還時', '还时', '亥石', '海石']
    };
    if (/(?:日|號|号)(?:40|四十)(?:時|时|點|点|石)?$/.test(compactText)) return [10, 0];
    if (/(?:日|號|号)(?:50|五十)(?:時|时|點|点)?$/.test(compactText)) return [12, 0];
    for (const [name, hour] of Object.entries(branch)) if (spokenBranches[name].some((alias) => compactText.includes(alias))) return [hour, 0];
    const match = compactText.match(/([0-9零〇一二兩三四五六七八九十]{1,3})(?:點|点|时|時|:|：)(半|一刻|三刻|[0-9零〇一二兩三四五六七八九十]{1,3})?(?:分)?/);
    if (match) {
      let hour = chineseNumber(match[1]);
      if (hour === null || hour > 23) return [12, 0];
      let minute = 0;
      if (match[2] === '半') minute = 30;
      else if (match[2] === '一刻') minute = 15;
      else if (match[2] === '三刻') minute = 45;
      else if (match[2]) minute = chineseNumber(match[2]);
      if (minute === null || minute > 59) return [12, 0];
      const isEvening = /晚上|晚間/.test(text);
      const isAfternoon = /下午|午後|傍晚/.test(text);
      const isMorning = /上午|早上|清晨|凌晨|午夜/.test(text);
      if ((isAfternoon || isEvening) && hour >= 1 && hour <= 11) hour += 12;
      else if ((isMorning || isEvening) && hour === 12) hour = 0;
      return [hour, minute];
    }
    const fallback = text.match(/日\s*(?:50|五十)\s*$/);
    return fallback ? [12, 0] : [12, 0];
  }

  function chineseNumber(text) {
    if (/^\d+$/.test(text)) return Number(text);
    const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    if ([...text].every((c) => digits[c] !== undefined)) return [...text].reduce((n, c) => n * 10 + digits[c], 0);
    let total = 0, current = 0;
    for (const c of text) {
      if (digits[c] !== undefined) current = digits[c];
      else if (c === '十') { total += (current || 1) * 10; current = 0; }
      else if (c === '百') { total += (current || 1) * 100; current = 0; }
      else return null;
    }
    return total + current;
  }

  function isRocSpokenYear(text, inputYear) {
    const explicitRoc = text.includes('民國') || text.includes('中華民國');
    const explicitWestern = text.includes('西元') || text.includes('公元');
    return explicitRoc || (!explicitWestern && inputYear < 1000);
  }

  function spokenDayNumber(text, lunar) {
    let normalized = text;
    if (lunar) normalized = normalized.replace(/^初/, '').replace(/^廿/, '二十').replace(/^卅/, '三十');
    return chineseNumber(normalized);
  }

  function parseSpokenDate(text) {
    const lunar = /農曆|農歷|阴历|陰曆|陰歷|老黃曆|老黃歷/.test(text);
    const normalizedDateText = text.replace(/國曆|國歷|公曆|公歷|陽曆|陽歷|農曆|農歷|阴历|陰曆|陰歷|老黃曆|老黃歷/g, '').replace(/\s+/g, '');
    const dateMatch = normalizedDateText.match(/([0-9零〇一二三四五六七八九十百]{2,6})年?(閏|闰)?([0-9零〇一二三四五六七八九十百]{1,3})月([初廿卅0-9零〇一二三四五六七八九十百]{1,4})[日號号]?/);
    if (!dateMatch) return null;
    const inputYear = chineseNumber(dateMatch[1]);
    const leap = lunar && Boolean(dateMatch[2]);
    const month = chineseNumber(dateMatch[3]);
    const day = spokenDayNumber(dateMatch[4], lunar);
    if (!inputYear || !month || !day) return null;
    const roc = isRocSpokenYear(text, inputYear);
    const year = roc ? inputYear + 1911 : inputYear;
    const [hour, minute] = parseTime(text);
    return { year, inputYear, month, day, hour, minute, roc, lunar, leap };
  }

  function solarFromLunar(query) {
    const leap = query.leap === undefined ? document.getElementById('lunar-leap').checked : query.leap;
    const signedMonth = leap ? -Math.abs(query.month) : query.month;
    const lunar = Lunar.fromYmdHms(query.year, signedMonth, query.day, query.hour, query.minute, 0);
    return lunar.getSolar();
  }

  function lunarMonthName(month) {
    return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][month] || String(month);
  }

  function lunarConversionErrorMessage(query) {
    if (query.leap && typeof LunarYear !== 'undefined') {
      const leapMonth = LunarYear.fromYear(query.year).getLeapMonth();
      const yearName = query.roc ? `民國 ${query.inputYear} 年` : `${query.year} 年`;
      if (leapMonth === 0) return `${yearName}沒有閏月。`;
      if (leapMonth !== query.month) return `${yearName}的閏月是閏${lunarMonthName(leapMonth)}月，不是閏${lunarMonthName(query.month)}月。`;
    }
    return '無法轉換這個農曆日期，請檢查日期或閏月設定。';
  }

  function makeDay(solar) {
    const lunar = solar.getLunar();
    const yi = value(lunar, ['getDayYi'], []).map(traditional);
    const ji = value(lunar, ['getDayJi'], []).map(traditional);
    const solarText = `${solar.getYear()}年${String(solar.getMonth()).padStart(2, '0')}月${String(solar.getDay()).padStart(2, '0')}日 ${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}`;
    const term = traditional(value(lunar, ['getJieQi'], '今日不是節氣'));
    const prevJieQi = value(lunar, ['getPrevJieQi'], null);
    const nextJieQi = value(lunar, ['getNextJieQi'], null);
    const termText = (jieQi) => jieQi && typeof jieQi.getName === 'function' && typeof jieQi.getSolar === 'function'
      ? `${traditional(jieQi.getName())}，${formatSolarDate(jieQi.getSolar())}`
      : '資料不足';
    return {
      solarText,
      lunarText: traditional(value(lunar, ['toString', 'toFullString'], '農曆資料不足')),
      weekday: solar.getWeekInChinese ? traditional(solar.getWeekInChinese()) : weekdays[new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay()).getDay()][1],
      yearGanZhi: traditional(value(lunar, ['getYearInGanZhi'], '資料不足')).replaceAll('醜', '丑'),
      monthGanZhi: traditional(value(lunar, ['getMonthInGanZhiExact'], '資料不足')).replaceAll('醜', '丑'),
      dayGanZhi: traditional(value(lunar, ['getDayInGanZhi'], '資料不足')).replaceAll('醜', '丑'),
      timeGanZhi: traditional(value(lunar, ['getTimeInGanZhi'], '資料不足')).replaceAll('醜', '丑'),
      zodiac: traditional(value(lunar, ['getYearShengXiaoByLiChun', 'getYearShengXiao'], '資料不足')),
      term,
      prevTerm: termText(prevJieQi),
      nextTerm: termText(nextJieQi),
      yi,
      ji,
      clash: traditional(value(lunar, ['getDayChongDesc'], '資料不足'))
    };
  }

  function formatSolarDate(solar) {
    if (!solar) return '資料不足';
    const hasTime = typeof solar.getHour === 'function' && typeof solar.getMinute === 'function';
    if (!hasTime) return `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`;
    const hour = String(solar.getHour()).padStart(2, '0');
    const minute = String(solar.getMinute()).padStart(2, '0');
    return `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${hour}:${minute}`;
  }

  function renderDay(day) {
    const list = (items) => items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>無資料</p>';
    return `<article class="result-card" tabindex="-1"><h3 tabindex="-1">查詢結果</h3><dl><dt>國曆</dt><dd>${escapeHtml(day.solarText)}</dd><dt>農曆</dt><dd>${escapeHtml(day.lunarText)}</dd><dt>星期</dt><dd>${escapeHtml(day.weekday)}</dd><dt>生肖</dt><dd>${escapeHtml(day.zodiac)}</dd><dt>年柱</dt><dd>${escapeHtml(day.yearGanZhi)}</dd><dt>月柱</dt><dd>${escapeHtml(day.monthGanZhi)}</dd><dt>日柱</dt><dd>${escapeHtml(day.dayGanZhi)}</dd><dt>時柱</dt><dd>${escapeHtml(day.timeGanZhi)}</dd><dt>目前節氣</dt><dd>${escapeHtml(day.term)}</dd><dt>前一個節氣</dt><dd>${escapeHtml(day.prevTerm)}</dd><dt>下一個節氣</dt><dd>${escapeHtml(day.nextTerm)}</dd><dt>相沖生肖</dt><dd>${escapeHtml(day.clash)}</dd></dl></article>`;
  }

  function showLookupResult(html) {
    const area = $('lookup-result');
    area.innerHTML = html;
    const article = area.querySelector('article');
    if (article) {
      article.setAttribute('aria-label', article.textContent.replace(/\s+/g, ' ').trim());
      window.setTimeout(() => article.focus({ preventScroll: false }), 0);
    } else {
      const heading = area.querySelector('h3');
      if (heading) window.setTimeout(() => heading.focus({ preventScroll: false }), 0);
    }
  }

  function escapeHtml(text) { return String(text).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function currentSolar() { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }; }
  function populate() {
    const now = currentSolar();
    ['solar-year', 'solar-month', 'solar-day'].forEach((id, index) => $(id).value = [now.year, now.month, now.day][index]);
    ['lunar-year', 'lunar-month', 'lunar-day'].forEach((id, index) => $(id).value = [now.year, now.month, now.day][index]);
    $('event-type').innerHTML = events.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    $('weekday-options').innerHTML = weekdays.map(([value, label]) => `<label><input type="checkbox" value="${value}" checked> ${label}</label>`).join('');
  }

  function navigate(id) {
    document.querySelectorAll('main > section.panel').forEach((panel) => { panel.hidden = panel.id !== id; });
    const panel = document.getElementById(id);
    const heading = panel.querySelector('h2');
    const announcement = $('navigation-announcement');
    announcement.textContent = `${heading ? heading.textContent : '頁面'}，已開啟。`;
    (heading || panel).focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function announce(message) { const area = $('lookup-result'); area.innerHTML = `<div class="empty" role="alert">${escapeHtml(message)}</div>`; }
  function initLookup() {
    document.querySelectorAll('[data-calendar]').forEach((button) => button.addEventListener('click', () => {
      const lunar = button.dataset.calendar === 'lunar';
      document.querySelectorAll('[data-calendar]').forEach((b) => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
      $('solar-form').hidden = lunar; $('lunar-form').hidden = !lunar; $('lookup-result').innerHTML = '';
    }));
    $('solar-form').addEventListener('submit', (event) => { event.preventDefault(); if (!lunarLoaded()) return announce('農曆資料套件尚未載入，請確認網路連線後重新整理。'); const [hour, minute] = $('solar-time').value.split(':').map(Number); const yearInput = Number($('solar-year').value); const solarYear = $('solar-roc').checked ? yearInput + 1911 : yearInput; const solar = Solar.fromYmdHms(solarYear, Number($('solar-month').value), Number($('solar-day').value), hour, minute, 0); showLookupResult(renderDay(makeDay(solar))); });
    $('lunar-form').addEventListener('submit', (event) => { event.preventDefault(); if (!lunarLoaded()) return announce('農曆資料套件尚未載入，請確認網路連線後重新整理。'); const [hour, minute] = $('lunar-time').value.split(':').map(Number); const yearInput = Number($('lunar-year').value); const roc = $('lunar-roc').checked; const query = { year: roc ? yearInput + 1911 : yearInput, inputYear: yearInput, roc, month: Number($('lunar-month').value), day: Number($('lunar-day').value), hour, minute, leap: $('lunar-leap').checked }; try { showLookupResult(renderDay(makeDay(solarFromLunar(query)))); } catch (error) { announce(lunarConversionErrorMessage(query)); } });
  }

  function initGuidedDateEntry() {
    const toggle = $('guided-toggle'), panel = $('guided-date-entry'), close = $('guided-close'), classic = $('classic-date-entry'), stepArea = $('guided-step'), progress = $('guided-progress');
    if (!toggle || !panel || !close || !classic || !stepArea || !progress) return;
    const now = currentSolar();
    const branches = [['0', '子時'], ['2', '丑時'], ['4', '寅時'], ['6', '卯時'], ['8', '辰時'], ['10', '巳時'], ['12', '午時'], ['14', '未時'], ['16', '申時'], ['18', '酉時'], ['20', '戌時'], ['22', '亥時']];
    const state = { calendar: 'solar', era: 'western', year: now.year, month: now.month, day: now.day, leap: false, timeMode: 'clock', hour: 12, minute: 0, step: 0 };
    const steps = () => ['calendar', 'era', 'year', 'month', ...(state.calendar === 'lunar' ? ['leap'] : []), 'day', 'timeMode', 'time', 'summary'];
    const options = (start, end, selected, suffix) => Array.from({ length: end - start + 1 }, (_, index) => {
      const value = start + index;
      return `<option value="${value}"${value === selected ? ' selected' : ''}>${value}${suffix}</option>`;
    }).join('');
    const westernYear = () => state.era === 'roc' ? state.year + 1911 : state.year;
    const maxDay = () => state.calendar === 'lunar' ? 30 : new Date(westernYear(), state.month, 0).getDate();
    const summaryText = () => {
      const calendarName = state.calendar === 'lunar' ? '農曆' : '國曆';
      const yearName = state.era === 'roc' ? `民國${state.year}年` : `西元${state.year}年`;
      const leapName = state.calendar === 'lunar' && state.leap ? '閏月，' : '';
      const branch = branches.find(([hour]) => Number(hour) === state.hour)?.[1];
      const timeName = state.timeMode === 'branch' ? branch : `${String(state.hour).padStart(2, '0')}時${String(state.minute).padStart(2, '0')}分`;
      return `${calendarName}，${yearName}，${leapName}${state.month}月${state.day}日，${timeName}`;
    };
    const render = () => {
      const currentSteps = steps();
      state.step = Math.max(0, Math.min(state.step, currentSteps.length - 1));
      const key = currentSteps[state.step];
      progress.textContent = `第 ${state.step + 1} 步，共 ${currentSteps.length} 步`;
      let content = '';
      if (key === 'calendar') content = `<h4 id="guided-step-title" tabindex="-1">選擇曆法</h4><fieldset><legend>日期使用哪一種曆法</legend><label class="guided-choice"><input type="radio" name="guided-calendar" value="solar"${state.calendar === 'solar' ? ' checked' : ''}> 國曆</label><label class="guided-choice"><input type="radio" name="guided-calendar" value="lunar"${state.calendar === 'lunar' ? ' checked' : ''}> 農曆</label></fieldset>`;
      if (key === 'era') content = `<h4 id="guided-step-title" tabindex="-1">選擇年份制度</h4><fieldset><legend>年份使用哪一種制度</legend><label class="guided-choice"><input type="radio" name="guided-era" value="western"${state.era === 'western' ? ' checked' : ''}> 西元</label><label class="guided-choice"><input type="radio" name="guided-era" value="roc"${state.era === 'roc' ? ' checked' : ''}> 民國</label></fieldset>`;
      if (key === 'year') {
        const thisYear = state.era === 'roc' ? now.year - 1911 : now.year;
        content = `<h4 id="guided-step-title" tabindex="-1">輸入年份</h4><label for="guided-year">${state.era === 'roc' ? '民國年份' : '西元年份'}，直接輸入完整數字</label><input id="guided-year" type="text" inputmode="numeric" pattern="[0-9]{1,4}" maxlength="4" value="${state.year}" enterkeyhint="next" autocomplete="off" required><button id="guided-year-current" class="back-button" type="button">使用今年，${thisYear}年</button>`;
      }
      if (key === 'month') content = `<h4 id="guided-step-title" tabindex="-1">選擇月份</h4><label for="guided-month">月份</label><select id="guided-month">${options(1, 12, state.month, '月')}</select>`;
      if (key === 'leap') content = `<h4 id="guided-step-title" tabindex="-1">選擇一般月份或閏月</h4><fieldset><legend>月份類型</legend><label class="guided-choice"><input type="radio" name="guided-leap" value="no"${state.leap ? '' : ' checked'}> 一般月份</label><label class="guided-choice"><input type="radio" name="guided-leap" value="yes"${state.leap ? ' checked' : ''}> 閏月</label></fieldset>`;
      if (key === 'day') {
        state.day = Math.min(state.day, maxDay());
        content = `<h4 id="guided-step-title" tabindex="-1">選擇日期</h4><label for="guided-day">日期</label><select id="guided-day">${options(1, maxDay(), state.day, '日')}</select>`;
      }
      if (key === 'timeMode') content = `<h4 id="guided-step-title" tabindex="-1">選擇時間輸入方式</h4><fieldset><legend>時間類型</legend><label class="guided-choice"><input type="radio" name="guided-time-mode" value="clock"${state.timeMode === 'clock' ? ' checked' : ''}> 一般時間</label><label class="guided-choice"><input type="radio" name="guided-time-mode" value="branch"${state.timeMode === 'branch' ? ' checked' : ''}> 傳統時辰</label></fieldset>`;
      if (key === 'time' && state.timeMode === 'clock') content = `<h4 id="guided-step-title" tabindex="-1">選擇時間</h4><label for="guided-hour">小時</label><select id="guided-hour">${options(0, 23, state.hour, '時')}</select><label for="guided-minute">分鐘</label><select id="guided-minute">${options(0, 59, state.minute, '分')}</select>`;
      if (key === 'time' && state.timeMode === 'branch') content = `<h4 id="guided-step-title" tabindex="-1">選擇傳統時辰</h4><label for="guided-branch">時辰</label><select id="guided-branch">${branches.map(([hour, name]) => `<option value="${hour}"${Number(hour) === state.hour ? ' selected' : ''}>${name}</option>`).join('')}</select>`;
      if (key === 'summary') content = `<h4 id="guided-step-title" tabindex="-1">確認日期</h4><p class="guided-summary">${escapeHtml(summaryText())}</p><div class="guided-actions"><button id="guided-run" class="primary-button" type="button">開始查詢</button><button id="guided-restart" class="back-button" type="button">重新選擇</button></div>`;
      const previous = state.step > 0 && key !== 'summary' ? '<button class="back-button" type="button" data-guided-action="previous">上一步</button>' : '';
      const next = key !== 'summary' ? '<button class="primary-button" type="submit">下一步</button>' : '';
      stepArea.innerHTML = key === 'summary' ? content : `<form id="guided-current-form">${content}<div class="guided-actions">${previous}${next}</div></form>`;
      if (!panel.closest('[hidden]')) window.setTimeout(() => $('guided-step-title')?.focus({ preventScroll: false }), 0);
    };
    const collect = () => {
      const key = steps()[state.step];
      if (key === 'calendar') state.calendar = stepArea.querySelector('[name="guided-calendar"]:checked').value;
      if (key === 'era') {
        const nextEra = stepArea.querySelector('[name="guided-era"]:checked').value;
        if (nextEra !== state.era) state.year = nextEra === 'roc' && state.year >= 1912 ? state.year - 1911 : nextEra === 'western' && state.year < 1000 ? state.year + 1911 : state.year;
        state.era = nextEra;
      }
      if (key === 'year') state.year = Number($('guided-year').value);
      if (key === 'month') state.month = Number($('guided-month').value);
      if (key === 'leap') state.leap = stepArea.querySelector('[name="guided-leap"]:checked').value === 'yes';
      if (key === 'day') state.day = Number($('guided-day').value);
      if (key === 'timeMode') state.timeMode = stepArea.querySelector('[name="guided-time-mode"]:checked').value;
      if (key === 'time' && state.timeMode === 'clock') { state.hour = Number($('guided-hour').value); state.minute = Number($('guided-minute').value); }
      if (key === 'time' && state.timeMode === 'branch') { state.hour = Number($('guided-branch').value); state.minute = 0; }
    };
    const closeGuided = (moveFocus = true) => {
      panel.hidden = true;
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
      if (moveFocus) toggle.focus({ preventScroll: false });
    };
    toggle.addEventListener('click', () => {
      toggle.hidden = true;
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      $('lookup-result').innerHTML = '';
      state.step = 0;
      render();
    });
    close.addEventListener('click', () => closeGuided());
    stepArea.addEventListener('submit', (event) => { event.preventDefault(); collect(); state.step += 1; render(); });
    stepArea.addEventListener('click', (event) => {
      const previous = event.target.closest('[data-guided-action="previous"]');
      if (previous) { state.step -= 1; render(); return; }
      if (event.target.closest('#guided-year-current')) { const input = $('guided-year'); input.value = state.era === 'roc' ? now.year - 1911 : now.year; input.focus({ preventScroll: false }); input.select(); return; }
      if (event.target.closest('#guided-restart')) { $('lookup-result').innerHTML = ''; state.step = 0; render(); return; }
      if (!event.target.closest('#guided-run')) return;
      const prefix = state.calendar === 'lunar' ? 'lunar' : 'solar';
      document.querySelector(`[data-calendar="${state.calendar}"]`).click();
      $(`${prefix}-year`).value = state.year;
      $(`${prefix}-month`).value = state.month;
      $(`${prefix}-day`).value = state.day;
      $(`${prefix}-roc`).checked = state.era === 'roc';
      if (state.calendar === 'lunar') $('lunar-leap').checked = state.leap;
      $(`${prefix}-time`).value = `${String(state.hour).padStart(2, '0')}:${String(state.minute).padStart(2, '0')}`;
      closeGuided(false);
      document.querySelector(`#${prefix}-form`).requestSubmit();
    });
    stepArea.addEventListener('focusin', (event) => { if (event.target.id === 'guided-year') event.target.select(); });
    classic.hidden = true;
    panel.hidden = true;
  }

  function rangeDates(type) {
    const start = new Date(); start.setHours(12, 0, 0, 0); let end = new Date(start);
    if (type === 'next7') { start.setDate(start.getDate() + 1); end.setDate(end.getDate() + 8); }
    if (type === 'month') { start.setDate(1); end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 12); }
    if (type === 'nextMonth') { start.setDate(1); start.setMonth(start.getMonth() + 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 12); }
    if (type === 'twoYears') { start.setDate(start.getDate() + 1); end.setFullYear(end.getFullYear() + 2); }
    if (type === 'fiveYears') { start.setDate(start.getDate() + 1); end.setFullYear(end.getFullYear() + 5); }
    if (type === 'custom') {
      const startValue = $('custom-start').value, endValue = $('custom-end').value;
      if (!startValue || !endValue) return null;
      start.setTime(new Date(`${startValue}T12:00:00`).getTime());
      end.setTime(new Date(`${endValue}T12:00:00`).getTime());
      end.setDate(end.getDate() + 1);
    }
    return [start, end];
  }

  function searchGoodDays() {
    if (!lunarLoaded()) { $('good-day-result').innerHTML = '<div class="empty" role="alert">農曆資料套件尚未載入，請確認網路連線後重新整理。</div>'; return; }
    const event = $('event-type').value, range = rangeDates($('range-type').value), wantedWeekdays = [...document.querySelectorAll('#weekday-options input:checked')].map((input) => Number(input.value));
    if (!range) { $('good-day-result').innerHTML = '<div class="empty" role="alert">請選擇開始與結束日期。</div>'; return; }
    const [start, end] = range;
    const period = $('period').value, [hour] = period === 'morning' ? [10] : period === 'afternoon' ? [14] : [12], terms = keywords[event] || [], zodiac = $('zodiac').value.trim();
    if (!terms.length) {
      $('good-day-result').innerHTML = '<div class="empty" role="alert" tabindex="-1">這個事項目前沒有老黃曆對應規則，請選擇其他事項。</div>';
      window.setTimeout(() => $('good-day-result').querySelector('[role="alert"]')?.focus({ preventScroll: false }), 0);
      return;
    }
    const results = [];
    for (let date = new Date(start); date < end && results.length < 1827; date.setDate(date.getDate() + 1)) {
      if (wantedWeekdays.length && !wantedWeekdays.includes(date.getDay())) continue;
      const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), hour, 0, 0), day = makeDay(solar);
      const yi = day.yi.filter((item) => terms.some((term) => item.includes(term))), ji = day.ji.filter((item) => terms.some((term) => item.includes(term)));
      if (terms.length && (!yi.length || ji.length)) continue;
      if (zodiac && $('avoid-clash').checked && day.clash.includes(zodiac)) continue;
      results.push({ ...day, date: new Date(date), yi });
    }
    const area = $('good-day-result');
    area.removeAttribute('aria-label');
    area.removeAttribute('tabindex');
    if (!results.length) { area.innerHTML = '<div class="empty" role="alert" tabindex="-1">沒有符合條件的日期，請放寬日期、星期或生肖條件。</div>'; window.setTimeout(() => area.querySelector('[role="alert"]')?.focus({ preventScroll: false }), 0); return; }
    const shown = results.slice(0, 30);
    const spokenResults = shown.slice(0, 5).map((day, index) => `第${index + 1}個，${calendar.format(day.date)}，干支日：${day.dayGanZhi}，相沖生肖：${day.clash}，老黃曆宜：${day.yi.join('、')}`).join('。');
    const spokenLead = results.length <= 5 ? '結果如下：' : '先播報前五個：';
    const spokenSummary = `找到 ${results.length} 個符合條件的日期。${spokenLead}${spokenResults}`;
    area.innerHTML = `<p class="sr-only result-summary" tabindex="-1">${escapeHtml(spokenSummary)}</p><h3 class="result-heading" tabindex="-1">找到 ${results.length} 個符合條件的日期，以下顯示前 ${shown.length} 個</h3>` + shown.map((day) => `<article class="result-card" tabindex="0"><h3>${escapeHtml(calendar.format(day.date))}</h3><p><strong>干支日：</strong>${escapeHtml(day.dayGanZhi)}</p><p><strong>相沖生肖：</strong>${escapeHtml(day.clash)}</p><p><strong>老黃曆宜：</strong>${escapeHtml(day.yi.join('、'))}</p></article>`).join('');
    area.setAttribute('tabindex', '-1');
    area.removeAttribute('aria-label');
    window.setTimeout(() => area.querySelector('.result-summary')?.focus({ preventScroll: false }), 0);
  }

  function initGuidedGoodDays() {
    const toggle = $('guided-good-toggle'), panel = $('guided-good-entry'), close = $('guided-good-close'), classic = $('classic-good-entry'), stepArea = $('guided-good-step'), progress = $('guided-good-progress');
    if (!toggle || !panel || !close || !classic || !stepArea || !progress) return;
    const ranges = [['next7', '未來七天'], ['month', '本月'], ['nextMonth', '下個月'], ['twoYears', '未來兩年'], ['fiveYears', '未來五年'], ['custom', '自訂日期範圍']];
    const periods = [['any', '不限時段'], ['morning', '上午'], ['afternoon', '下午']];
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
    const today = new Date();
    const dateDigits = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date(tomorrow); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const state = { event: 'moving', range: 'next7', customStart: dateDigits(tomorrow), customEnd: dateDigits(nextMonth), weekdayMode: 'all', weekdays: ['0', '1', '2', '3', '4', '5', '6'], period: 'any', zodiacMode: 'none', zodiac: '虎', step: 0 };
    const steps = () => ['event', 'range', ...(state.range === 'custom' ? ['customRange'] : []), 'weekdayMode', ...(state.weekdayMode === 'custom' ? ['weekdays'] : []), 'period', 'zodiacMode', ...(state.zodiacMode === 'avoid' ? ['zodiac'] : []), 'summary'];
    const optionList = (items, selected) => items.map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
    const radioList = (name, items, selected) => items.map(([value, label]) => `<label class="guided-choice"><input type="radio" name="${name}" value="${value}"${value === selected ? ' checked' : ''}> ${label}</label>`).join('');
    const digitsToIso = (digits) => `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    const validDateDigits = (digits) => {
      if (!/^\d{8}$/.test(digits)) return false;
      const year = Number(digits.slice(0, 4)), month = Number(digits.slice(4, 6)), day = Number(digits.slice(6, 8));
      const date = new Date(year, month - 1, day, 12);
      return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
    };
    const readableDate = (digits) => `${Number(digits.slice(0, 4))}年${Number(digits.slice(4, 6))}月${Number(digits.slice(6, 8))}日`;
    const selectedWeekdays = () => state.weekdays.map((value) => weekdays.find(([day]) => day === value)?.[1]).filter(Boolean).join('、');
    const summaryText = () => {
      const eventName = events.find(([value]) => value === state.event)?.[1];
      const rangeName = state.range === 'custom' ? `${readableDate(state.customStart)}到${readableDate(state.customEnd)}` : ranges.find(([value]) => value === state.range)?.[1];
      const weekdayName = state.weekdayMode === 'all' ? '所有星期' : state.weekdayMode === 'weekday' ? '星期一到星期五' : state.weekdayMode === 'weekend' ? '星期六和星期日' : selectedWeekdays();
      const periodName = periods.find(([value]) => value === state.period)?.[1];
      const zodiacName = state.zodiacMode === 'avoid' ? `避開相沖生肖${state.zodiac}` : '不限制生肖';
      return `${eventName}，${rangeName}，${weekdayName}，${periodName}，${zodiacName}`;
    };
    const render = () => {
      const currentSteps = steps();
      state.step = Math.max(0, Math.min(state.step, currentSteps.length - 1));
      const key = currentSteps[state.step];
      progress.textContent = `第 ${state.step + 1} 步，共 ${currentSteps.length} 步`;
      let content = '';
      if (key === 'event') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇要做的事情</h4><label for="guided-good-event">要做的事情</label><select id="guided-good-event">${optionList(events, state.event)}</select>`;
      if (key === 'range') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇日期範圍</h4><label for="guided-good-range">日期範圍</label><select id="guided-good-range">${optionList(ranges, state.range)}</select>`;
      if (key === 'customRange') content = `<h4 id="guided-good-step-title" tabindex="-1">輸入自訂日期範圍</h4><label for="guided-good-start">開始日期，輸入八位數字</label><input id="guided-good-start" type="text" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" value="${state.customStart}" autocomplete="off" required><label for="guided-good-end">結束日期，輸入八位數字</label><input id="guided-good-end" type="text" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" value="${state.customEnd}" autocomplete="off" required>`;
      if (key === 'weekdayMode') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇星期條件</h4><fieldset><legend>要搜尋哪些星期</legend>${radioList('guided-weekday-mode', [['all', '所有星期'], ['weekday', '星期一到星期五'], ['weekend', '星期六和星期日'], ['custom', '自己選擇星期']], state.weekdayMode)}</fieldset>`;
      if (key === 'weekdays') content = `<h4 id="guided-good-step-title" tabindex="-1">自己選擇星期</h4><fieldset><legend>至少選擇一個星期</legend>${weekdays.map(([value, label]) => `<label class="guided-choice"><input type="checkbox" name="guided-weekday" value="${value}"${state.weekdays.includes(value) ? ' checked' : ''}> ${label}</label>`).join('')}</fieldset>`;
      if (key === 'period') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇時段</h4><fieldset><legend>希望的時段</legend>${radioList('guided-period', periods, state.period)}</fieldset>`;
      if (key === 'zodiacMode') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇生肖限制</h4><fieldset><legend>是否避開相沖生肖</legend>${radioList('guided-zodiac-mode', [['none', '不限制生肖'], ['avoid', '避開一個生肖']], state.zodiacMode)}</fieldset>`;
      if (key === 'zodiac') content = `<h4 id="guided-good-step-title" tabindex="-1">選擇要避開的生肖</h4><label for="guided-good-zodiac">生肖</label><select id="guided-good-zodiac">${zodiacNames.map((name) => `<option value="${name}"${name === state.zodiac ? ' selected' : ''}>${name}</option>`).join('')}</select>`;
      if (key === 'summary') content = `<h4 id="guided-good-step-title" tabindex="-1">確認擇日條件</h4><p class="guided-summary">${escapeHtml(summaryText())}</p><div class="guided-actions"><button id="guided-good-run" class="primary-button" type="button">搜尋好日子</button><button id="guided-good-restart" class="back-button" type="button">重新選擇</button></div>`;
      const previous = state.step > 0 && key !== 'summary' ? '<button class="back-button" type="button" data-guided-good-action="previous">上一步</button>' : '';
      const next = key !== 'summary' ? '<button class="primary-button" type="submit">下一步</button>' : '';
      stepArea.innerHTML = key === 'summary' ? content : `<form id="guided-good-current-form">${content}<div class="guided-actions">${previous}${next}</div></form>`;
      if (!panel.closest('[hidden]')) window.setTimeout(() => $('guided-good-step-title')?.focus({ preventScroll: false }), 0);
    };
    const collect = () => {
      const key = steps()[state.step];
      if (key === 'event') state.event = $('guided-good-event').value;
      if (key === 'range') state.range = $('guided-good-range').value;
      if (key === 'customRange') {
        const start = $('guided-good-start'), end = $('guided-good-end');
        if (!validDateDigits(start.value)) { start.setCustomValidity('請輸入正確的八位數開始日期，例如20260801'); start.reportValidity(); return false; }
        start.setCustomValidity('');
        if (!validDateDigits(end.value) || end.value < start.value) { end.setCustomValidity('結束日期必須正確，而且不能早於開始日期'); end.reportValidity(); return false; }
        end.setCustomValidity(''); state.customStart = start.value; state.customEnd = end.value;
      }
      if (key === 'weekdayMode') {
        state.weekdayMode = stepArea.querySelector('[name="guided-weekday-mode"]:checked').value;
        if (state.weekdayMode === 'all') state.weekdays = ['0', '1', '2', '3', '4', '5', '6'];
        if (state.weekdayMode === 'weekday') state.weekdays = ['1', '2', '3', '4', '5'];
        if (state.weekdayMode === 'weekend') state.weekdays = ['0', '6'];
      }
      if (key === 'weekdays') {
        const selected = [...stepArea.querySelectorAll('[name="guided-weekday"]:checked')].map((input) => input.value);
        if (!selected.length) { progress.textContent = '請至少選擇一個星期'; stepArea.querySelector('[name="guided-weekday"]')?.focus({ preventScroll: false }); return false; }
        state.weekdays = selected;
      }
      if (key === 'period') state.period = stepArea.querySelector('[name="guided-period"]:checked').value;
      if (key === 'zodiacMode') state.zodiacMode = stepArea.querySelector('[name="guided-zodiac-mode"]:checked').value;
      if (key === 'zodiac') state.zodiac = $('guided-good-zodiac').value;
      return true;
    };
    const closeGuided = (moveFocus = true) => {
      panel.hidden = true;
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
      if (moveFocus) toggle.focus({ preventScroll: false });
    };
    toggle.addEventListener('click', () => {
      toggle.hidden = true;
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      $('good-day-result').innerHTML = '';
      state.step = 0;
      render();
    });
    close.addEventListener('click', () => closeGuided());
    stepArea.addEventListener('submit', (event) => { event.preventDefault(); if (!collect()) return; state.step += 1; render(); });
    stepArea.addEventListener('focusin', (event) => { if (event.target.matches('#guided-good-start,#guided-good-end')) event.target.select(); });
    stepArea.addEventListener('click', (event) => {
      if (event.target.closest('[data-guided-good-action="previous"]')) { state.step -= 1; render(); return; }
      if (event.target.closest('#guided-good-restart')) { $('good-day-result').innerHTML = ''; state.step = 0; render(); return; }
      if (!event.target.closest('#guided-good-run')) return;
      $('event-type').value = state.event;
      $('range-type').value = state.range;
      $('custom-range').hidden = state.range !== 'custom';
      if (state.range === 'custom') { $('custom-start').value = digitsToIso(state.customStart); $('custom-end').value = digitsToIso(state.customEnd); }
      document.querySelectorAll('#weekday-options input').forEach((input) => { input.checked = state.weekdays.includes(input.value); });
      $('period').value = state.period;
      $('zodiac').value = state.zodiacMode === 'avoid' ? state.zodiac : '';
      $('avoid-clash').checked = state.zodiacMode === 'avoid';
      closeGuided(false);
      $('good-day-form').requestSubmit();
    });
    classic.hidden = true;
    panel.hidden = true;
  }

  function initGoodDays() { $('range-type').addEventListener('change', () => { $('custom-range').hidden = $('range-type').value !== 'custom'; }); $('good-day-form').addEventListener('submit', (event) => { event.preventDefault(); searchGoodDays(); }); }
  function initMicrophoneSetup() {
    const button = $('mic-setup-button');
    const status = $('mic-setup-status');
    if (!button || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      if (button) button.hidden = true;
      return;
    }
    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        button.textContent = '麥克風已啟用';
        button.setAttribute('aria-label', '麥克風已啟用');
        status.textContent = '';
      } catch (_) {
        button.disabled = false;
        status.textContent = '麥克風未啟用';
      }
    });
  }
  function initVoice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    let recognition = null;
    let recognitionTimer = null;
    let activeVoice = null;
    let voiceSession = 0;
    const clearRecognitionTimer = () => { if (recognitionTimer) { window.clearTimeout(recognitionTimer); recognitionTimer = null; } };
    const invalidateRecognition = () => {
      voiceSession += 1;
      clearRecognitionTimer();
      const oldRecognition = recognition;
      recognition = null;
      if (!oldRecognition) return;
      oldRecognition.onstart = null;
      oldRecognition.onresult = null;
      oldRecognition.onerror = null;
      oldRecognition.onnomatch = null;
      oldRecognition.onend = null;
      try { oldRecognition.abort(); } catch (_) { try { oldRecognition.stop(); } catch (_) {} }
    };
    const submitVoice = (voice) => {
      if (!voice.pending) return;
      voice.status.setAttribute('aria-live', 'off');
      voice.status.textContent = '';
      voice.succeeded = true;
      if (voice.target === 'lookup') fillLookupFromSpeech(voice.pending, voice.form);
      else fillGoodDayFromSpeech(voice.pending, true);
      voice.confirm.hidden = true;
    };
    const start = (voice) => {
      if (recognition) { recognition.stop(); return; }
      const session = ++voiceSession;
      activeVoice = voice;
      voice.pending = '';
      voice.succeeded = false;
      voice.status.setAttribute('aria-live', 'polite');
      voice.confirm.hidden = true;
      voice.transcript.hidden = true;
      voice.status.textContent = '';
      voice.startButton.textContent = '停止語音輸入';
      voice.startButton.setAttribute('aria-label', '停止語音輸入');
      voice.startButton.setAttribute('aria-pressed', 'true');
      recognition = new Speech();
      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => {
        if (session !== voiceSession) return;
        voice.status.textContent = '';
      };
      recognition.onresult = (event) => {
        if (session !== voiceSession) return;
        const text = [...event.results].map((result) => result[0].transcript).join('');
        voice.transcript.textContent = `我聽到的是：${text}`;
        voice.transcript.hidden = false;
        voice.confirm.hidden = false;
        voice.status.textContent = '辨識完成';
        voice.pending = text;
        voice.succeeded = true;
        voice.status.setAttribute('aria-live', 'off');
        voice.status.textContent = '';
        const confirmButton = voice.confirm.querySelector('.voice-confirm');
        voice.transcript.setAttribute('tabindex', '-1');
        voice.transcript.setAttribute('role', 'status');
        voice.transcript.setAttribute('aria-live', 'assertive');
        voice.transcript.setAttribute('aria-atomic', 'true');
        voice.transcript.setAttribute('aria-label', `我聽到的是：${text}`);
        voice.transcript.setAttribute('role', 'alert');
        const completedRecognition = recognition;
        window.setTimeout(() => {
          if (session !== voiceSession || recognition !== completedRecognition) return;
          try { completedRecognition.abort(); } catch (_) { try { completedRecognition.stop(); } catch (_) {} }
        }, 0);
        confirmButton.setAttribute('aria-label', '對，開始查詢');
      };
      recognition.onerror = (event) => {
        if (session !== voiceSession) return;
        clearRecognitionTimer();
        if (voice.succeeded || voice.pending) return;
        const message = event.error === 'not-allowed' ? '沒有麥克風權限' : event.error === 'no-speech' ? '沒有辨識到語音' : event.error === 'network' ? '語音服務連線失敗' : '語音辨識失敗';
        voice.status.textContent = message;
        voice.confirm.hidden = true;
      };
      recognition.onnomatch = () => { if (session !== voiceSession || voice.succeeded || voice.pending) return; voice.status.textContent = '沒有辨識到文字'; voice.confirm.hidden = true; };
      recognition.onend = () => {
        if (session !== voiceSession) return;
        clearRecognitionTimer();
        recognition = null;
        voice.startButton.textContent = '重新錄音';
        voice.startButton.setAttribute('aria-label', '重新錄音');
        voice.startButton.setAttribute('aria-pressed', 'false');
        if (voice.pending) window.setTimeout(() => voice.transcript.focus({ preventScroll: false }), 0);
        else if (!voice.status.textContent.includes('失敗') && !voice.status.textContent.includes('沒有')) voice.status.textContent = '語音輸入已結束';
      };
      try {
        recognition.start();
        recognitionTimer = window.setTimeout(() => { if (recognition) recognition.stop(); }, 20000);
      } catch (_) { clearRecognitionTimer(); voice.status.textContent = '語音輸入目前無法啟動，請重新按一次。'; recognition = null; }
    };
    const addButton = (parent, target, label, mount = parent) => {
      const form = $(parent);
      const area = document.createElement('div');
      area.className = 'voice-area';
      area.innerHTML = `<button type="button" class="secondary-button voice-start" aria-pressed="false">${label}</button><p class="voice-status" role="status" aria-live="polite"></p><p class="voice-transcript" tabindex="-1" hidden><strong>我聽到的是：</strong> <span></span></p><div class="voice-actions" hidden><button type="button" class="primary-button voice-confirm">對，開始查詢</button></div>`;
      if (mount === parent) form.prepend(area);
      else $(mount).append(area);
      const voice = { area, form, target, startButton: area.querySelector('.voice-start'), status: area.querySelector('.voice-status'), transcript: area.querySelector('.voice-transcript'), confirm: area.querySelector('.voice-actions'), pending: '', succeeded: false };
      voice.startButton.addEventListener('click', () => start(voice));
      voice.confirm.querySelector('.voice-confirm').addEventListener('click', () => submitVoice(voice));
      return voice;
    };
    addButton('solar-form', 'lookup', '開始語音查詢', 'lookup-voice-anchor');
    addButton('good-day-form', 'good-day', '開始語音找好日子', 'good-day-voice-anchor');
    const releaseMicrophone = () => {
      invalidateRecognition();
      if (!activeVoice) return;
      activeVoice.startButton.textContent = '重新錄音';
      activeVoice.startButton.setAttribute('aria-label', '重新錄音');
      activeVoice.startButton.setAttribute('aria-pressed', 'false');
    };
    window.addEventListener('pagehide', releaseMicrophone);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseMicrophone();
    });
  }
  function fillLookupFromSpeech(text) { const query = parseSpokenDate(text); if (!query) { announce('請說完整日期，例如：國曆 2026 年 7 月 23 日午時。'); return; } document.querySelector(`[data-calendar="${query.lunar ? 'lunar' : 'solar'}"]`).click(); const prefix = query.lunar ? 'lunar' : 'solar'; $(`${prefix}-year`).value = query.inputYear; $(`${prefix}-month`).value = query.month; $(`${prefix}-day`).value = query.day; $(`${prefix}-time`).value = `${String(query.hour).padStart(2, '0')}:${String(query.minute).padStart(2, '0')}`; $(`${prefix}-roc`).checked = query.roc; if (query.lunar) $('lunar-leap').checked = query.leap; document.querySelector(query.lunar ? '#lunar-form' : '#solar-form').requestSubmit(); }
  function setGoodDayDateRange(startDate, endDate) {
    const start = new Date(startDate); start.setHours(12, 0, 0, 0);
    const end = new Date(endDate); end.setHours(12, 0, 0, 0);
    const tomorrow = new Date(); tomorrow.setHours(12, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
    if (start < tomorrow) start.setTime(tomorrow.getTime());
    if (end < start) return false;
    const inputDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    $('range-type').value = 'custom';
    $('custom-range').hidden = false;
    $('custom-start').value = inputDate(start);
    $('custom-end').value = inputDate(end);
    return true;
  }
  function setGoodDayMonthRange(year, month) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1900 || year > 2100 || month < 1 || month > 12) return false;
    return setGoodDayDateRange(new Date(year, month - 1, 1, 12), new Date(year, month, 0, 12));
  }
  function fillGoodDayFromSpeech(text, autoSubmit = true) {
    document.querySelectorAll('#weekday-options input').forEach((input) => { input.checked = true; });
    $('period').value = 'any';
    const now = new Date();
    const yearMatch = text.match(/([0-9零〇一二三四五六七八九十百千]{2,6})\s*年/);
    const spokenYear = yearMatch ? chineseNumber(yearMatch[1]) : null;
    let targetYear = Number.isInteger(spokenYear) ? (isRocSpokenYear(text, spokenYear) ? spokenYear + 1911 : spokenYear) : null;
    if (text.includes('今年')) targetYear = now.getFullYear();
    if (text.includes('明年')) targetYear = now.getFullYear() + 1;
    if (text.includes('後年')) targetYear = now.getFullYear() + 2;
    const monthMatch = text.match(/([0-9零〇一二三四五六七八九十]{1,3})\s*月/);
    const spokenMonth = monthMatch ? chineseNumber(monthMatch[1]) : null;
    let rangeHandled = false;
    let rangeExpired = false;
    const setRange = (start, end) => { rangeHandled = true; if (!setGoodDayDateRange(start, end)) rangeExpired = true; };
    if (/未來五年|未來5年/.test(text)) { $('range-type').value = 'fiveYears'; $('custom-range').hidden = true; rangeHandled = true; }
    else if (/未來兩年|未來2年/.test(text)) { $('range-type').value = 'twoYears'; $('custom-range').hidden = true; rangeHandled = true; }
    else if (/上半年|下半年/.test(text)) {
      let year = targetYear;
      if (!year) year = /上半年/.test(text) && now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
      if (/上半年/.test(text)) setRange(new Date(year, 0, 1, 12), new Date(year, 5, 30, 12));
      else setRange(new Date(year, 6, 1, 12), new Date(year, 11, 31, 12));
    } else if (/年底/.test(text)) {
      let year = targetYear;
      if (!year && Number.isInteger(spokenMonth)) year = now.getMonth() + 1 <= spokenMonth ? now.getFullYear() : now.getFullYear() + 1;
      if (!year) year = now.getFullYear();
      const start = /現在|即日起|今天/.test(text) ? new Date(now) : Number.isInteger(spokenMonth) ? new Date(year, spokenMonth - 1, 1, 12) : new Date(year, 0, 1, 12);
      setRange(start, new Date(year, 11, 31, 12));
    } else if (Number.isInteger(spokenMonth)) {
      const year = targetYear || (now.getMonth() + 1 <= spokenMonth ? now.getFullYear() : now.getFullYear() + 1);
      rangeHandled = true;
      if (!setGoodDayMonthRange(year, spokenMonth)) rangeExpired = true;
    } else if (/下個月|下月/.test(text)) { $('range-type').value = 'nextMonth'; $('custom-range').hidden = true; rangeHandled = true; }
    else if (/本月|這個月/.test(text)) { $('range-type').value = 'month'; $('custom-range').hidden = true; rangeHandled = true; }
    else if (/未來七天|未來7天|未來一週|未來一周/.test(text)) { $('range-type').value = 'next7'; $('custom-range').hidden = true; rangeHandled = true; }
    let foundEvent = Object.entries(voiceEventAliases).find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0];
    if (!foundEvent && text.includes('假期')) foundEvent = 'wedding';
    if (foundEvent) $('event-type').value = foundEvent;
    const weekdayAliases = [
      ['0', ['星期日', '星期天', '週日', '週天', '周日', '周天', '禮拜日', '禮拜天']], ['1', ['星期一', '週一', '周一', '禮拜一']], ['2', ['星期二', '週二', '周二', '禮拜二']],
      ['3', ['星期三', '週三', '周三', '禮拜三']], ['4', ['星期四', '週四', '周四', '禮拜四']], ['5', ['星期五', '週五', '周五', '禮拜五']],
      ['6', ['星期六', '週六', '周六', '禮拜六']]
    ];
    const isWeekend = /週末|周末|星期六日|星期日六|六日/.test(text);
    const requestedWeekdays = isWeekend ? ['0', '6'] : weekdayAliases.filter(([, aliases]) => aliases.some((alias) => text.includes(alias))).map(([value]) => value);
    if (requestedWeekdays.length) document.querySelectorAll('#weekday-options input').forEach((input) => { input.checked = requestedWeekdays.includes(input.value); });
    if (text.includes('上午')) $('period').value = 'morning';
    if (text.includes('下午')) $('period').value = 'afternoon';
    if (rangeHandled && rangeExpired) {
      const area = $('good-day-result');
      area.innerHTML = '<div class="empty" role="alert" tabindex="-1">這個日期範圍已經過去，請改說其他時間範圍。</div>';
      window.setTimeout(() => area.querySelector('[role="alert"]')?.focus({ preventScroll: false }), 0);
      return;
    }
    if (autoSubmit) searchGoodDays();
  }

  document.addEventListener('click', (event) => { const button = event.target.closest('[data-go]'); if (button) navigate(button.dataset.go); });
  populate(); initLookup(); initGuidedDateEntry(); initGoodDays(); initGuidedGoodDays(); initMicrophoneSetup(); initVoice();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  let deferred; window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferred = event; $('install-button').hidden = false; $('install-button').onclick = async () => { deferred.prompt(); deferred = null; $('install-button').hidden = true; }; });
  if (!lunarLoaded()) setTimeout(() => announce('農曆套件尚未載入；請確認網路連線後重新整理。'), 300);
})();
