import * as React from 'react';
import * as clsx from 'classnames';
import { mnemonicButtonLabel } from '@ali/ide-core-common/lib/utils/strings';

import Menu, { ClickParam } from 'antd/lib/menu';
import 'antd/lib/menu/style/index.less';

import { Icon } from '@ali/ide-components';
import {
  MenuNode, ICtxMenuRenderer, SeparatorMenuItemNode,
  IContextMenu, IMenu, IMenuSeparator,
  SubmenuItemNode, IMenuAction,
} from '../../menu/next';
import { useInjectable } from '../../react-hooks';
import { useMenus, useContextMenus } from '../../utils';

import placements from './placements';

import * as styles from './styles.module.less';

const MenuAction: React.FC<{
  data: MenuNode;
  disabled?: boolean;
  hasSubmenu?: boolean;
}> = ({ data, hasSubmenu, disabled }) => {
  // 这里遵循 native menu 的原则，保留一个 icon 位置
  return (
    <div className={clsx(styles.menuAction, { [styles.disabled]: disabled, [styles.checked]: data.checked })}>
      <div className={styles.icon}>
        {
          data.checked
           ? <Icon icon='check' />
           : null
        }
      </div>
      <div className={styles.label}>
        {data.label ? mnemonicButtonLabel(data.label, true) : ''}
      </div>
      <div className={styles.tip}>
        {
          data.keybinding
            ? <div className={styles.shortcut}>{data.keybinding}</div>
            : null
        }
        {
          hasSubmenu
            ? <div className={styles.submenuIcon}>
              <Icon icon='right' />
            </div>
            : null
        }
      </div>
    </div>
  );
};

/**
 * 用于 context menu
 */
export const MenuActionList: React.FC<{
  data: MenuNode[];
  onClick?: (item: MenuNode) => void;
  context?: any[];
}> = ({ data = [], context = [], onClick }) => {
  if (!data.length) {
    return null;
  }

  const handleClick = React.useCallback((params: ClickParam) => {
    const { key, item } = params;
    // do nothing when click separator node
    if ([SeparatorMenuItemNode.ID, SubmenuItemNode.ID].includes(key)) {
      return;
    }

    // hacky: read MenuNode from MenuItem.children.props
    const menuItem = item.props.children.props.data as MenuNode;
    if (!menuItem) {
      return;
    }

    if (typeof menuItem.execute === 'function') {
      menuItem.execute(context);
    }

    if (typeof onClick === 'function') {
      onClick(menuItem);
    }
  }, [ data, context ]);

  const recursiveRender = React.useCallback((dataSource: MenuNode[]) => {
    return dataSource.map((menuNode, index) => {
      if (menuNode.id === SeparatorMenuItemNode.ID) {
        return <Menu.Divider key={`divider-${index}`} />;
      }

      if (menuNode.id === SubmenuItemNode.ID) {
        return (
          <Menu.SubMenu
            key={`${menuNode.id}-${index}`}
            popupClassName='kt-menu'
            title={<MenuAction hasSubmenu data={menuNode} />}>
            {recursiveRender(menuNode.children)}
          </Menu.SubMenu>
        );
      }

      return (
        <Menu.Item key={menuNode.id} disabled={menuNode.disabled}>
          <MenuAction data={menuNode} disabled={menuNode.disabled} />
        </Menu.Item>
      );
    });
  }, []);

  return (
    <Menu
      className='kt-menu'
      selectable={false}
      openTransitionName=''
      {...{builtinPlacements: placements} as any}
      onClick={handleClick}>
      {recursiveRender(data)}
    </Menu>
  );
};

export const IconAction: React.FC<{
  data: MenuNode;
  context?: any[];
} & React.HTMLAttributes<HTMLDivElement>> = ({ data, context = [], className, ...restProps }) => {
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.id === SubmenuItemNode.ID) {
      const anchor = { x: e.clientX, y: e.clientY };
      data.execute(anchor, ...context);
    } else if (typeof data.execute === 'function') {
      data.execute(context);
    }
  }, [ data, context ]);

  return (
    <Icon
      className={clsx(styles.iconAction, className, { [styles.disabled]: data.disabled })}
      title={data.label}
      iconClass={data.icon}
      onClick={handleClick}
      tooltip={data.tooltip || data.label}
      {...restProps}
    />
  );
};

IconAction.displayName = 'IconAction';

