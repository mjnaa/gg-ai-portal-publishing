/*
 * ============================================================================
 * 공통 날짜 선택기
 * 1) 트리거
 *    - .date-field 내의 input[type="text"] 및 .date-field-icon
 * 2) 기능
 *    - UI 제어: 화면 여백을 감지하여 달력 위치(상/하) 자동 조정
 *    - 외부 클릭 및 스크롤 시 닫기 처리
 *    - 단일 날짜 선택(Single) 및 기간(Range) 선택 기능
 * 3) 옵션 (Data Attributes)
 *    - data-mode="single" : 단일 선택 모드 (기본값)
 *    - data-mode="range" : 기간 선택 모드
 * 4) UX 최적화
 *    - 시작일과 종료일이 동일하게 선택된 경우 '원형' UI 적용
 *    - ESC 키를 통한 달력 닫기 및 포커스 복구 지원
 * ============================================================================
 */

(function () {
  'use strict';

  /* ===== 설정 및 상태 ===== */
  var SELECTORS = {
    WRAPPER: '.date-field',
    INPUT: 'input[type="text"]',
    TRIGGER: '.date-field-icon'
  };

  var CALENDAR_ID = 'common-datepicker';
  var CALENDAR_TITLE_ID = 'common-datepicker-title';

  var activeInput = null;
  var calendarEl = null;
  var rangeStart = null;
  var rangeEnd = null;
  var isRangeMode = false;
  var isGlobalBound = false;

  /* ===== 1. 날짜 유틸리티 ===== */
  function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + d;
  }

  function parseDate(str) {
    if (!str) return null;
    var parts = str.trim().split('.').map(Number);
    if (parts.length !== 3) return null;

    var y = parts[0], m = parts[1], d = parts[2];
    var date = new Date(y, m - 1, d);

    if (date.getFullYear() !== y || date.getMonth() !== (m - 1) || date.getDate() !== d) return null;

    date.setHours(0, 0, 0, 0);
    return date;
  }

  function normalizeDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* ===== 2. 달력 UI 생성 ===== */
  function createCalendarMarkup() {
    if (document.getElementById(CALENDAR_ID)) {
      calendarEl = document.getElementById(CALENDAR_ID);
      return;
    }

    var html = 
      '<div id="' + CALENDAR_ID + '" class="calendar-popup" role="dialog" aria-modal="false" aria-labelledby="' + CALENDAR_TITLE_ID + '" hidden>' +
      '  <div class="calendar-header">' +
      '    <div class="cal-nav-group">' +
      '      <button type="button" class="cal-nav-btn btn-cal-prev-year" aria-label="이전 연도"><span class="icon24 icon--double-arrow-left icon--basic"></span></button>' +
      '      <button type="button" class="cal-nav-btn btn-cal-prev" aria-label="이전 달"><span class="icon24 icon--arrow-left icon--basic"></span></button>' +
      '    </div>' +
      '    <strong id="' + CALENDAR_TITLE_ID + '" class="current-ym" aria-live="polite"></strong>' +
      '    <div class="cal-nav-group">' +
      '      <button type="button" class="cal-nav-btn btn-cal-next" aria-label="다음 달"><span class="icon24 icon--arrow-right icon--basic"></span></button>' +
      '      <button type="button" class="cal-nav-btn btn-cal-next-year" aria-label="다음 연도"><span class="icon24 icon--double-arrow-right icon--basic"></span></button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="calendar-body">' +
      '    <div class="weekdays" aria-hidden="true">' +
      '      <span title="일요일">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span title="토요일">토</span>' +
      '    </div>' +
      '    <div class="days"></div>' +
      '  </div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    calendarEl = document.getElementById(CALENDAR_ID);
    calendarEl.addEventListener('click', handleCalendarClick);
  }

  /* ===== 3. 렌더링 로직 ===== */
  function renderCalendar(year, month) {
    var $days = calendarEl.querySelector('.days');
    var $title = calendarEl.querySelector('.current-ym');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    $title.textContent = year + '년 ' + (month + 1) + '월';
    $title.dataset.year = String(year);
    $title.dataset.month = String(month);

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startDayOfWeek = firstDay.getDay();
    var totalDays = lastDay.getDate();

    var html = '';
    for (var i = 0; i < startDayOfWeek; i++) {
      html += '<span class="day empty" aria-hidden="true"></span>';
    }

    for (var d = 1; d <= totalDays; d++) {
      var current = new Date(year, month, d);
      current.setHours(0, 0, 0, 0);
      var currentTime = current.getTime();
      var dateStr = formatDate(current);
      var dayOfWeek = current.getDay();
      var classList = ['day'];

      if (isRangeMode) {
        var isStart = rangeStart && currentTime === rangeStart.getTime();
        var isEnd = rangeEnd && currentTime === rangeEnd.getTime();
        if (isStart && isEnd) classList.push('is-selected');
        else if (isStart) classList.push('is-range-start');
        else if (isEnd) classList.push('is-range-end');
        else if (rangeStart && rangeEnd && currentTime > rangeStart.getTime() && currentTime < rangeEnd.getTime()) {
          classList.push('is-in-range');
        }
      } else if (rangeStart && currentTime === rangeStart.getTime()) {
        classList.push('is-selected');
      }

      if (currentTime === today.getTime()) classList.push('is-today');
      if (dayOfWeek === 0) classList.push('is-sunday');
      if (dayOfWeek === 6) classList.push('is-saturday');

      html += '<button type="button" class="' + classList.join(' ') + '" data-date="' + dateStr + '" aria-label="' + year + '년 ' + (month + 1) + '월 ' + d + '일">' + d + '</button>';
    }
    $days.innerHTML = html;
  }

  /* ===== 4. 위치 및 상태 관리 ===== */
  function setPosition(input) {
    var rect = input.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    var viewportHeight = window.innerHeight;
    var viewportWidth = window.innerWidth;
    var calendarHeight = calendarEl.offsetHeight;
    var calendarWidth = calendarEl.offsetWidth;
    var margin = 4;

    var spaceBelow = viewportHeight - rect.bottom;
    var shouldShowTop = (spaceBelow < calendarHeight) && (rect.top > calendarHeight);

    var top = shouldShowTop ? (rect.top + scrollTop - calendarHeight - margin) : (rect.bottom + scrollTop + margin);
    calendarEl.style.top = top + 'px';
    calendarEl.classList.toggle('is-top', shouldShowTop);

    var left = rect.left + scrollLeft;
    var maxLeft = scrollLeft + viewportWidth - calendarWidth - margin;
    left = Math.max(scrollLeft + margin, Math.min(left, maxLeft));
    calendarEl.style.left = left + 'px';
  }

  function openCalendar(input) {
    createCalendarMarkup();
    activeInput = input;
    var wrapper = input.closest(SELECTORS.WRAPPER);
    if (wrapper) wrapper.classList.add('is-focused');

    input.setAttribute('aria-expanded', 'true');

    var val = input.value.trim();
    var mode = input.dataset.mode;
    isRangeMode = (mode === 'range') ? true : (mode === 'single' ? false : val.includes('~'));

    if (isRangeMode) {
      var dates = val.split('~').map(function(s) { return s.trim(); });
      rangeStart = normalizeDate(parseDate(dates[0]));
      rangeEnd = normalizeDate(parseDate(dates[1]));
    } else {
      rangeStart = normalizeDate(parseDate(val));
      rangeEnd = null;
    }

    var viewDate = rangeStart || new Date();
    renderCalendar(viewDate.getFullYear(), viewDate.getMonth());
    calendarEl.hidden = false;

    requestAnimationFrame(function() {
      if (activeInput && calendarEl) setPosition(activeInput);
    });
  }

  function closeCalendar() {
    if (!calendarEl || calendarEl.hidden) return;
    calendarEl.hidden = true;
    if (activeInput) {
      var wrapper = activeInput.closest(SELECTORS.WRAPPER);
      if (wrapper) wrapper.classList.remove('is-focused');
      activeInput.setAttribute('aria-expanded', 'false');
      activeInput = null;
    }
  }

  /* ===== 5. 이벤트 핸들러 ===== */
  function handleCalendarClick(e) {
    var target = e.target.closest('button');
    if (!target) return;

    var title = calendarEl.querySelector('.current-ym');
    var year = parseInt(title.dataset.year, 10);
    var month = parseInt(title.dataset.month, 10);

    if (target.matches('.day')) {
      var selected = normalizeDate(parseDate(target.dataset.date));
      if (!selected || !activeInput) return;

      if (!isRangeMode) {
        activeInput.value = target.dataset.date;
        activeInput.dispatchEvent(new Event('change', { bubbles: true }));
        closeCalendar();
      } else {
        if (!rangeStart || (rangeStart && rangeEnd)) {
          rangeStart = selected;
          rangeEnd = null;
          renderCalendar(year, month);
        } else {
          if (selected < rangeStart) {
            rangeStart = selected;
            renderCalendar(year, month);
          } else {
            rangeEnd = selected;
            activeInput.value = formatDate(rangeStart) + ' ~ ' + formatDate(rangeEnd);
            activeInput.dispatchEvent(new Event('change', { bubbles: true }));
            closeCalendar();
          }
        }
      }
      return;
    }

    if (target.matches('.btn-cal-prev')) month--;
    else if (target.matches('.btn-cal-next')) month++;
    else if (target.matches('.btn-cal-prev-year')) year--;
    else if (target.matches('.btn-cal-next-year')) year++;
    else return;

    if (month < 0) { year--; month = 11; }
    if (month > 11) { year++; month = 0; }
    renderCalendar(year, month);
  }

  function bindGlobalEvents() {
    if (isGlobalBound) return;
    isGlobalBound = true;

    document.addEventListener('click', function (e) {
      var target = e.target.closest(SELECTORS.TRIGGER + ',' + SELECTORS.INPUT);
      if (!target) return;
      var wrapper = target.closest(SELECTORS.WRAPPER);
      var input = wrapper && wrapper.querySelector(SELECTORS.INPUT);
      if (!input) return;

      if (activeInput === input && calendarEl && !calendarEl.hidden) closeCalendar();
      else openCalendar(input);
    });

    document.addEventListener('pointerdown', function (e) {
      if (activeInput && calendarEl && !calendarEl.contains(e.target) && !e.target.closest(SELECTORS.WRAPPER)) closeCalendar();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeInput) {
        var input = activeInput;
        closeCalendar();
        input.focus();
      }
    });

    window.addEventListener('scroll', function() { if (activeInput) closeCalendar(); }, { passive: true });
    window.addEventListener('resize', function() { if (activeInput) setPosition(activeInput); }, { passive: true });
  }

  /* ===== 초기화 ===== */
  bindGlobalEvents();

})();