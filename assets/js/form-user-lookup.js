/*
 * ============================================================================
 * 사용자 조회 UI 목업
 * 1) 트리거
 *    - #btn-lookup 클릭 → 결과 리스트 토글
 * 2) 기능
 *    - 목업 리스트 렌더 (하드코딩 데이터)
 *    - 항목 선택 시:
 *      · #lookup-key 값에 userId 세팅
 *      · #user-name / #user-org / #user-dept 값 세팅 (화면 확인용 샘플)
 *      · 리스트 닫기
 *    - 바깥 클릭 / ESC 시 리스트 닫기
 * 3) 비고
 *    - UI 인터랙션 확인용 퍼블 목업
 * ============================================================================
 */

(function () {
  'use strict';

  var d = document;

  var input = d.getElementById('lookup-key');
  var btn = d.getElementById('btn-lookup');
  var list = d.getElementById('lookup-list');
  var combo = d.querySelector('[data-combo]');

  var outName = d.getElementById('user-name');
  var outOrg = d.getElementById('user-org');
  var outDept = d.getElementById('user-dept');

  if (!input || !btn || !list || !combo) return;

  // 퍼블 산출용 목업 데이터 (필요하면 텍스트만 바꿔서 사용)
  var MOCK_USERS = [
    { birth: '700123', name: '김경기', userId: '1234asedwqt', org: 'AI국', dept: 'AI데이터행정과' },
    { birth: '700123', name: '홍길동', userId: 'gfdgfh456', org: 'AI국', dept: 'AI데이터행정과' },
    { birth: '700123', name: '이수원', userId: 'nbbddd11', org: 'AI국', dept: 'AI데이터행정과' }
  ];

  function setOpen(isOpen) {
    // aria 상태
    input.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // 리스트 노출
    list.hidden = !isOpen;

    // CSS용 상태 클래스(.form-control.is-combo.is-open 기준으로 radius/테두리 제어)
    combo.classList.toggle('is-open', !!isOpen);
  }

  function isOpen() {
    return input.getAttribute('aria-expanded') === 'true';
  }

  function closeList() {
    setOpen(false);
  }

  function toggleList() {
    setOpen(!isOpen());
  }

  function renderList(items) {
    // 기존 항목 제거
    list.innerHTML = '';

    items.forEach(function (item) {
      var opt = d.createElement('button');
      opt.type = 'button';
      opt.className = 'suggestion-item';
      opt.setAttribute('role', 'option');

      // 선택 시 사용할 데이터
      opt.setAttribute('data-user-id', item.userId);
      opt.setAttribute('data-user-name', item.name);
      opt.setAttribute('data-user-org', item.org || '');
      opt.setAttribute('data-user-dept', item.dept || '');

      // 표시: 생년월일 / 유저명 / 아이디
      opt.textContent = item.birth + ' / ' + item.name + ' / ' + item.userId;

      list.appendChild(opt);
    });
  }

  function applySelection(targetBtn) {
    var userId = targetBtn.getAttribute('data-user-id') || '';
    var userName = targetBtn.getAttribute('data-user-name') || '';
    var userOrg = targetBtn.getAttribute('data-user-org') || '';
    var userDept = targetBtn.getAttribute('data-user-dept') || '';

    // 요구사항: 선택 시 인풋에 아이디 입력
    input.value = userId;

    // 아래 3개 자동 입력(퍼블 껍데기지만 화면 확인용으로만 세팅)
    if (outName) outName.value = userName;
    if (outOrg) outOrg.value = userOrg;
    if (outDept) outDept.value = userDept;

    closeList();
  }

  // 초기: 목업 리스트 한 번 렌더(버튼 누르면 바로 보이도록)
  renderList(MOCK_USERS);

  /* ===== 이벤트 바인딩 ===== */

  // 조회 버튼: 토글
  btn.addEventListener('click', function () {
    toggleList();
  });

  // 리스트 클릭: 선택
  list.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('suggestion-item')) {
      applySelection(t);
    }
  });

  // ESC 닫기 (input 포커스 상태에서)
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeList();
    }
  });

  // 바깥 클릭 시 닫기
  d.addEventListener('pointerdown', function (e) {
    // combo(입력/버튼 영역) + list 내부 클릭은 유지
    // (list가 combo 안으로 들어간 구조라면 combo.contains만으로도 충분함)
    if (combo.contains(e.target) || list.contains(e.target)) return;
    closeList();
  });
})();
