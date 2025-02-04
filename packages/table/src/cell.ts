import { h, VNode } from 'vue'
import XEUtils from 'xe-utils'
import { VxeUI } from '../../ui'
import { getFuncText, isEnableConf, formatText, eqEmptyValue } from '../../ui/src/utils'
import { updateCellTitle } from '../../ui/src/dom'
import { createColumn, getRowid } from './util'
import { getSlotVNs } from '../../ui/src/vn'

import type { VxeTableConstructor, VxeTableDefines, VxeColumnPropTypes, VxeTablePrivateMethods, VxeComponentSlotType } from '../../../types'

const { getI18n, getIcon, renderer, formats, renderEmptyElement } = VxeUI

function renderTitlePrefixIcon (params: VxeTableDefines.CellRenderHeaderParams) {
  const { $table, column } = params
  const titlePrefix = column.titlePrefix || column.titleHelp
  if (titlePrefix) {
    return h('i', {
      class: ['vxe-cell-title-prefix-icon', titlePrefix.icon || getIcon().TABLE_TITLE_PREFIX],
      onMouseenter (evnt: MouseEvent) {
        $table.triggerHeaderTitleEvent(evnt, titlePrefix, params)
      },
      onMouseleave (evnt: MouseEvent) {
        $table.handleTargetLeaveEvent(evnt)
      }
    })
  }
  return renderEmptyElement($table)
}

function renderTitleSuffixIcon (params: VxeTableDefines.CellRenderHeaderParams) {
  const { $table, column } = params
  const titleSuffix = column.titleSuffix
  if (titleSuffix) {
    return h('i', {
      class: ['vxe-cell-title-suffix-icon', titleSuffix.icon || getIcon().TABLE_TITLE_SUFFIX],
      onMouseenter (evnt: MouseEvent) {
        $table.triggerHeaderTitleEvent(evnt, titleSuffix, params)
      },
      onMouseleave (evnt: MouseEvent) {
        $table.handleTargetLeaveEvent(evnt)
      }
    })
  }
  return renderEmptyElement($table)
}

function renderCellDragIcon (params: VxeTableDefines.CellRenderBodyParams) {
  const { $table } = params
  const tableProps = $table.props
  const { dragConfig } = tableProps
  const { computeRowDragOpts } = $table.getComputeMaps()
  const rowDragOpts = computeRowDragOpts.value
  const { icon, disabledMethod } = rowDragOpts
  const rDisabledMethod = disabledMethod || (dragConfig ? dragConfig.rowDisabledMethod : null)
  const isDisabled = rDisabledMethod && rDisabledMethod(params)
  return h('span', {
    key: 'dg',
    class: ['vxe-cell--drag-handle', {
      'is--disabled': isDisabled
    }],
    onMousedown (evnt) {
      if (!isDisabled) {
        $table.handleCellDragMousedownEvent(evnt, params)
      }
    },
    onMouseup: $table.handleCellDragMouseupEvent
  }, [
    h('i', {
      class: icon || (dragConfig ? dragConfig.rowIcon : '') || getIcon().TABLE_DRAG_ROW
    })
  ])
}

function renderCellBaseVNs (params: VxeTableDefines.CellRenderBodyParams, content: VxeComponentSlotType | VxeComponentSlotType[]) {
  const { $table, column, level } = params
  const { dragSort } = column
  const tableProps = $table.props
  const { treeConfig, dragConfig } = tableProps
  const { computeRowOpts, computeRowDragOpts } = $table.getComputeMaps()
  const rowOpts = computeRowOpts.value
  const rowDragOpts = computeRowDragOpts.value
  const { showIcon, visibleMethod } = rowDragOpts
  const rVisibleMethod = visibleMethod || (dragConfig ? dragConfig.rowVisibleMethod : null)
  const vns: VxeComponentSlotType[] = XEUtils.isArray(content) ? content : [content]
  if (dragSort && rowOpts.drag && ((showIcon || (dragConfig ? dragConfig.showRowIcon : false)) && (!rVisibleMethod || rVisibleMethod(params)))) {
    if (!treeConfig || !level) {
      vns.unshift(
        renderCellDragIcon(params)
      )
    }
  }
  return vns
}

function renderHeaderCellDragIcon (params: VxeTableDefines.CellRenderHeaderParams) {
  const { $table, column } = params
  const { computeColumnOpts, computeColumnDragOpts } = $table.getComputeMaps()
  const columnOpts = computeColumnOpts.value
  const columnDragOpts = computeColumnDragOpts.value
  const { showIcon, icon, visibleMethod, disabledMethod } = columnDragOpts
  const isDisabled = disabledMethod && disabledMethod(params)
  if (columnOpts.drag && showIcon && (!visibleMethod || visibleMethod(params))) {
    if (!(column.fixed || column.parentId)) {
      return h('span', {
        key: 'dg',
        class: ['vxe-cell--drag-handle', {
          'is--disabled': isDisabled
        }],
        onMousedown (evnt) {
          if (!isDisabled) {
            $table.handleHeaderCellDragMousedownEvent(evnt, params)
          }
        },
        onMouseup: $table.handleHeaderCellDragMouseupEvent
      }, [
        h('i', {
          class: icon || getIcon().TABLE_DRAG_COLUMN
        })
      ])
    }
  }
  return renderEmptyElement($table)
}

