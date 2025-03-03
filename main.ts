import { MarkdownPostProcessor, Plugin, App, TFile, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';

import { join } from 'path'
import { registerCalloutButton } from 'src/callout';
import { migrateTasks } from 'src/migrator';

export default class AutoFileRename extends Plugin {

  async onload(): Promise<void> {
    /* Add command */
    this.addCommand({
      id: 'format-files',
      name: 'Format All Files',
      callback: () => {
        this.app.vault.getAllLoadedFiles().forEach((file: TFile) => {
          this.renameFile(file);
        })
      },
    });

    this.registerMarkdownPostProcessor((el, ctx) => registerCalloutButton(el, ctx, this.app));
    //this.registerMarkdownPostProcessor((el, ctx) => migrateTasks(el, ctx, this.app));

    /* FILE EVENTS */

    // Triggers when vault is modified such as when editing files.
    // This is what triggers to rename the file
    this.registerEvent(
      this.app.vault.on("modify", (abstractFile) => {
        if (abstractFile instanceof TFile) {
          this.renameFile(abstractFile);
        }
      })
    );

    //this.registerEvent(this.app.vault.on("create", (file: TFile) => {
    //  this.fileFormat(file);
    //}));

    //this.registerEvent(this.app.vault.on("rename", (file: TFile) => {
    //  this.fileFormat(file);
    //}));

    // /* FILE OPEN IN PREVIEW MODE */
    // this.registerEvent(this.app.workspace.on("file-open", () => {
    //   const leaf = this.app.workspace.activeLeaf;
    //   if (!(leaf.view instanceof MarkdownView)) return;

    //   const state = leaf.view.getState();
    //   state.mode = "preview";
    //   leaf.setViewState({ type: leaf.view.getViewType(), state: state })
    // }))

    /* MarkdownPostProcessor */
    // This show the name of link without - and in mayus
    let linkProcessor: MarkdownPostProcessor = async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.findAll('a.internal-link').forEach((e) => {
        let name = this.unnamed(e.innerText);
        e.innerText = name;
      })
    }
    linkProcessor.sortOrder = -100;
    this.registerMarkdownPostProcessor(linkProcessor);

    //this.registerInterval(window.setInterval(() => {
    //	this.app.workspace.containerEl.findAll('div[data-path]').forEach((e) => {
    //		let path = e.getAttr('data-path')
    //		let file = this.app.vault.getAbstractFileByPath(path) as TFile
    //		if (path == '/') return

    //		let name = this.unnamed(path.split('/').reverse()[0])
    //		if (e.find('div.nav-file-title-content') && !e.find('div.is-being-renamed') ) {
    //			e.find('div.nav-file-title-content').innerText = name;
    //		} 

    //		if (e.find('div.nav-folder-title-content') && !e.find('div.is-being-renamed') ) {
    //			e.find('div.nav-folder-title-content').innerText = name;
    //		}

    //		//if ( file.basename != name)
    //		//	file.basename = name;
    //	})
    //}, 500));

    //this.registerCalloutButton();
  }

  onunload() { }

  unnamed(filename: string): string {
    let name = filename
      .replace(/\.md$/g, '')
      .replace(/-/g, ' ')

    //const arr = name.split(" ");
    //for (var i = 0; i < arr.length; i++) {
    //  arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    //}
    //Join all the elements of the array back into a string 
    //using a blankspace as a separator 
    //name = arr.join(" ");

    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    return name
  }

  async fileFormat(file: TFile) {
    let name

    if (file.extension != null) {
      name = file.basename.toLowerCase()
        .replace(/--*/g, '_')
        .replace(/ /g, '_');

      if (name != file.basename)
        this.app.fileManager.renameFile(file, join(file.parent.path, name + '.' + file.extension));
    }

    if (file.extension == null) {
      name = file.name.toLowerCase().replace(/ /g, '_');
      if (name != file.name)
        this.app.fileManager.renameFile(file, join(file.parent.path, name));
    }
  }

  // Function for renaming files
  async renameFile(file: TFile, noDelay = false): Promise<void> {
    // Exclude
    if (!file.path.startsWith("Notes/")) {
      console.log(`El archivo ${file.path} no está en "Notes/", omitiendo.`);
      return;
    }

    // Leer el contenido del archivo
    let content: string = await this.app.vault.cachedRead(file);

    // Buscar el primer encabezado de nivel 1 (# Heading)
    let match = content.match(/^#\s+(.+)/m);
    if (!match) {
      console.warn(`No se encontró un encabezado de nivel 1 en ${file.path}`);
      return;
    }

    let newTitle = match[1].trim();

    // // Obtener los metadatos actuales
    // let metadata = this.app.metadataCache.getFileCache(file);
    // let frontmatter = metadata?.frontmatter || {};

    // // Actualizar alias si es necesario
    // let aliases = frontmatter.aliases || [];
    // if (!Array.isArray(aliases)) {
    //   aliases = [aliases];
    // }
    // if (!aliases.includes(newTitle)) {
    //   aliases.push(newTitle);
    // }

    // // Escribir los nuevos metadatos al archivo
    // let newFrontmatter = `---\n${frontmatter.title ? `title: ${frontmatter.title}\n` : ""}aliases: [${aliases.join(", ")}]\n---\n`;
    // let newContent = content.replace(/^---\n[\s\S]+?\n---\n/m, newFrontmatter) || newFrontmatter + content;

    // await app.vault.modify(file, newContent);

    // Renombrar archivo si es necesario
    let newFileName = this.removeAccents(
      newTitle.toLowerCase()
        .replace(/[\\/:*?"<>|#^\[\];,]/g, '').trim()
        .replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F900}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
        .replace(/\s+/g, "-") + '.md');
    console.log("NewFilename:" + newFileName);
    if (newFileName !== file.name) {
      let newPath = file.path.replace(/[^/]+$/, newFileName);
      await this.app.fileManager.renameFile(file, newPath);
    }
  }

  removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async renameFileBackup(file: TFile, noDelay = false): Promise<void> {
    let content: string = await this.app.vault.cachedRead(file);

    // Supports YAML depending on user preference
    if (content.startsWith("---")) {
      let index = content.indexOf("---", 3); // returns -1 if none
      if (index != -1) content = content.slice(index + 3).trimStart(); // Add 3 to cover "---" || Cleanup white spaces and newlines at start
    }

    // Use the header as filename depending on user preference
    if (content[0] == "#") {
      const headerArr: string[] = [
        "# ",
        "## ",
        "### ",
        "#### ",
        "##### ",
        "###### ",
      ];
      for (let i = 0; i < headerArr.length; i++) {
        if (content.startsWith(headerArr[i])) {
          let index = content.indexOf("\n");
          if (index != -1) content = content.slice(i + 2, index);
          break;
        }
      }
    }

    const illegalChars: string = '\\/:*?"<>|#^[]'; // Characters that should be avoided in filenames
    const illegalNames: string[] = [
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM2",
      "COM3",
      "COM4",
      "COM5",
      "COM6",
      "COM7",
      "COM8",
      "COM9",
      "COM0",
      "LPT1",
      "LPT2",
      "LPT3",
      "LPT4",
      "LPT5",
      "LPT6",
      "LPT7",
      "LPT8",
      "LPT9",
      "LPT0",
    ]; // Special filenames that are illegal in some OSs
    let newFileName: string = "";

    newFileName = newFileName
      .trim() // Trim white spaces
      .replace(/\s+/g, "-"); // Replace consecutive whitespace characters with a space

    // Remove all leading "." to avoid naming issues.
    while (newFileName[0] == ".") {
      newFileName = newFileName.slice(1);
    }
    console.log(newFileName);

    // Change to Untitled if newFileName outputs to nothing, or if it matches any of the illegal names.
    const isIllegalName =
      newFileName === "" ||
      illegalNames.includes(newFileName.toUpperCase());
    if (isIllegalName) newFileName = "Untitled";

    const parentPath =
      file.parent?.path === "/" ? "" : file.parent?.path + "/";

    let newPath: string = `${parentPath}${newFileName}.md`;

    // Rename file and increment renamedFileCount
    await this.app.fileManager.renameFile(file, newPath);
  }
}
