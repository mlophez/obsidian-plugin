import {
	MarkdownPostProcessor,
	Plugin,
	TFile,
	MarkdownPostProcessorContext,
    MarkdownView
} from 'obsidian';
import { join } from 'path'

export default class MyPlugin extends Plugin {
	public async onload() {
		this.addCommand({
			id: 'format-files',
			name: 'Format Files',
			callback: () => {
				this.app.vault.getAllLoadedFiles().forEach((file: TFile) =>{
					this.fileFormat(file);
				})
			},
		});

		/* FILE EVENTS */
		this.registerEvent(this.app.vault.on("create", (file: TFile) =>{
			this.fileFormat(file);
		}));

		this.registerEvent(this.app.vault.on("rename", (file: TFile) => {
			this.fileFormat(file);
		}));

        /* FILE OPEN IN PREVIEW MODE */
        this.registerEvent(this.app.workspace.on("file-open", () => {
		    const leaf = this.app.workspace.activeLeaf;
		    if(!(leaf.view instanceof MarkdownView)) return;
		    
		    const state = leaf.view.getState();
		    state.mode = "preview";
		    leaf.setViewState({type: leaf.view.getViewType(), state: state})
        }))

        /* MarkdownPostProcessor */
		let linkProcessor : MarkdownPostProcessor = async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
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
	}

	onunload() {}

	unnamed(filename : string) : string {
		let name = filename
					.replace(/\.md$/g, '')
					.replace(/-/g, ' ')

		const arr = name.split(" ");
		for (var i = 0; i < arr.length; i++) {
			arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
		}
		
		//Join all the elements of the array back into a string 
		//using a blankspace as a separator 
		name = arr.join(" ");

		return name
	}

	async fileFormat(file : TFile) {
		let name

		if (file.extension != null) {
			name = file.basename.toLowerCase()
			.replace(/--*/g, '-')
			.replace(/ /g, '-');

			if (name != file.basename)
				this.app.fileManager.renameFile(file, join(file.parent.path, name + '.' + file.extension) );
		}

		if (file.extension == null) {
			name = file.name.toLowerCase().replace(/ /g, '-');
			if (name != file.name)
				this.app.fileManager.renameFile(file, join(file.parent.path, name) );
		}
	}
}