function renderHeaderCellBaseVNs (params: VxeTableDefines.CellRenderHeaderParams, content: VNode | VNode[]) {
  const vns = [
    renderTitlePrefixIcon(params),
    renderHeaderCellDragIcon(params),
    ...(XEUtils.isArray(content) ? content : [content]),
    renderTitleSuffixIcon(params)
  ]
  return vns
}

function renderTitleContent (params: VxeTableDefines.CellRenderHeaderParams, content: VxeComponentSlotType | VxeComponentSlotType[]) {
  const { $table, column } = params
  const { props, reactData } = $table
  const { computeTooltipOpts } = $table.getComputeMaps()
  const { showHeaderOverflow: allColumnHeaderOverflow } = props
  const { type, showHeaderOverflow } = column
  const tooltipOpts = computeTooltipOpts.value
  const showAllTip = tooltipOpts.showAll
  const headOverflow = XEUtils.isUndefined(showHeaderOverflow) || XEUtils.isNull(showHeaderOverflow) ? allColumnHeaderOverflow : showHeaderOverflow
  const showTitle = headOverflow === 'title'
  const showTooltip = headOverflow === true || headOverflow === 'tooltip'
  const ons: any = {}
  if (showTitle || showTooltip || showAllTip) {
    ons.onMouseenter = (evnt: MouseEvent) => {
      if (reactData._isResize) {
        return
      }
      if (showTitle) {
        updateCellTitle(evnt.currentTarget, column)
      } else if (showTooltip || showAllTip) {
        $table.triggerHeaderTooltipEvent(evnt, params)
      }
    }
  }
  if (showTooltip || showAllTip) {
    ons.onMouseleave = (evnt: MouseEvent) => {
      if (reactData._isResize) {
        return
      }
      if (showTooltip || showAllTip) {
        $table.handleTargetLeaveEvent(evnt)
      }
    }
  }
  return [
    type === 'html' && XEUtils.isString(content)
      ? h('span', {
        class: 'vxe-cell--title',
        innerHTML: content,
        ...ons
      })
      : h('span', {
        class: 'vxe-cell--title',
        ...ons
      }, getSlotVNs(content))
  ]
}

function formatFooterLabel (footerFormatter: VxeColumnPropTypes.FooterFormatter, params: {
  itemValue: any
  column: VxeTableDefines.ColumnInfo
  row: any
  items: any[]
  _columnIndex: number
}) {
  if (XEUtils.isFunction(footerFormatter)) {
    return footerFormatter(params)
  }
  const isArr = XEUtils.isArray(footerFormatter)
  const gFormatOpts = isArr ? formats.get(footerFormatter[0]) : formats.get(footerFormatter)
  const footerFormatMethod = gFormatOpts ? gFormatOpts.tableFooterCellFormatMethod : null
  if (footerFormatMethod) {
    return isArr ? footerFormatMethod(params, ...footerFormatter.slice(1)) : footerFormatMethod(params)
  }
  return ''
}

function getFooterContent (params: VxeTableDefines.CellRenderFooterParams) {
  const { $table, column, _columnIndex, items, row } = params
  const { slots, editRender, cellRender, footerFormatter } = column
  const renderOpts = editRender || cellRender
  const footerSlot = slots ? slots.footer : null
  if (footerSlot) {
    return $table.callSlot(footerSlot, params)
  }
  if (renderOpts) {
    const compConf = renderer.get(renderOpts.name)
    if (compConf) {
      const rtFooter = compConf.renderTableFooter || compConf.renderFooter
      if (rtFooter) {
        return getSlotVNs(rtFooter(renderOpts, params))
      }
    }
  }
  let itemValue = ''
  // 兼容老模式
  if (XEUtils.isArray(items)) {
    itemValue = items[_columnIndex]
    return [
      footerFormatter
        ? formatFooterLabel(footerFormatter, {
          itemValue,
          column,
          row,
          items,
          _columnIndex
        })
        : formatText(itemValue, 1)
    ]
  }
  itemValue = XEUtils.get(row, column.field)
  return [
    footerFormatter
      ? formatFooterLabel(footerFormatter, {
        itemValue,
        column,
        row,
        items,
        _columnIndex
      })
      : formatText(itemValue, 1)
  ]
}

function getDefaultCellLabel (params: VxeTableDefines.CellRenderBodyParams) {
  const { $table, row, column } = params
  return formatText($table.getCellLabel(row, column), 1)
}

