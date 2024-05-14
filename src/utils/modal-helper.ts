import App, { SuggestModal, TFile } from 'obsidian'
import * as PathHelper from 'src/utils/path-helper'

export class FileNameModal extends SuggestModal<string> {
  parentPath: string
  fileExtension: string

  constructor(app: App, parentPath: string, fileExtension: string) {
    super(app)

    this.parentPath = parentPath
    this.fileExtension = fileExtension
  }

  getSuggestions(query: string): string[] {
    const queryWithoutExtension = query.replace(new RegExp(`\\.${this.fileExtension}$`), '')
    if (queryWithoutExtension === '') return []

    const queryWithExtension = queryWithoutExtension + '.' + this.fileExtension
    const suggestions = [`${this.parentPath}/${queryWithExtension}`, queryWithExtension]
      // Filter out suggestions for files that already exist
      .filter(s => this.app.vault.getAbstractFileByPath(s) === null)

    return suggestions
  }

  renderSuggestion(text: string, el: HTMLElement) {
    el.setText(text)
  }

  onChooseSuggestion(_text: string, _evt: MouseEvent | KeyboardEvent) {}

  awaitInput(): Promise<string> {
    return new Promise((resolve, _reject) => {
      this.onChooseSuggestion = (text: string) => { resolve(text) }
      this.open()
    })
  }
}

export class FileSelectModal extends SuggestModal<string> {
  files: string[]
  suggestNewFile: boolean

  constructor(app: App, extensionsRegex?: RegExp, suggestNewFile = false) {
    super(app)

    this.files = this.app.vault.getFiles()
      .map(file => file.path)
      .filter(path => PathHelper.extension(path)?.match(extensionsRegex ?? /.*/))
    this.suggestNewFile = suggestNewFile

    this.setPlaceholder('Type to search...')
    this.setInstructions([{
        command: '↑↓',
        purpose: 'to navigate'
    }, {
        command: '↵',
        purpose: 'to open'
    }, {
        command: 'shift ↵',
        purpose: 'to create'
    }, {
        command: 'esc',
        purpose: 'to dismiss'
    }])

    this.scope.register(['Shift'], 'Enter', ((e) => {
      this.onChooseSuggestion(this.inputEl.value, e)
      this.close()
    }))
  }

  getSuggestions(query: string): string[] {
    const suggestions = this.files.filter(path => path.toLowerCase().includes(query.toLowerCase()))
    if (suggestions.length === 0 && this.suggestNewFile) suggestions.push(query)

    return suggestions
  }

  renderSuggestion(path: string, el: HTMLElement) {
    const simplifiedPath = path.replace(/\.md$/, '')
    el.setText(simplifiedPath)
  }

  onChooseSuggestion(_path: string, _evt: MouseEvent | KeyboardEvent) {}

  awaitInput(): Promise<TFile> {
    return new Promise((resolve, _reject) => {
      this.onChooseSuggestion = (path: string, _evt: MouseEvent | KeyboardEvent) => {
        const file = this.app.vault.getAbstractFileByPath(path)

        if (file instanceof TFile) {
          resolve(file)
          return
        }

        if (!this.suggestNewFile) return

        if (PathHelper.extension(path) === undefined) path += '.md'
        const newFile = this.app.vault.create(path, '')
        resolve(newFile)
      }

      this.open()
    })
  }
}

export class TagSelectModal extends SuggestModal<string> {
  tags: string[]

  constructor(app: App) {
    super(app)

	this.tags = Object.entries(this.app.metadataCache.getTags()).sort((a, b) => b[1] - a[1]).map(([tag, count]) => tag)

    this.setPlaceholder('Type to search...')
    this.setInstructions([{
        command: '↑↓',
        purpose: 'to navigate'
    }, {
        command: '↵',
        purpose: 'to open'
    }, {
        command: 'esc',
        purpose: 'to dismiss'
    }])
  }

  getSuggestions(query: string): string[] {
    return this.tags.filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
  }

  renderSuggestion(path: string, el: HTMLElement) {
    const simplifiedPath = path.replace(/\.md$/, '')
    el.setText(simplifiedPath)
  }

  onChooseSuggestion(_path: string, _evt: MouseEvent | KeyboardEvent) {}

  awaitInput(): Promise<TFile[]> {
    return new Promise((resolve, _reject) => {
      this.onChooseSuggestion = (tag: string, _evt: MouseEvent | KeyboardEvent) => {
		const _tag = tag.slice(1)
		const filepaths = (this.app.metadataCache as any).getCachedFiles() as string[]
		  const matchedFiles = filepaths.map(path => ({ path, ...this.app.metadataCache.getCache(path) })).filter(v => {
			const tagsInFiles = v.tags?.map(t => t.tag.slice(1)) || []
			const frontmatterTags = v.frontmatter?.tags || []
			const tags = [...tagsInFiles, ...frontmatterTags]
			return tags.includes(_tag)
		})
		const files = matchedFiles.map(v => this.app.vault.getAbstractFileByPath(v.path)).filter((v): v is TFile => v !== null)
		return resolve(files)
      }
      this.open()
    })
  }
}
