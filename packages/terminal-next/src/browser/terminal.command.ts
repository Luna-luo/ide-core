import { Command } from '@ali/ide-core-common';
import { getIcon, ROTATE_TYPE, localize } from '@ali/ide-core-browser';

export const terminalSearch: Command = {
  id: 'terminal.search',
  label: localize('terminal.search'),
  iconClass: getIcon('search'),
  category: 'terminal',
};

export const terminalSearchNext: Command = {
  id: 'terminal.search.next',
  label: localize('terminal.search.next'),
  category: 'terminal',
};

export const terminalAdd: Command = {
  id: 'terminal.add',
  label: 'add terminal',
  iconClass: getIcon('plus'),
  category: 'terminal',
};

export const terminalRemove: Command = {
  id: 'terminal.remove',
  label: 'remove terminal',
  iconClass: getIcon('delete'),
  category: 'terminal',
};

export const terminalExpand: Command = {
  id: 'terminal.expand',
  label: 'expand terminal',
  iconClass: getIcon('up'),
  toogleIconClass: getIcon('up', { rotate: ROTATE_TYPE.rotate_180 }),
  category: 'terminal',
};

export const terminalIndepend: Command = {
  id: 'terminal.independ',
  label: localize('terminal.independ'),
  iconClass: getIcon('undock'),
  category: 'terminal',
};

export const terminalClear: Command = {
  id: 'terminal.clear',
  label: localize('terminal.clear'),
  iconClass: getIcon('clear'),
  category: 'terminal',
};

export const terminalSplit: Command = {
  id: 'terminal.split',
  label: localize('terminal.split'),
  iconClass: getIcon('embed'),
  category: 'terminal',
};

export const toggleBottomPanel: Command = {
  id: 'main-layout.bottom-panel.toggle',
};
