import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenliteSimplifiedChatUiPlugin extends GenLitePlugin {
  static pluginName = 'GenliteSimplifiedChatUiPlugin';

  isPluginEnabled: boolean = false;

  originalStyles = {};

  chatWidth: number = 700;

  chatBackground: HTMLElement;
  chatButtons: HTMLElement;
  chatButton1: HTMLElement;
  chatButton2: HTMLElement;
  chatButton3: HTMLElement;
  chatButton4: HTMLElement;
  chatButton5: HTMLElement;
  chatButton6: HTMLElement;
  chatButton7: HTMLElement;
  chatButton8: HTMLElement;
  chatButton9: HTMLElement;
  chatButton10: HTMLElement;
  chatButton11: HTMLElement;
  chatButton12: HTMLElement;
  chatContent: HTMLElement;
  chatWrapper: HTMLElement;
  chatBox: HTMLElement;

  pointerEventOverrides: Array<HTMLElement> = [];

  emptyStyle = '';
  styleAutoEvents = `pointer-events: auto;`;

  hasLoadedElements = false;
  hasLoadedOriginalStyles = false;

  pluginSettings: Settings = {
    'Chat Width': {
      type: 'number',
      value: this.chatWidth,
      stateHandler: this.handleChatWidthChanged.bind(this)
    }
  }

  async init() {
    document.genlite.registerPlugin(this);
  }

  async postInit() {
    document.genlite.ui.registerPlugin("Simplified Chat UI", null, this.handlePluginState.bind(this), this.pluginSettings);
  }

  handlePluginState(state: boolean): void {
    this.isPluginEnabled = state;

    if (state) {
      this.start();
    } else {
      this.stop();
    }
  }

  handleChatWidthChanged(value: number) {
    this.chatWidth = value;

    if (this.isPluginEnabled) {
      this.enableUI();
    }
  }

  public stop() {
    this.loadElements();
    this.assignOriginalStyles();
    this.disableUI();
  }

  public start() {
    this.loadElements();
    this.assignOriginalStyles();
    this.enableUI();
  }

  enableUI() {
    for (const entry of this.pointerEventOverrides) {
      entry.setAttribute('style', this.styleAutoEvents);
    }

    this.chatBackground.setAttribute('style', `background: rgba(0,0,0,0.7); clip-path: none; width: ${this.chatWidth}px; pointer-events: none;`);
    this.chatContent.setAttribute('style', `width: calc(${this.chatWidth}px - 36px);`);
    this.chatWrapper.setAttribute('style', 'left: 0px; width: calc(100% - 10px);');
    this.chatBox.setAttribute('style', 'background: transparent');
  }

  disableUI() {
    for (const entry of this.pointerEventOverrides) {
      entry.setAttribute('style', this.emptyStyle);
    }

    this.chatBackground.setAttribute('style', this.originalStyles['chatBackground']);
    this.chatContent.setAttribute('style', this.originalStyles['chatContent']);
    this.chatWrapper.setAttribute('style', this.originalStyles['chatWrapper']);

    this.chatBox.setAttribute('style', this.originalStyles['chatBox']);
  }

  loadElements() {
    if (this.hasLoadedElements) {
      return;
    }

    this.chatBackground = document.getElementById('new_ux-chat-box');
    this.chatButtons = document.getElementById('new_ux-chat__upper-buttons-row');
    this.chatButton1 = document.getElementById('new_ux-chat-all-button');
    this.chatButton2 = document.getElementById('new_ux-chat-game-button');
    this.chatButton3 = document.getElementById('new_ux-chat-quest-button');
    this.chatButton4 = document.getElementById('new_ux-chat-public-button');
    this.chatButton5 = document.getElementById('new_ux-chat-private-button');
    this.chatButton6 = document.getElementById('new_ux-chat-clan-button');
    this.chatButton7 = document.getElementById('new_ux-chat_friends-list-window__add-friend-button');
    this.chatButton8 = document.getElementById('new_ux-chat_ignored-window__ignore-user-button');
    this.chatButton9 = document.getElementById('new_ux-chat-toggle-button');
    this.chatButton10 = document.getElementById('new_ux-chat_friends-list-window');
    this.chatButton11 = document.getElementById('new_ux-chat-tab__chat-prompt');
    this.chatButton12 = document.getElementById('new_ux-chat_ignored-window');
    this.chatContent = document.getElementById('new_ux-chat-dialog-box-content');
    this.chatWrapper = document.getElementById('new_ux-chat-box__inner-wrapper');
    this.chatBox = document.getElementById('new_ux-chat-dialog-box');

    this.pointerEventOverrides = [
      this.chatBackground,
      this.chatButtons,
      this.chatButton1,
      this.chatButton2,
      this.chatButton3,
      this.chatButton4,
      this.chatButton5,
      this.chatButton6,
      this.chatButton7,
      this.chatButton8,
      this.chatButton9,
      this.chatButton10,
      this.chatButton11,
      this.chatButton12,
      this.chatContent,
      this.chatWrapper,
      this.chatBox,
    ];

    this.hasLoadedElements = true;
  }

  assignOriginalStyles() {
    if (this.hasLoadedOriginalStyles) {
      return;
    }

    this.originalStyles['chatBackground'] = this.chatBackground.getAttribute('style');
    this.originalStyles['chatContent'] = this.chatContent.getAttribute('style');
    this.originalStyles['chatWrapper'] = this.chatWrapper.getAttribute('style');
    this.originalStyles['chatBox'] = this.chatBox.getAttribute('style');

    this.hasLoadedOriginalStyles = true;
  }
}