export const Cell = {
  createColumn ($xeTable: VxeTableConstructor & VxeTablePrivateMethods, columnOpts: VxeTableDefines.ColumnOptions | VxeTableDefines.ColumnInfo) {
    const { type, sortable, filters, editRender, treeNode } = columnOpts
    const { props } = $xeTable
    const { editConfig } = props
    const { computeEditOpts, computeCheckboxOpts } = $xeTable.getComputeMaps()
    const checkboxOpts = computeCheckboxOpts.value
    const editOpts = computeEditOpts.value
    const renConfs: any = {
      renderHeader: Cell.renderDefaultHeader,
      renderCell: treeNode ? Cell.renderTreeCell : Cell.renderDefaultCell,
      renderFooter: Cell.renderDefaultFooter
    }
    switch (type) {
      case 'seq':
        renConfs.renderHeader = Cell.renderSeqHeader
        renConfs.renderCell = treeNode ? Cell.renderTreeIndexCell : Cell.renderSeqCell
        break
      case 'radio':
        renConfs.renderHeader = Cell.renderRadioHeader
        renConfs.renderCell = treeNode ? Cell.renderTreeRadioCell : Cell.renderRadioCell
        break
      case 'checkbox':
        renConfs.renderHeader = Cell.renderCheckboxHeader
        renConfs.renderCell = checkboxOpts.checkField ? (treeNode ? Cell.renderTreeSelectionCellByProp : Cell.renderCheckboxCellByProp) : (treeNode ? Cell.renderTreeSelectionCell : Cell.renderCheckboxCell)
        break
      case 'expand':
        renConfs.renderCell = Cell.renderExpandCell
        renConfs.renderData = Cell.renderExpandData
        break
      case 'html':
        renConfs.renderCell = treeNode ? Cell.renderTreeHTMLCell : Cell.renderHTMLCell
        if (filters && sortable) {
          renConfs.renderHeader = Cell.renderSortAndFilterHeader
        } else if (sortable) {
          renConfs.renderHeader = Cell.renderSortHeader
        } else if (filters) {
          renConfs.renderHeader = Cell.renderFilterHeader
        }
        break
      default:
        if (editConfig && editRender) {
          renConfs.renderHeader = Cell.renderEditHeader
          renConfs.renderCell = editOpts.mode === 'cell' ? (treeNode ? Cell.renderTreeCellEdit : Cell.renderCellEdit) : (treeNode ? Cell.renderTreeRowEdit : Cell.renderRowEdit)
        } else if (filters && sortable) {
          renConfs.renderHeader = Cell.renderSortAndFilterHeader
        } else if (sortable) {
          renConfs.renderHeader = Cell.renderSortHeader
        } else if (filters) {
          renConfs.renderHeader = Cell.renderFilterHeader
        }
    }
    return createColumn($xeTable, columnOpts, renConfs)
  },
  /**
   * 列头标题
   */
  renderHeaderTitle (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column } = params
    const { slots, editRender, cellRender } = column
    const renderOpts = editRender || cellRender
    const headerSlot = slots ? slots.header : null
    if (headerSlot) {
      return renderTitleContent(params, $table.callSlot(headerSlot, params))
    }
    if (renderOpts) {
      const compConf = renderer.get(renderOpts.name)
      if (compConf) {
        const rtHeader = compConf.renderTableHeader || compConf.renderHeader
        if (rtHeader) {
          return renderTitleContent(params, getSlotVNs(rtHeader(renderOpts, params)))
        }
      }
    }
    return renderTitleContent(params, formatText(column.getTitle(), 1))
  },
  renderDefaultHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    return renderHeaderCellBaseVNs(params, Cell.renderHeaderTitle(params))
  },
  renderDefaultCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, row, column } = params
    const { slots, editRender, cellRender } = column
    const renderOpts = editRender || cellRender
    const defaultSlot = slots ? slots.default : null
    if (defaultSlot) {
      return renderCellBaseVNs(params, $table.callSlot(defaultSlot, params))
    }
    if (renderOpts) {
      const compConf = renderer.get(renderOpts.name)
      if (compConf) {
        const rtCell = compConf.renderTableCell || compConf.renderCell
        const rtDefault = compConf.renderTableDefault || compConf.renderDefault
        const renderFn = editRender ? rtCell : rtDefault
        if (renderFn) {
          return renderCellBaseVNs(params, getSlotVNs(renderFn(renderOpts, Object.assign({ $type: editRender ? 'edit' : 'cell' }, params))))
        }
      }
    }
    const cellValue = $table.getCellLabel(row, column)
    const cellPlaceholder = editRender ? editRender.placeholder : ''
    return renderCellBaseVNs(params, [
      h('span', {
        class: 'vxe-cell--label'
      }, [
        // 如果设置占位符
        editRender && eqEmptyValue(cellValue)
          ? h('span', {
            class: 'vxe-cell--placeholder'
          }, formatText(getFuncText(cellPlaceholder), 1))
          : h('span', formatText(cellValue, 1))
      ]
      )
    ])
  },
  renderTreeCell (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderDefaultCell(params) as VNode[])
  },
  renderDefaultFooter (params: VxeTableDefines.CellRenderFooterParams) {
    return [
      h('span', {
        class: 'vxe-cell--item'
      }, getFooterContent(params))
    ]
  },

  /**
   * 树节点
   */
  renderTreeIcon (params: VxeTableDefines.CellRenderBodyParams, cellVNodes: VxeComponentSlotType[]) {
    const { $table, isHidden } = params
    const { reactData, internalData } = $table
    const { computeTreeOpts } = $table.getComputeMaps()
    const { treeExpandedMaps, treeExpandLazyLoadedMaps } = reactData
    const { fullAllDataRowIdData } = internalData
    const treeOpts = computeTreeOpts.value
    const { row, column, level } = params
    const { slots } = column
    const { indent, lazy, trigger, iconLoaded, showIcon, iconOpen, iconClose } = treeOpts
    const childrenField = treeOpts.children || treeOpts.childrenField
    const hasChildField = treeOpts.hasChild || treeOpts.hasChildField
    const rowChilds = row[childrenField]
    const hasChild = rowChilds && rowChilds.length
    const iconSlot = slots ? slots.icon : null
    let hasLazyChilds = false
    let isAceived = false
    let isLazyLoading = false
    let isLazyLoaded = false
    const ons: any = {}
    if (iconSlot) {
      return $table.callSlot(iconSlot, params)
    }
    if (!isHidden) {
      const rowid = getRowid($table, row)
      isAceived = !!treeExpandedMaps[rowid]
      if (lazy) {
        const rest = fullAllDataRowIdData[rowid]
        isLazyLoading = !!treeExpandLazyLoadedMaps[rowid]
        hasLazyChilds = row[hasChildField]
        isLazyLoaded = !!rest.treeLoaded
      }
    }
    if (!trigger || trigger === 'default') {
      ons.onClick = (evnt: Event) => {
        $table.triggerTreeExpandEvent(evnt, params)
      }
    }
    return [
      h('div', {
        class: ['vxe-cell--tree-node', {
          'is--active': isAceived
        }],
        style: {
          paddingLeft: `${level * indent}px`
        }
      }, [
        showIcon && (lazy ? (isLazyLoaded ? hasChild : hasLazyChilds) : hasChild)
          ? [
              h('div', {
                class: 'vxe-tree--btn-wrapper',
                ...ons
              }, [
                h('i', {
                  class: ['vxe-tree--node-btn', isLazyLoading ? (iconLoaded || getIcon().TABLE_TREE_LOADED) : (isAceived ? (iconOpen || getIcon().TABLE_TREE_OPEN) : (iconClose || getIcon().TABLE_TREE_CLOSE))]
                })
              ])
            ]
          : null,
        h('div', {
          class: 'vxe-tree-cell'
        }, cellVNodes)
      ])
    ]
  },

  /**
   * 序号
   */
  renderSeqHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column } = params
    const { slots } = column
    const headerSlot = slots ? slots.header : null
    return renderHeaderCellBaseVNs(params, renderTitleContent(params, headerSlot ? $table.callSlot(headerSlot, params) : formatText(column.getTitle(), 1)))
  },
  renderSeqCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, column } = params
    const { props } = $table
    const { treeConfig } = props
    const { computeSeqOpts } = $table.getComputeMaps()
    const seqOpts = computeSeqOpts.value
    const { slots } = column
    const defaultSlot = slots ? slots.default : null
    if (defaultSlot) {
      return renderCellBaseVNs(params, $table.callSlot(defaultSlot, params))
    }
    const { seq } = params
    const seqMethod = seqOpts.seqMethod
    return renderCellBaseVNs(params, [
      h('span', `${formatText(seqMethod ? seqMethod(params) : treeConfig ? seq : (seqOpts.startIndex || 0) + (seq as number), 1)}`)
    ])
  },
  renderTreeIndexCell (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderSeqCell(params) as VNode[])
  },

  /**
   * 单选
   */
  renderRadioHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column } = params
    const { slots } = column
    const headerSlot = slots ? slots.header : null
    const titleSlot = slots ? slots.title : null
    return renderHeaderCellBaseVNs(params,
      renderTitleContent(params, headerSlot
        ? $table.callSlot(headerSlot, params)
        : [
            h('span', {
              class: 'vxe-radio--label'
            }, titleSlot ? $table.callSlot(titleSlot, params) : formatText(column.getTitle(), 1))
          ])
    )
  },
  renderRadioCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, column, isHidden } = params
    const { reactData } = $table
    const { computeRadioOpts } = $table.getComputeMaps()
    const { selectRadioRow } = reactData
    const radioOpts = computeRadioOpts.value
    const { slots } = column
    const { labelField, checkMethod, visibleMethod } = radioOpts
    const { row } = params
    const defaultSlot = slots ? slots.default : null
    const radioSlot = slots ? slots.radio : null
    const isChecked = $table.eqRow(row, selectRadioRow)
    const isVisible = !visibleMethod || visibleMethod({ row })
    let isDisabled = !!checkMethod
    let ons
    if (!isHidden) {
      ons = {
        onClick (evnt: Event) {
          if (!isDisabled && isVisible) {
            $table.triggerRadioRowEvent(evnt, params)
          }
        }
      }
      if (checkMethod) {
        isDisabled = !checkMethod({ row })
      }
    }
    const radioParams = { ...params, checked: isChecked, disabled: isDisabled, visible: isVisible }
    if (radioSlot) {
      return renderCellBaseVNs(params, $table.callSlot(radioSlot, radioParams))
    }
    const radioVNs: VNode[] = []
    if (isVisible) {
      radioVNs.push(
        h('span', {
          class: ['vxe-radio--icon', isChecked ? getIcon().TABLE_RADIO_CHECKED : getIcon().TABLE_RADIO_UNCHECKED]
        })
      )
    }
    if (defaultSlot || labelField) {
      radioVNs.push(
        h('span', {
          class: 'vxe-radio--label'
        }, defaultSlot ? $table.callSlot(defaultSlot, radioParams) : XEUtils.get(row, labelField as string))
      )
    }
    return renderCellBaseVNs(params, [
      h('span', {
        class: ['vxe-cell--radio', {
          'is--checked': isChecked,
          'is--disabled': isDisabled
        }],
        ...ons
      }, radioVNs)
    ])
  },
  renderTreeRadioCell (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderRadioCell(params))
  },

  /**
   * 多选
   */
  renderCheckboxHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column, isHidden } = params
    const { reactData } = $table
    const { computeIsAllCheckboxDisabled, computeCheckboxOpts } = $table.getComputeMaps()
    const { isAllSelected: isAllCheckboxSelected, isIndeterminate: isAllCheckboxIndeterminate } = reactData
    const isAllCheckboxDisabled = computeIsAllCheckboxDisabled.value
    const { slots } = column
    const headerSlot = slots ? slots.header : null
    const titleSlot = slots ? slots.title : null
    const checkboxOpts = computeCheckboxOpts.value
    const headerTitle = column.getTitle()
    let ons
    if (!isHidden) {
      ons = {
        onClick (evnt: MouseEvent) {
          if (!isAllCheckboxDisabled) {
            $table.triggerCheckAllEvent(evnt, !isAllCheckboxSelected)
          }
        }
      }
    }
    const checkboxParams = { ...params, checked: isAllCheckboxSelected, disabled: isAllCheckboxDisabled, indeterminate: isAllCheckboxIndeterminate }
    if (headerSlot) {
      return renderHeaderCellBaseVNs(params, renderTitleContent(checkboxParams, $table.callSlot(headerSlot, checkboxParams)))
    }
    if (checkboxOpts.checkStrictly ? !checkboxOpts.showHeader : checkboxOpts.showHeader === false) {
      return renderHeaderCellBaseVNs(params, renderTitleContent(checkboxParams, [
        h('span', {
          class: 'vxe-checkbox--label'
        }, titleSlot ? $table.callSlot(titleSlot, checkboxParams) : headerTitle)
      ]))
    }
    return renderHeaderCellBaseVNs(params,
      renderTitleContent(checkboxParams, [
        h('span', {
          class: ['vxe-cell--checkbox', {
            'is--checked': isAllCheckboxSelected,
            'is--disabled': isAllCheckboxDisabled,
            'is--indeterminate': isAllCheckboxIndeterminate
          }],
          title: getI18n('vxe.table.allTitle'),
          ...ons
        }, [
          h('span', {
            class: ['vxe-checkbox--icon', isAllCheckboxIndeterminate ? getIcon().TABLE_CHECKBOX_INDETERMINATE : (isAllCheckboxSelected ? getIcon().TABLE_CHECKBOX_CHECKED : getIcon().TABLE_CHECKBOX_UNCHECKED)]
          })
        ].concat(titleSlot || headerTitle
          ? [
              h('span', {
                class: 'vxe-checkbox--label'
              }, titleSlot ? $table.callSlot(titleSlot, checkboxParams) : headerTitle)
            ]
          : []))
      ])
    )
  },
  renderCheckboxCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, row, column, isHidden } = params
    const { props, reactData } = $table
    const { treeConfig } = props
    const { selectCheckboxMaps, treeIndeterminateMaps } = reactData
    const { computeCheckboxOpts } = $table.getComputeMaps()
    const checkboxOpts = computeCheckboxOpts.value
    const { labelField, checkMethod, visibleMethod } = checkboxOpts
    const { slots } = column
    const defaultSlot = slots ? slots.default : null
    const checkboxSlot = slots ? slots.checkbox : null
    let indeterminate = false
    let isChecked = false
    const isVisible = !visibleMethod || visibleMethod({ row })
    let isDisabled = !!checkMethod
    let ons
    if (!isHidden) {
      const rowid = getRowid($table, row)
      isChecked = !!selectCheckboxMaps[rowid]
      ons = {
        onClick (evnt: MouseEvent) {
          if (!isDisabled && isVisible) {
            $table.triggerCheckRowEvent(evnt, params, !isChecked)
          }
        }
      }
      if (checkMethod) {
        isDisabled = !checkMethod({ row })
      }
      if (treeConfig) {
        indeterminate = !!treeIndeterminateMaps[rowid]
      }
    }
    const checkboxParams = { ...params, checked: isChecked, disabled: isDisabled, visible: isVisible, indeterminate }
    if (checkboxSlot) {
      return renderCellBaseVNs(params, $table.callSlot(checkboxSlot, checkboxParams))
    }
    const checkVNs: VNode[] = []
    if (isVisible) {
      checkVNs.push(
        h('span', {
          class: ['vxe-checkbox--icon', indeterminate ? getIcon().TABLE_CHECKBOX_INDETERMINATE : (isChecked ? getIcon().TABLE_CHECKBOX_CHECKED : getIcon().TABLE_CHECKBOX_UNCHECKED)]
        })
      )
    }
    if (defaultSlot || labelField) {
      checkVNs.push(
        h('span', {
          class: 'vxe-checkbox--label'
        }, defaultSlot ? $table.callSlot(defaultSlot, checkboxParams) : XEUtils.get(row, labelField as string))
      )
    }
    return renderCellBaseVNs(params, [
      h('span', {
        class: ['vxe-cell--checkbox', {
          'is--checked': isChecked,
          'is--disabled': isDisabled,
          'is--indeterminate': indeterminate,
          'is--hidden': !isVisible
        }],
        ...ons
      }, checkVNs)
    ])
  },
  renderTreeSelectionCell (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderCheckboxCell(params))
  },
  renderCheckboxCellByProp (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, row, column, isHidden } = params
    const { props, reactData } = $table
    const { treeConfig } = props
    const { treeIndeterminateMaps } = reactData
    const { computeCheckboxOpts } = $table.getComputeMaps()
    const checkboxOpts = computeCheckboxOpts.value
    const { labelField, checkField, checkMethod, visibleMethod } = checkboxOpts
    const indeterminateField = checkboxOpts.indeterminateField || checkboxOpts.halfField
    const { slots } = column
    const defaultSlot = slots ? slots.default : null
    const checkboxSlot = slots ? slots.checkbox : null
    let isIndeterminate = false
    let isChecked = false
    const isVisible = !visibleMethod || visibleMethod({ row })
    let isDisabled = !!checkMethod
    let ons
    if (!isHidden) {
      const rowid = getRowid($table, row)
      isChecked = XEUtils.get(row, checkField as string)
      ons = {
        onClick (evnt: MouseEvent) {
          if (!isDisabled && isVisible) {
            $table.triggerCheckRowEvent(evnt, params, !isChecked)
          }
        }
      }
      if (checkMethod) {
        isDisabled = !checkMethod({ row })
      }
      if (treeConfig) {
        isIndeterminate = !!treeIndeterminateMaps[rowid]
      }
    }
    const checkboxParams = { ...params, checked: isChecked, disabled: isDisabled, visible: isVisible, indeterminate: isIndeterminate }
    if (checkboxSlot) {
      return renderCellBaseVNs(params, $table.callSlot(checkboxSlot, checkboxParams))
    }
    const checkVNs: VNode[] = []
    if (isVisible) {
      checkVNs.push(
        h('span', {
          class: ['vxe-checkbox--icon', isIndeterminate ? getIcon().TABLE_CHECKBOX_INDETERMINATE : (isChecked ? getIcon().TABLE_CHECKBOX_CHECKED : getIcon().TABLE_CHECKBOX_UNCHECKED)]
        })
      )
      if (defaultSlot || labelField) {
        checkVNs.push(
          h('span', {
            class: 'vxe-checkbox--label'
          }, defaultSlot ? $table.callSlot(defaultSlot, checkboxParams) : XEUtils.get(row, labelField as string))
        )
      }
    }
    return renderCellBaseVNs(params, [
      h('span', {
        class: ['vxe-cell--checkbox', {
          'is--checked': isChecked,
          'is--disabled': isDisabled,
          'is--indeterminate': indeterminateField && !isChecked ? row[indeterminateField] : isIndeterminate,
          'is--hidden': !isVisible
        }],
        ...ons
      }, checkVNs)
    ])
  },
  renderTreeSelectionCellByProp (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderCheckboxCellByProp(params))
  },

  /**
   * 展开行
   */
  renderExpandCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, isHidden, row, column } = params
    const { reactData } = $table
    const { rowExpandedMaps, rowExpandLazyLoadedMaps } = reactData
    const { computeExpandOpts } = $table.getComputeMaps()
    const expandOpts = computeExpandOpts.value
    const { lazy, labelField, iconLoaded, showIcon, iconOpen, iconClose, visibleMethod } = expandOpts
    const { slots } = column
    const defaultSlot = slots ? slots.default : null
    const iconSlot = slots ? slots.icon : null
    let isAceived = false
    let isLazyLoading = false
    if (iconSlot) {
      return renderCellBaseVNs(params, $table.callSlot(iconSlot, params))
    }
    if (!isHidden) {
      const rowid = getRowid($table, row)
      isAceived = !!rowExpandedMaps[rowid]
      if (lazy) {
        isLazyLoading = !!rowExpandLazyLoadedMaps[rowid]
      }
    }
    return renderCellBaseVNs(params, [
      showIcon && (!visibleMethod || visibleMethod(params))
        ? h('span', {
          class: ['vxe-table--expanded', {
            'is--active': isAceived
          }],
          onClick (evnt: MouseEvent) {
            $table.triggerRowExpandEvent(evnt, params)
          }
        }, [
          h('i', {
            class: ['vxe-table--expand-btn', isLazyLoading ? (iconLoaded || getIcon().TABLE_EXPAND_LOADED) : (isAceived ? (iconOpen || getIcon().TABLE_EXPAND_OPEN) : (iconClose || getIcon().TABLE_EXPAND_CLOSE))]
          })
        ])
        : renderEmptyElement($table),
      defaultSlot || labelField
        ? h('span', {
          class: 'vxe-table--expand-label'
        }, defaultSlot ? $table.callSlot(defaultSlot, params) : XEUtils.get(row, labelField as string))
        : renderEmptyElement($table)
    ])
  },
  renderExpandData (params: VxeTableDefines.CellRenderDataParams) {
    const { $table, column } = params
    const { slots, contentRender } = column
    const contentSlot = slots ? slots.content : null
    if (contentSlot) {
      return $table.callSlot(contentSlot, params)
    }
    if (contentRender) {
      const compConf = renderer.get(contentRender.name)
      if (compConf) {
        const rtExpand = compConf.renderTableExpand || compConf.renderExpand
        if (rtExpand) {
          return getSlotVNs(rtExpand(contentRender, params))
        }
      }
    }
    return []
  },

  /**
   * HTML 标签
   */
  renderHTMLCell (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, column } = params
    const { slots } = column
    const defaultSlot = slots ? slots.default : null
    if (defaultSlot) {
      return renderCellBaseVNs(params, $table.callSlot(defaultSlot, params))
    }
    return renderCellBaseVNs(params, [
      h('span', {
        class: 'vxe-cell--html',
        innerHTML: getDefaultCellLabel(params)
      })
    ])
  },
  renderTreeHTMLCell (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderHTMLCell(params))
  },

  /**
   * 排序和筛选
   */
  renderSortAndFilterHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    return renderHeaderCellBaseVNs(
      params,
      Cell.renderHeaderTitle(params).concat(Cell.renderSortIcon(params).concat(Cell.renderFilterIcon(params)))
    )
  },

  /**
   * 排序
   */
  renderSortHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    return renderHeaderCellBaseVNs(
      params,
      Cell.renderHeaderTitle(params).concat(Cell.renderSortIcon(params))
    )
  },
  renderSortIcon (params: VxeTableDefines.CellRenderHeaderParams | VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column } = params
    const { computeSortOpts } = $table.getComputeMaps()
    const sortOpts = computeSortOpts.value
    const { showIcon, iconLayout, iconAsc, iconDesc } = sortOpts
    const { order } = column
    if (showIcon) {
      return [
        h('span', {
          class: ['vxe-cell--sort', `vxe-cell--sort-${iconLayout}-layout`]
        }, [
          h('i', {
            class: ['vxe-sort--asc-btn', iconAsc || getIcon().TABLE_SORT_ASC, {
              'sort--active': order === 'asc'
            }],
            title: getI18n('vxe.table.sortAsc'),
            onClick (evnt: Event) {
              evnt.stopPropagation()
              $table.triggerSortEvent(evnt, column, 'asc')
            }
          }),
          h('i', {
            class: ['vxe-sort--desc-btn', iconDesc || getIcon().TABLE_SORT_DESC, {
              'sort--active': order === 'desc'
            }],
            title: getI18n('vxe.table.sortDesc'),
            onClick (evnt: Event) {
              evnt.stopPropagation()
              $table.triggerSortEvent(evnt, column, 'desc')
            }
          })
        ])
      ]
    }
    return []
  },

  /**
   * 筛选
   */
  renderFilterHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    return renderHeaderCellBaseVNs(params, Cell.renderHeaderTitle(params).concat(Cell.renderFilterIcon(params)))
  },
  renderFilterIcon (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column, hasFilter } = params
    const { reactData } = $table
    const { filterStore } = reactData
    const { computeFilterOpts } = $table.getComputeMaps()
    const filterOpts = computeFilterOpts.value
    const { showIcon, iconNone, iconMatch } = filterOpts
    return showIcon
      ? [
          h('span', {
            class: ['vxe-cell--filter', {
              'is--active': filterStore.visible && filterStore.column === column
            }]
          }, [
            h('i', {
              class: ['vxe-filter--btn', hasFilter ? (iconMatch || getIcon().TABLE_FILTER_MATCH) : (iconNone || getIcon().TABLE_FILTER_NONE)],
              title: getI18n('vxe.table.filter'),
              onClick (evnt: Event) {
                if ($table.triggerFilterEvent) {
                  $table.triggerFilterEvent(evnt, params.column, params)
                }
              }
            })
          ])
        ]
      : []
  },

  /**
   * 可编辑
   */
  renderEditHeader (params: VxeTableDefines.CellRenderHeaderParams) {
    const { $table, column } = params
    const { props } = $table
    const { computeEditOpts } = $table.getComputeMaps()
    const { editConfig, editRules } = props
    const editOpts = computeEditOpts.value
    const { sortable, filters, editRender } = column
    let isRequired = false
    if (editRules) {
      const columnRules = XEUtils.get(editRules, column.field) as VxeTableDefines.ValidatorRule[]
      if (columnRules) {
        isRequired = columnRules.some((rule) => rule.required)
      }
    }
    let editIconVNs: VNode[] = []
    if (isEnableConf(editConfig)) {
      editIconVNs = [
        isRequired && editOpts.showAsterisk
          ? h('i', {
            class: 'vxe-cell--required-icon'
          })
          : renderEmptyElement($table),
        isEnableConf(editRender) && editOpts.showIcon
          ? h('i', {
            class: ['vxe-cell--edit-icon', editOpts.icon || getIcon().TABLE_EDIT]
          })
          : renderEmptyElement($table)
      ]
    }
    return renderHeaderCellBaseVNs(params,
      editIconVNs.concat(Cell.renderHeaderTitle(params))
        .concat(sortable ? Cell.renderSortIcon(params) : [])
        .concat(filters ? Cell.renderFilterIcon(params) : [])
    )
  },
  // 行格编辑模式
  renderRowEdit (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, column } = params
    const { reactData } = $table
    const { editStore } = reactData
    const { actived } = editStore
    const { editRender } = column
    return Cell.runRenderer(params, isEnableConf(editRender) && actived && actived.row === params.row)
  },
  renderTreeRowEdit (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderRowEdit(params) as VNode[])
  },
  // 单元格编辑模式
  renderCellEdit (params: VxeTableDefines.CellRenderBodyParams) {
    const { $table, column } = params
    const { reactData } = $table
    const { editStore } = reactData
    const { actived } = editStore
    const { editRender } = column
    return Cell.runRenderer(params, isEnableConf(editRender) && actived && actived.row === params.row && actived.column === params.column)
  },
  renderTreeCellEdit (params: VxeTableDefines.CellRenderBodyParams) {
    return Cell.renderTreeIcon(params, Cell.renderCellEdit(params) as VNode[])
  },
  runRenderer (params: VxeTableDefines.CellRenderBodyParams, isEdit: boolean) {
    const { $table, column } = params
    const { slots, editRender, formatter } = column
    const defaultSlot = slots ? slots.default : null
    const editSlot = slots ? slots.edit : null
    const compConf = renderer.get(editRender.name)
    const rtEdit = compConf ? (compConf.renderTableEdit || compConf.renderEdit) : null
    const cellParams = Object.assign({ $type: '', isEdit }, params)
    if (isEdit) {
      cellParams.$type = 'edit'
      if (editSlot) {
        return $table.callSlot(editSlot, cellParams)
      }
      if (rtEdit) {
        return getSlotVNs(rtEdit(editRender, cellParams))
      }
      return []
    }
    if (defaultSlot) {
      return renderCellBaseVNs(params, $table.callSlot(defaultSlot, cellParams))
    }
    if (formatter) {
      return renderCellBaseVNs(params, [
        h('span', {
          class: 'vxe-cell--label'
        }, getDefaultCellLabel(cellParams))
      ])
    }
    return Cell.renderDefaultCell(cellParams)
  }
}

export default Cell
