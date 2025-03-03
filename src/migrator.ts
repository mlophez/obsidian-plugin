import { MarkdownPostProcessorContext, App, Notice } from 'obsidian';

export function migrateTasks(el: HTMLElement, ctx: MarkdownPostProcessorContext, app: App) {
  el.querySelectorAll(".task-list-item").forEach((taskItem) => {
    console.log(taskItem);

    // COPY
    const buttonContainer = document.createElement("span");
    buttonContainer.style.marginLeft = "10px";
    const copyLink = document.createElement("a");
    copyLink.textContent = "<COPY>"// Texto del enlace
    copyLink.href = "#";  // Evita que haga navegación
    copyLink.style.fontSize = "10px";  // Tamaño de fuente pequeño
    copyLink.style.textDecoration = "none";  // Quitar subrayado
    copyLink.style.color = "red";  // Hacerlo más discreto

    copyLink.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const file = app.workspace.getActiveFile();
      if (!file) return;

      const content = await app.vault.read(file);
      const lines = content.split("\n");

      const sectionInfo = ctx.getSectionInfo(taskItem as HTMLElement);
      if (!sectionInfo) return;
      const lineNumber = sectionInfo.lineStart;

      console.log(lines[lineNumber]);

      navigator.clipboard.writeText(lines[lineNumber]);
      new Notice("Tarea copiada.");
    };
    buttonContainer.appendChild(copyLink);
    taskItem.appendChild(buttonContainer);

    // PASTE
    const paste = document.createElement("span");
    paste.style.marginLeft = "10px";
    const pasteLink = document.createElement("a");
    pasteLink.textContent = "<PASTE>"// Texto del enlace
    pasteLink.href = "#";  // Evita que haga navegación
    pasteLink.style.fontSize = "10px";  // Tamaño de fuente pequeño
    pasteLink.style.textDecoration = "none";  // Quitar subrayado
    pasteLink.style.color = "red";  // Hacerlo más discreto
    pasteLink.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const file = app.workspace.getActiveFile();
      if (!file) return;

      const content = await app.vault.read(file);
      const lines = content.split("\n");

      const sectionInfo = ctx.getSectionInfo(taskItem as HTMLElement);
      if (!sectionInfo) return;
      const lineNumber = sectionInfo.lineStart;

      console.log(lines[lineNumber]);

      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        new Notice("El portapapeles está vacío.");
        return;
      }

      lines.splice(lineNumber + 1, 0, clipboardText);
      await app.vault.modify(file, lines.join("\n"));

      new Notice("Tarea pegada.");
    };
    paste.appendChild(pasteLink);
    taskItem.appendChild(paste);
  });
}
