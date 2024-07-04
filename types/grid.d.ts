import { VNode } from 'vue'
import { Table } from './table'
import { ColumnOptions } from './column'
import { FormOptions } from './form'
import { FormItemOptions } from './form-item'
import { ToolbarOptions } from './toolbar'
import { PagerOptions } from './pager'
import { RowInfo } from './component'

/* eslint-disable no-use-before-define */

/**
 * 配置式表格
 */
export declare class VxeGrid extends Table {
  /**
   * 列配置
   */
  columns?: GridColumns[];
  /**
   * 分页配置项
   */
  pagerConfig?: GridPagerConfig;
  /**
   * 数据代理配置项
   */
  proxyConfig?: GridProxyConfig;
  proxyOpts: GridProxyConfig;
  /**
   * 工具栏配置
   */
  toolbarConfig?: GridToolbarConfig;
  /**
   * 表单配置项
   */
  formConfig?: GridFormOptions;
  formOpts: GridFormOptions;

  /**
   * 给数据代理提交指令
   * @param code 指令编码
   */
  commitProxy(code: string): Promise<any>;
  /**
   * 获取表单项列表
   */
  getFormItems(index?: number): FormItemOptions[];
  /**
   * 获取已标记删除的数据
   */
  getPendingRecords(): RowInfo[];
  /**
   * 切换表格最大化/还原
   */
  zoom(): Promise<boolean>;
  /**
   * 判断是否最大化显示
   */
  isMaximized(): boolean;
  /**
   * 如果表格处于常规状态，则最大化表格
   */
  maximize(): Promise<any>;
  /**
   * 如果表格处于最大化状态，则还原表格
   */
  revert(): Promise<any>;
  /**
   * 获取数据代理信息
   */
  getProxyInfo(): {
    data: any;
    filter: any;
    form: any;
    sort: any;
    pager: any;
    pendingRecords: any[];
  };

  [key: string]: any;
}
export class Grid extends VxeGrid {}

export interface GridProxyQueryPageParams {
  pageSize: number;
  currentPage: number;
}

export interface GridProxyQuerySortParams {
  order: string;
  property: string;
}

export interface GridProxyQueryFiltersParams {
  property: string;
  values: any[];
}

export interface GridProxyConfig {
  autoLoad?: boolean;
  message?: boolean;
  seq?: boolean;
  sort?: boolean;
  filter?: boolean;
  form?: boolean;
  response?: {
    list?: string | null | ((params: { data: any }) => any[])
    result?: string | ((params: { data: any }) => any[])
    total?: string | ((params: { data: any }) => number)
    message?: string | ((params: { data: any }) => string)
  };
  ajax?: {
    query?(params: { page: GridProxyQueryPageParams, sort: GridProxyQuerySortParams, filters: GridProxyQueryFiltersParams[], form: any }, ...args: any[]): Promise<any>;
    delete?(params: { body: { removeRecords: any[] } }, ...args: any[]): Promise<any>;
    save?(params: { body: { insertRecords: any[], updateRecords: any[], removeRecords: any[], pendingRecords: any[] } }, ...args: any[]): Promise<any>;
  }
  [key: string]: any;

  /**
   * 已废弃，请使用 proxy-config.response
   * @deprecated
   */
  props?: {
    /**
     * 已废弃，请使用 proxy-config.response.list
     * @deprecated
     */
    list?: string | null
    /**
     * 已废弃，请使用 proxy-config.response.result
     * @deprecated
     */
    result?: string
    /**
     * 已废弃，请使用 proxy-config.response.total
     * @deprecated
     */
    total?: string
    /**
     * 已废弃，请使用 proxy-config.response.message
     * @deprecated
     */
    message?: string
  }
}

export interface GridPagerConfig extends PagerOptions {
  [key: string]: any;
}

export interface GridColumns extends ColumnOptions {
  children?: GridColumns[];
}

export interface GridToolbarConfig extends ToolbarOptions {
  zoom?: boolean | {
    escRestore?: boolean;
    iconIn?: string;
    iconOut?: string;
  };
  slots?: {
    buttons?(): VNode[] | string[];
    tools?(): VNode[] | string[];
  }
}

export interface GridFormOptions extends FormOptions {
  [key: string]: any;
}
