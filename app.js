(() => {
  const STORAGE_KEY = "my-universe-content-v1";
  const EDITABLE_SELECTOR = ".editable[data-key]";
  const editButton = document.querySelector("#edit-toggle");
  const closeButton = document.querySelector("#close-editor");
  const panel = document.querySelector("#editor-panel");
  const exportButton = document.querySelector("#export-data");
  const importInput = document.querySelector("#import-data");
  const resetButton = document.querySelector("#reset-data");
  const toast = document.querySelector("#toast");
  const editables = [...document.querySelectorAll(EDITABLE_SELECTOR)];
  const ideaFilters = [...document.querySelectorAll(".idea-filter")];
  const gameIdeas = [...document.querySelectorAll(".game-idea[data-category]")];
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  };

  const readData = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const writeData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const savedAt = new Date().toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    localStorage.setItem(`${STORAGE_KEY}-saved-at`, savedAt);
    document.querySelector("#last-saved").textContent = savedAt;
  };

  const hydrate = (data) => {
    editables.forEach((element) => {
      const value = data[element.dataset.key];
      if (typeof value === "string") element.innerText = value;
    });
  };

  const collect = () => Object.fromEntries(editables.map((element) => [element.dataset.key, element.innerText]));

  const setEditing = (enabled) => {
    document.body.classList.toggle("editing", enabled);
    editButton.setAttribute("aria-pressed", String(enabled));
    panel.classList.toggle("open", enabled);
    panel.setAttribute("aria-hidden", String(!enabled));
    editables.forEach((element) => element.setAttribute("contenteditable", String(enabled)));
    editButton.innerHTML = enabled ? '<span aria-hidden="true">✓</span> 完成' : '<span aria-hidden="true">✎</span> 编辑';
    if (!enabled) writeData(collect());
  };

  editButton.addEventListener("click", () => setEditing(!document.body.classList.contains("editing")));
  closeButton.addEventListener("click", () => {
    setEditing(false);
    showToast("内容已保存到当前浏览器");
  });
  editables.forEach((element) => {
    element.addEventListener("input", () => writeData(collect()));
    element.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    });
  });

  exportButton.addEventListener("click", () => {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), content: collect() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-universe-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("备份已导出");
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const content = parsed.content || parsed;
      if (!content || typeof content !== "object") throw new Error("invalid");
      hydrate(content);
      writeData(collect());
      showToast("备份已导入");
    } catch {
      showToast("无法读取这个备份文件");
    } finally {
      importInput.value = "";
    }
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("确定清除当前浏览器里保存的全部修改吗？")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-saved-at`);
    window.location.reload();
  });

  ideaFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      ideaFilters.forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      gameIdeas.forEach((idea) => {
        idea.hidden = category !== "all" && idea.dataset.category !== category;
      });
    });
  });

  hydrate(readData());
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#last-saved").textContent = localStorage.getItem(`${STORAGE_KEY}-saved-at`) || "尚未编辑";
})();
