/*
 * ============================================================================
 * 비밀번호 입력 필드 토글 (보기/숨기기)
 * 1) 트리거
 *    - [data-password-toggle] 버튼 클릭
 * 2) 기능
 *    - input type="password" <-> "text" 전환
 *    - aria-label / aria-pressed 상태 동기화
 *    - 아이콘 클래스 토글 (icon--visibility / icon--visibility-off)
 * ============================================================================
 */

(function () {
  'use strict';

  /* ===== 이벤트 바인딩 ===== */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-password-toggle]');
    if (!btn) return;

    // 비밀번호 필드로 범위 제한
    const field = btn.closest('.form-control.form-password');
    if (!field) return;

    const input = field.querySelector('input.form-input');
    if (!input) return;
    if (input.disabled || input.readOnly) return;

    const icon = btn.querySelector('.icon20');

    /* ===== 토글 로직 ===== */
    const isHidden = (input.type === 'password');

    if (isHidden) {
      // 1) 보이게 전환
      input.type = 'text';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', '비밀번호 숨김');

      if (icon) {
        icon.classList.remove('icon--visibility');
        icon.classList.add('icon--visibility-off');
      }
    } else {
      // 2) 숨기기로 전환
      input.type = 'password';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', '비밀번호 표시');

      if (icon) {
        icon.classList.remove('icon--visibility-off');
        icon.classList.add('icon--visibility');
      }
    }
  });
})();
