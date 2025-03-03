import { MarkdownPostProcessorContext, App } from 'obsidian';

export function registerCalloutButton(el: HTMLElement, ctx: MarkdownPostProcessorContext, app: App) {
  el.querySelectorAll("div.callout-title").forEach(callout => {
    const toggleCollapse = async (e: Event) => {
      e.stopPropagation();
      e.preventDefault();

      const file = app.workspace.getActiveFile();
      if (!file) return;

      const content = await app.vault.read(file);
      const lines = content.split("\n");

      // // Obtener el título del callout para buscar la línea exacta
      // const calloutTitle = callout.querySelector(".callout-title-inner").textContent.trim();
      // let updatedLines = lines.map(line => {
      //   if (!line.startsWith("> [")) return line;
      //   if (!line.trim().endsWith(calloutTitle)) return line;
      //   if (!line.match(/(\[![^\]]+\])([+-])/)) return line;
      //   return line.replace(/(\[![^\]]+\])([+-])/, (match, prefix, collapse) => {
      //     return `${prefix}${collapse === '-' ? '+' : '-'}`;
      //   });
      // });
      // await app.vault.modify(file, updatedLines.join("\n"));

      // Obtener información de la sección del callout
      const sectionInfo = ctx.getSectionInfo(callout as HTMLElement);
      if (!sectionInfo) return;
      const lineNumber = sectionInfo.lineStart;

      //console.log(lineNumber);
      //console.log(lines[lineNumber]);

      // Check if match title.
      const calloutTitle = callout.querySelector(".callout-title-inner");
      if (!calloutTitle) return;

      const title = calloutTitle.textContent.trim();

      if (!lines[lineNumber].endsWith(title)) return;

      lines[lineNumber] = lines[lineNumber].replace(/(\[![^\]]+\])([+-])/, (match: any, prefix: any, collapse: any) => {
        return `${prefix}${collapse === '-' ? '+' : '-'}`;
      });

      await app.vault.modify(file, lines.join("\n"));
    };

    callout.addEventListener("click", toggleCollapse);
    //callout.addEventListener("mousedown", (event) => {
    //  if (event.button === 0) toggleCollapse(event); // Solo clic izquierdo en desktop
    //});

    //let longPressTimer = null;
    //callout.addEventListener("touchstart", (event) => {
    //  longPressTimer = setTimeout(() => toggleCollapse(event), 500); // Activa tras 500ms
    //});

    //callout.addEventListener("touchend", () => {
    //  clearTimeout(longPressTimer); // Cancela si se suelta antes de 500ms
    //});

    //callout.addEventListener("touchmove", () => {
    //  clearTimeout(longPressTimer); // Cancela si el usuario mueve el dedo
    //});
  });
};