interface BaseActionListProps {
  /**
   * 顺序反转，满足 `...` aka `更多` 渲染到第一个
   */
  moreAtFirst?: boolean;
  /**
   * click handler 获取到的参数，长度为 0 - N 个
   */
  context?: any[];
  /**
   * 额外的 IMenuAction
   */
  extraNavActions?: IMenuAction[];
  className?: string;
}

/**
 * 用于 scm/title or view/title or inline actions
 */
const TitleActionList: React.FC<{
  nav: MenuNode[];
  more?: MenuNode[];
  className?: string;
} & BaseActionListProps> = ({
  nav: primary = [],
  more: secondary = [],
  context = [],
  extraNavActions = [],
  moreAtFirst = false,
  className,
}) => {
  const ctxMenuRenderer = useInjectable<ICtxMenuRenderer>(ICtxMenuRenderer);

  const handleShowMore = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (secondary) {
      ctxMenuRenderer.show({
        anchor: { x: e.clientX, y: e.clientY },
        // 合并结果
        menuNodes: secondary,
        args: context,
      });
    }
  }, [ secondary, context ]);

  if (primary.length === 0 && secondary.length === 0 && extraNavActions.length === 0) {
    return null;
  }

  const moreAction = secondary.length > 0
    ? <Icon icon='ellipsis' className={styles.iconAction} onClick={handleShowMore} />
    : null;

  return (
    <div className={clsx([styles.titleActions, className])}>
      { moreAtFirst && moreAction }
      {
        primary.map((item) => (
          <IconAction
            className={clsx({ [styles.selected]: item.checked })}
            key={item.id}
            data={item}
            context={context} />
        ))
      }
      {
        Array.isArray(extraNavActions) && extraNavActions.length
          ? <>
            {primary.length && <span className={styles.divider} />}
            {extraNavActions}
          </>
          : null
      }
      { !moreAtFirst && moreAction }
    </div>
  );
};

type TupleContext<T, U, K, M> = (
  M extends undefined
  ? K extends undefined
    ? U extends undefined
      ? T extends undefined
        ? undefined
        : [T]
      : [T, U]
    : [T, U, K]
  : [T, U, K, M]
);

// 目前先不放出来 extraNavActions 保持 InlineActionBar 只有一个分组
// 需要两个分组时考虑组合两个 InlineActionBar 组件使用
interface InlineActionBarProps<T, U, K, M> extends Omit<BaseActionListProps, 'extraNavActions'> {
  context?: TupleContext<T, U, K, M>;
  menus: IMenu;
  separator?: IMenuSeparator;
  className?: string;
}

export function InlineActionBar<T = undefined, U = undefined, K = undefined, M = undefined>(
  props: InlineActionBarProps<T, U, K, M>,
): React.ReactElement<InlineActionBarProps<T, U, K, M>> {
  const { menus, context, separator = 'navigation', ...restProps } = props;
  // TODO: 从一致性考虑是否这里不用 context 的命名
  // **warning** 这里不需要额外传参
  // 因为这里的 context 塞到 useMenus 之后会自动把参数加入到 MenuItem.execute 里面
  const [navMenu, moreMenu] = useMenus(menus, separator, context);

  // inline 菜单不取第二组，对应内容由关联 context menu 去渲染
  return (
    <TitleActionList
      nav={navMenu}
      more={separator === 'inline' ? [] : moreMenu}
      {...restProps} />
  );
}

// 目前先不放出来 extraNavActions 保持 InlineActionBar 只有一个分组
// 需要两个分组时考虑组合两个 InlineActionBar 组件使用
interface InlineMenuBarProps<T, U, K, M> extends Omit<BaseActionListProps, 'extraNavActions'> {
  context?: TupleContext<T, U, K, M>;
  menus: IContextMenu;
  separator?: IMenuSeparator;
}

// 后续考虑使用 IContextMenu, useContextMenus 和 InlineMenuBar 来替换掉老的 IMenu
// 完成 InlineActionBar 的升级
export function InlineMenuBar<T = undefined, U = undefined, K = undefined, M = undefined>(
  props: InlineMenuBarProps<T, U, K, M>,
): React.ReactElement<InlineMenuBarProps<T, U, K, M>> {
  const { menus, context, separator = 'navigation', ...restProps } = props;
  // TODO: 从一致性考虑是否这里不用 context 的命名
  const [navMenu, moreMenu] = useContextMenus(menus);

  // inline 菜单不取第二组，对应内容由关联 context menu 去渲染
  return (
    <TitleActionList
      nav={navMenu}
      more={separator === 'inline' ? [] : moreMenu}
      context={context}
      {...restProps} />
  );
}
