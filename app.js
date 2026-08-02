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
  const lunarLoaded = () => typeof window.Solar !== 'undefined' && typeof window.Lunar !== 'undefined';

  function traditional(value) {
    if (value === undefined || value === null) return '資料不足';
    let text = String(value);
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
      戌: ['戌時', '戌时', '需時', '需时', '徐時', '徐时', '戌石', '需石', '徐石', '趨勢', '趋势'],
      亥: ['亥時', '亥时', '海時', '海时', '還時', '还时', '亥石', '海石']
    };
    if (/(?:日|號|号)(?:40|四十)(?:時|时|點|点|石)?$/.test(compactText)) return [10, 0];
    if (/(?:日|號|号)(?:50|五十)(?:時|时|點|点)?$/.test(compactText)) return [12, 0];
    for (const [name, hour] of Object.entries(branch)) if (spokenBranches[name].some((alias) => compactText.includes(alias))) return [hour, 0];
    const match = text.match(/(\d{1,2})\s*(?:點|时|時|:|：)\s*(\d{1,2})?/);
    if (match) {
      let hour = Math.min(23, Number(match[1]));
      if (/下午|午後/.test(text) && hour >= 1 && hour <= 11) hour += 12;
      return [hour, Math.min(59, Number(match[2] || 0))];
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

  function parseSpokenDate(text) {
    const dateMatch = text.match(/([0-9零〇一二三四五六七八九十百]{2,6})\s*年\s*([0-9零〇一二三四五六七八九十百]{1,3})\s*月\s*([0-9零〇一二三四五六七八九十百]{1,3})\s*[日號号]?/);
    if (!dateMatch) return null;
    const inputYear = chineseNumber(dateMatch[1]);
    const month = chineseNumber(dateMatch[2]);
    const day = chineseNumber(dateMatch[3]);
    if (!inputYear || !month || !day) return null;
    const explicitRoc = text.includes('民國') || text.includes('中華民國');
    const explicitWestern = text.includes('西元') || text.includes('公元');
    const roc = explicitRoc || (!explicitWestern && inputYear < 1000);
    const year = roc ? inputYear + 1911 : inputYear;
    const [hour, minute] = parseTime(text);
    return { year, inputYear, month, day, hour, minute, roc, lunar: text.includes('農曆') || text.includes('陰曆') || text.includes('老黃曆') };
  }

  function solarFromLunar(query) {
    const signedMonth = document.getElementById('lunar-leap').checked ? -Math.abs(query.month) : query.month;
    const lunar = Lunar.fromYmdHms(query.year, signedMonth, query.day, query.hour, query.minute, 0);
    return lunar.getSolar();
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
    document.querySelectorAll('.tab').forEach((button) => { const active = button.dataset.go === id; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
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
    $('lunar-form').addEventListener('submit', (event) => { event.preventDefault(); if (!lunarLoaded()) return announce('農曆資料套件尚未載入，請確認網路連線後重新整理。'); const [hour, minute] = $('lunar-time').value.split(':').map(Number); const yearInput = Number($('lunar-year').value); const query = { year: $('lunar-roc').checked ? yearInput + 1911 : yearInput, month: Number($('lunar-month').value), day: Number($('lunar-day').value), hour, minute }; try { showLookupResult(renderDay(makeDay(solarFromLunar(query)))); } catch (error) { announce('無法轉換這個農曆日期，請檢查日期或閏月設定。'); } });
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
    const spokenResults = shown.slice(0, 5).map((day, index) => `第${index + 1}個，${calendar.format(day.date)}，老黃曆宜：${day.yi.join('、')}`).join('。');
    const spokenLead = results.length <= 5 ? '結果如下：' : '先播報前五個：';
    const spokenSummary = `找到 ${results.length} 個符合條件的日期。${spokenLead}${spokenResults}`;
    area.innerHTML = `<p class="sr-only result-summary" tabindex="-1">${escapeHtml(spokenSummary)}</p><h3 class="result-heading" tabindex="-1">找到 ${results.length} 個符合條件的日期，以下顯示前 ${shown.length} 個</h3>` + shown.map((day) => `<article class="result-card" tabindex="0"><h3>${escapeHtml(calendar.format(day.date))}</h3><p><strong>老黃曆宜：</strong>${escapeHtml(day.yi.join('、'))}</p><p><strong>注意：</strong>請依實際需求與專業意見判斷。</p></article>`).join('');
    area.setAttribute('tabindex', '-1');
    area.removeAttribute('aria-label');
    window.setTimeout(() => area.querySelector('.result-summary')?.focus({ preventScroll: false }), 0);
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
        if (voice.pending) {
          const confirmButton = voice.confirm.querySelector('.voice-confirm');
          const readingDelay = Math.max(5000, Math.min(12000, voice.pending.length * 260 + 3000));
          window.setTimeout(() => {
            confirmButton.focus({ preventScroll: false });
          }, readingDelay);
        } else if (!voice.status.textContent.includes('失敗') && !voice.status.textContent.includes('沒有')) voice.status.textContent = '語音輸入已結束';
      };
      try {
        recognition.start();
        recognitionTimer = window.setTimeout(() => { if (recognition) recognition.stop(); }, 20000);
      } catch (_) { clearRecognitionTimer(); voice.status.textContent = '語音輸入目前無法啟動，請重新按一次。'; recognition = null; }
    };
    const addButton = (parent, target, label) => {
      const form = $(parent);
      const area = document.createElement('div');
      area.className = 'voice-area';
      area.innerHTML = `<button type="button" class="secondary-button voice-start" aria-pressed="false">${label}</button><p class="voice-status" role="status" aria-live="polite"></p><p class="voice-transcript" hidden><strong>我聽到的是：</strong> <span></span></p><div class="voice-actions" hidden><button type="button" class="primary-button voice-confirm">對，開始查詢</button></div>`;
      form.prepend(area);
      const voice = { area, form, target, startButton: area.querySelector('.voice-start'), status: area.querySelector('.voice-status'), transcript: area.querySelector('.voice-transcript'), confirm: area.querySelector('.voice-actions'), pending: '', succeeded: false };
      voice.startButton.addEventListener('click', () => start(voice));
      voice.confirm.querySelector('.voice-confirm').addEventListener('click', () => submitVoice(voice));
      return voice;
    };
    const lookupVoice = [addButton('solar-form', 'lookup', '開始語音查詢'), addButton('lunar-form', 'lookup', '開始語音查詢')];
    addButton('good-day-form', 'good-day', '開始語音找好日子');
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
  function fillLookupFromSpeech(text) { const query = parseSpokenDate(text); if (!query) { announce('請說完整日期，例如：國曆 2026 年 7 月 23 日午時。'); return; } document.querySelector(`[data-calendar="${query.lunar ? 'lunar' : 'solar'}"]`).click(); const prefix = query.lunar ? 'lunar' : 'solar'; $(`${prefix}-year`).value = query.inputYear; $(`${prefix}-month`).value = query.month; $(`${prefix}-day`).value = query.day; $(`${prefix}-time`).value = `${String(query.hour).padStart(2, '0')}:${String(query.minute).padStart(2, '0')}`; $(`${prefix}-roc`).checked = query.roc; document.querySelector(query.lunar ? '#lunar-form' : '#solar-form').requestSubmit(); }
  function fillGoodDayFromSpeech(text, autoSubmit = true) {
    if (/今年|明年|後年/.test(text)) {
      const monthMatch = text.match(/(\d{1,2}|一|二|三|四|五|六|七|八|九|十|十一|十二)月/);
      if (monthMatch) {
        const names = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
        const month = Number(monthMatch[1]) || names[monthMatch[1]];
        const now = new Date();
        const targetYear = text.includes('明年') ? now.getFullYear() + 1 : text.includes('後年') ? now.getFullYear() + 2 : now.getFullYear();
        const endYear = month === 12 ? targetYear + 1 : targetYear;
        const endMonth = month === 12 ? 1 : month + 1;
        $('range-type').value = 'custom';
        $('custom-range').hidden = false;
        $('custom-start').value = `${targetYear}-${String(month).padStart(2, '0')}-01`;
        $('custom-end').value = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      }
    }
    const found = events.find(([key, label]) => text.includes(label.split(/[／或]/)[0]));
    if (found) $('event-type').value = found[0];
    const weekdayAliases = [
      ['0', ['星期日', '星期天', '週日', '週天', '周日', '周天', '禮拜日', '禮拜天']], ['1', ['星期一', '週一', '周一', '禮拜一']], ['2', ['星期二', '週二', '周二', '禮拜二']],
      ['3', ['星期三', '週三', '周三', '禮拜三']], ['4', ['星期四', '週四', '周四', '禮拜四']], ['5', ['星期五', '週五', '周五', '禮拜五']],
      ['6', ['星期六', '週六', '周六', '禮拜六']]
    ];
    const isWeekend = /週末|周末|星期六日|星期日六|六日/.test(text);
    const requestedWeekdays = isWeekend ? ['5', '6'] : weekdayAliases.filter(([, aliases]) => aliases.some((alias) => text.includes(alias))).map(([value]) => value);
    if (requestedWeekdays.length) document.querySelectorAll('#weekday-options input').forEach((input) => { input.checked = requestedWeekdays.includes(input.value); });
    if (text.includes('上午')) $('period').value = 'morning';
    if (text.includes('下午')) $('period').value = 'afternoon';
    if (autoSubmit) searchGoodDays();
  }

  document.addEventListener('click', (event) => { const button = event.target.closest('[data-go]'); if (button) navigate(button.dataset.go); });
  populate(); initLookup(); initGoodDays(); initMicrophoneSetup(); initVoice();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  let deferred; window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferred = event; $('install-button').hidden = false; $('install-button').onclick = async () => { deferred.prompt(); deferred = null; $('install-button').hidden = true; }; });
  if (!lunarLoaded()) setTimeout(() => announce('農曆套件尚未載入；請確認網路連線後重新整理。'), 300);
})();
