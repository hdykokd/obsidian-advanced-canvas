import { PluginSettingTab, Setting } from "obsidian"
import AdvancedCanvasPlugin from "./main"

const SLIDE_SIZE_OPTIONS: { [key: string]: string } = {
  '1200x675': '16:9',
  '1350x900': '3:2',
}

export interface AdvancedCanvasPluginSettings {
  shapesFeatureEnabled: boolean

  betterReadonlyEnabled: boolean
  disableNodeInteraction: boolean
  disableNodePopup: boolean
  disableZoom: boolean
  disablePan: boolean

  presentationFeatureEnabled: boolean
  defaultSlideSize: string
  useArrowKeysToChangeSlides: boolean
  zoomToSlideWithoutPadding: boolean
  slideTransitionAnimationDuration: number
  slideTransitionAnimationIntensity: number
}

export const DEFAULT_SETTINGS: Partial<AdvancedCanvasPluginSettings> = {
  shapesFeatureEnabled: true,

  betterReadonlyEnabled: true,
  disableNodeInteraction: false,
  disableNodePopup: false,
  disableZoom: false,
  disablePan: false,

  presentationFeatureEnabled: true,
  defaultSlideSize: Object.values(SLIDE_SIZE_OPTIONS).first(),
  useArrowKeysToChangeSlides: true,
  zoomToSlideWithoutPadding: true,
  slideTransitionAnimationDuration: 0.5,
  slideTransitionAnimationIntensity: 1.25,
}

export default class AdvancedCanvasSettingsManager {
  private plugin: AdvancedCanvasPlugin
  private settings: AdvancedCanvasPluginSettings
  private settingsTab: AdvancedCanvasPluginSettingTab

  constructor(plugin: AdvancedCanvasPlugin) {
    this.plugin = plugin
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData())
  }

  async saveSettings() {
    await this.plugin.saveData(this.settings)
  }

  getSetting<T extends keyof AdvancedCanvasPluginSettings>(key: T): AdvancedCanvasPluginSettings[T] {
    return this.settings[key]
  }

  async setSetting(data: Partial<AdvancedCanvasPluginSettings>) {
    this.settings = Object.assign(this.settings, data)
    await this.saveSettings()
  }

  addSettingsTab() {
    this.settingsTab = new AdvancedCanvasPluginSettingTab(this.plugin, this)
    this.plugin.addSettingTab(this.settingsTab)
  }
}

export class AdvancedCanvasPluginSettingTab extends PluginSettingTab {
  settingsManager: AdvancedCanvasSettingsManager

  constructor(plugin: AdvancedCanvasPlugin, settingsManager: AdvancedCanvasSettingsManager) {
    super(plugin.app, plugin)
    this.settingsManager = settingsManager
  }

  display(): void {
    let { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h1', { cls: 'main-header', text: 'Advanced Canvas' })

    new Setting(containerEl)
      .setHeading()
      .setName("Shapes")
      .setDesc("Shape your nodes for creating e.g. mind maps or flow charts.")
      .addToggle((toggle) =>
        toggle
          .setTooltip("Requires a reload to take effect.")
          .setValue(this.settingsManager.getSetting('shapesFeatureEnabled'))
          .onChange(async (value) => await this.settingsManager.setSetting({ shapesFeatureEnabled: value }))
      )

    new Setting(containerEl)
      .setHeading()
      .setName("Better readonly")
      .setDesc("Improve the readonly mode.") 
      .addToggle((toggle) =>
        toggle
          .setTooltip("Requires a reload to take effect.")
          .setValue(this.settingsManager.getSetting('betterReadonlyEnabled'))
          .onChange(async (value) => await this.settingsManager.setSetting({ betterReadonlyEnabled: value }))
      )

    /* Would require a solution to sync the settings with the canvas */
    /*new Setting(containerEl)
      .setName("Disable node interaction")
      .setDesc("When enabled, you can't interact with the nodes when in readonly mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.settings.disableNodeInteraction)
          .onChange(async (value) => await this.settingsManager.setSetting({ disableNodeInteraction: value }))
      )

    new Setting(containerEl)
      .setName("Disable node popup menu")
      .setDesc("When enabled, the node popup menu won't show when in readonly mode. (If node interation is disabled, this setting has no effect.)")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.settings.disableNodePopup)
          .onChange(async (value) => await this.settingsManager.setSetting({ disableNodePopup: value }))
      )

    new Setting(containerEl)
      .setName("Disable zoom")
      .setDesc("When enabled, you can't zoom when in readonly mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.settings.disableZoom)
          .onChange(async (value) => await this.settingsManager.setSetting({ disableZoom: value }))
      )

    new Setting(containerEl)
      .setName("Disable pan")
      .setDesc("When enabled, you can't pan when in readonly mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.settings.disablePan)
          .onChange(async (value) => await this.settingsManager.setSetting({ disablePan: value }))
      )*/

    new Setting(containerEl)
      .setHeading()
      .setName("Presentations")
      .setDesc("Create a presentation from your canvas.")
      .addToggle((toggle) =>
        toggle
          .setTooltip("Requires a reload to take effect.")
          .setValue(this.settingsManager.getSetting('presentationFeatureEnabled'))
          .onChange(async (value) => await this.settingsManager.setSetting({ presentationFeatureEnabled: value }))
      )

    new Setting(containerEl)
      .setName("Default slize ratio")
      .setDesc("The default ratio of the slide.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(SLIDE_SIZE_OPTIONS)
          .setValue(this.settingsManager.getSetting('defaultSlideSize'))
          .onChange(async (value) => await this.settingsManager.setSetting({ defaultSlideSize: value }))
        )

    new Setting(containerEl)
      .setName("Use arrow keys to change slides")
      .setDesc("When enabled, you can use the arrow keys to change slides in presentation mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.getSetting('useArrowKeysToChangeSlides'))
          .onChange(async (value) => await this.settingsManager.setSetting({ useArrowKeysToChangeSlides: value }))
      )

    new Setting(containerEl)
      .setName("Zoom to slide without padding")
      .setDesc("When enabled, the canvas will zoom to the slide without padding.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settingsManager.getSetting('zoomToSlideWithoutPadding'))
          .onChange(async (value) => await this.settingsManager.setSetting({ zoomToSlideWithoutPadding: value }))
      )

    new Setting(containerEl)
      .setName("Slide transition animation duration")
      .setDesc("The duration of the slide transition animation in seconds. Set to 0 to disable the animation.")
      .addText((text) =>
        text
          .setValue(this.settingsManager.getSetting('slideTransitionAnimationDuration').toString())
          .onChange(async (value) => await this.settingsManager.setSetting({ slideTransitionAnimationDuration: parseFloat(value) }))
      )

    new Setting(containerEl)
      .setName("Slide transition animation intensity")
      .setDesc("The intensity of the slide transition animation. The higher the value, the more the canvas will zoom out before zooming in on the next slide.")
      .addText((text) =>
        text
          .setValue(this.settingsManager.getSetting('slideTransitionAnimationIntensity').toString())
          .onChange(async (value) => await this.settingsManager.setSetting({ slideTransitionAnimationIntensity: parseFloat(value) }))
      )
  }
}