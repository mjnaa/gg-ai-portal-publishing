/*
 * ============================================================================
 * 멀티 파일 업로더
 * 1) 트리거
 *    - [data-file-uploader-multi]
 * 2) 구성 요소
 *    - input: [data-form-file-input] (multiple)
 *    - 드롭존: [data-form-file-drop]
 *    - 리스트 드롭존: [data-form-file-list-drop] (리스트 상태에서도 드롭으로 추가)
 *    - 리스트: [data-form-file-list]
 *    - 버튼: [data-form-file-browse] [data-form-file-remove-selected] [data-form-file-submit]
 * 3) 상태 클래스
 *    - is-filled: 파일 1개 이상 (드롭존 숨김/리스트 노출)
 *    - is-dragover: 드래그 오버 강조
 * 4) 범위
 *    - UI 전용(추가/삭제/체크/렌더)
 *    - 서버 전송은 하지 않음(Submit 시 커스텀 이벤트만 발생)
 * ============================================================================
 */

(function () {
  "use strict";

  var ROOT_SELECTOR = "[data-file-uploader-multi]";

  function bytesToText(bytes) {
    if (!Number.isFinite(bytes)) return "";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0;
    var v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v = v / 1024;
      i++;
    }
    return (i === 0 ? v : v.toFixed(1)) + " " + units[i];
  }

  function fileKey(file) {
    // 동일 파일 중복 식별용
    return [file.name, file.size, file.lastModified].join("__");
  }

  function initMultiUploader(root) {
    var input = root.querySelector("[data-form-file-input]");
    var listEl = root.querySelector("[data-form-file-list]");
    var dropLabel = root.querySelector("[data-form-file-drop]");
    var listDrop = root.querySelector("[data-form-file-list-drop]");
    var btnBrowse = root.querySelector("[data-form-file-browse]");
    var btnRemoveSelected = root.querySelector("[data-form-file-remove-selected]");
    var btnSubmit = root.querySelector("[data-form-file-submit]");

    if (!input || !listEl) return;

    // 내부 상태(선택된 파일들)
    var filesMap = new Map(); // key -> File

    /* ===== UI 갱신 ===== */
    function updateUI() {
      var hasFiles = filesMap.size > 0;
      root.classList.toggle("is-filled", hasFiles);

    }

    function hasAnyChecked() {
      var checks = listEl.querySelectorAll('[data-form-file-check]');
      for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) return true;
      }
      return false;
    }

    /* ===== 리스트 렌더 ===== */
    function renderList() {
      // 간단 렌더: 전체 재그리기
      listEl.innerHTML = "";

      filesMap.forEach(function (file) {
        var li = document.createElement("li");
        li.className = "form-file-row";
        li.setAttribute("data-form-file-row", "");
        li.dataset.key = fileKey(file);

        // 체크 + 아이콘 + 이름 + 삭제 버튼
        li.innerHTML =
          '' +
          '<label class="form-checkbox-label form-file-check">' +
          '  <input type="checkbox" class="form-checkbox" data-form-file-check checked>' +
          '  <span class="form-check-label visually-hidden">문서 선택</span>' +
          '</label>' +
          '<span class="form-file-icon" aria-hidden="true">' +
          '  <span class="icon24 icon--docs icon--basic"></span>' +
          "</span>" +
          '<p class="form-file-name" title="' + escapeHtml(file.name) + '">' +
            escapeHtml(file.name) +
          '</p>' +
          '<button type="button" class="form-file-remove" aria-label="첨부 문서 삭제" data-form-file-remove>' +
          '  <span class="icon20 icon--close icon--basic"></span>' +
          '</button>';

        listEl.appendChild(li);
      });

      updateUI();
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    /* ===== 파일 추가 ===== */
    function addFiles(fileList) {
      if (!fileList || !fileList.length) return;

      for (var i = 0; i < fileList.length; i++) {
        var f = fileList[i];
        filesMap.set(fileKey(f), f);
      }

      renderList();

      input.value = "";
    }

    /* ===== 파일 삭제 ===== */
    function removeByKey(key) {
      filesMap.delete(key);
      renderList();
    }

    function removeSelected() {
      var rows = listEl.querySelectorAll("[data-form-file-row]");
      rows.forEach(function (row) {
        var check = row.querySelector("[data-form-file-check]");
        if (check && check.checked) {
          filesMap.delete(row.dataset.key);
        }
      });
      renderList();
    }

    /* ===== 드래그 앤 드랍 ===== */
    function setDragOver(isOver) {
      root.classList.toggle("is-dragover", isOver);
    }

    function onDragOver(e) {
      e.preventDefault();
      setDragOver(true);
    }

    function onDragLeave(e) {
      setDragOver(false);
    }

    function onDrop(e) {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer && e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    }

    /* ===== 이벤트 바인딩 ===== */

    // 파일 선택
    input.addEventListener("change", function () {
      addFiles(input.files);
    });

    // 드롭존/리스트 드롭존 모두 drop 허용
    if (dropLabel) {
      dropLabel.addEventListener("dragover", onDragOver);
      dropLabel.addEventListener("dragleave", onDragLeave);
      dropLabel.addEventListener("drop", onDrop);
    }
    if (listDrop) {
      listDrop.addEventListener("dragover", onDragOver);
      listDrop.addEventListener("dragleave", onDragLeave);
      listDrop.addEventListener("drop", onDrop);
    }

    // 문서 찾기 버튼 -> input 클릭
    if (btnBrowse) {
      btnBrowse.addEventListener("click", function () {
        input.click();
      });
    }

    // 리스트 내부 클릭(삭제/체크 변경)
    listEl.addEventListener("click", function (e) {
      var removeBtn = e.target.closest("[data-form-file-remove]");
      if (removeBtn) {
        var row = removeBtn.closest("[data-form-file-row]");
        if (row && row.dataset.key) removeByKey(row.dataset.key);
        return;
      }
    });

    listEl.addEventListener("change", function (e) {
      if (e.target && e.target.matches("[data-form-file-check]")) {
        updateUI();
      }
    });

    // 체크된 문서 삭제
    if (btnRemoveSelected) {
      btnRemoveSelected.addEventListener("click", function () {
        removeSelected();
      });
    }

    // 문서 전송(실제 업로드 X → 이벤트만)
    if (btnSubmit) {
      btnSubmit.addEventListener("click", function () {
        var files = Array.from(filesMap.values());

        // 상단 select 메타도 함께 전달
        var meta = {
          targetService: root.querySelector("#upload-target-service")?.value || "",
          docType: root.querySelector("#upload-doc-type")?.value || "",
        };

        root.dispatchEvent(
          new CustomEvent("fileuploader:submit", {
            bubbles: true,
            detail: { files: files, meta: meta },
          })
        );
      });
    }

    // 초기 렌더
    updateUI();
  }

  function initAll() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(initMultiUploader);
  }

  // DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
