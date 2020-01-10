import VXETable from '../../../../packages/v-x-e-table'

// 创建一个超链接渲染器
VXETable.renderer.add('MyLink', {
  // 默认显示模板
  renderDefault (h, renderOpts, params) {
    let { row, column } = params
    let { events } = renderOpts
    return [
      <a class="link" onClick={ () => events.click(params) }>{row[column.property]}</a>
    ]
  }
})
