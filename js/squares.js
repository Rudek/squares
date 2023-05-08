const Squares = (function(document) {

  class Dom {
    constructor(elements) {
      if (typeof elements === 'string') {
        this.elements = Array.from(document.querySelectorAll(elements))
      }  else if ( elements instanceof HTMLElement) {
        this.elements = [elements]
      } else if ( elements instanceof Array) {
        this.elements = elements
      }  else {
        throw Error('Invalid type of elements')
      }
    }

    on(eventType, callback) {
      this.each($el => $el.elements[0].addEventListener(eventType, e => {
        e.$target = $(e.target)
        e.$current = $(e.currentTarget)
        e.$related = e.relatedTarget ? $(e.relatedTarget) : null
        callback(e)
      }))
    }

    find(selector) {
      return $(this.elements.map(
        el => Array.from(el.querySelectorAll(selector))
      ).flat())
    }

    name() {
      return this.elements[0].tagName.toLowerCase()
    }

    addClass(className) {
      this.each($el => $el.elements[0].classList.add(className))
      return this
    }

    removeClass(className) {
      this.each($el => $el.elements[0].classList.remove(className))
      return this
    }

    css(styles = []) {
      Object.keys(styles).forEach(key => {
        this.elements.forEach(el => el.style[key] = styles[key])
      })
      return this
    }

    remove(index) {
      this.elements[index].remove()
      this.elements = this.elements.filter((_, idx) => idx !== index)
      return this
    }

    setAttr(name, value) {
      this.elements[0].setAttribute(name, value)
    }

    data(name) {
      return this.elements[0].dataset[name]
    }

    getElements() {
      return this.elements
    }

    children() {
      return $(Array.from(this.elements[0].children))
    }

    countChildren() {
      return this.children().elements.length
    }

    length() {
      return this.elements.length
    }

    clone() {
      return $(this.elements[0].cloneNode())
    }

    each(callback) {
      this.elements.forEach((el, index) => callback($(el), index))
      return this
    }

    append($node) {
      this.elements[0].append($node.elements[0])
      return $node
    }

    static create(tagName, attr = {}) {
      const el = document.createElement(tagName)
      Object.keys(attr).forEach(name => {
        el.setAttribute(name, attr[name])
      })
      return $(el)
    }

    static getCssVariable(variable) {
      return getComputedStyle(document.documentElement).getPropertyValue(variable)
    }
  }

  const $ = (elements) => {
    return new Dom(elements)
  }

  let root = null
  const $els = {}
  let column = null
  let row = null

  const setEls = () => {
    const squaresWrapper = Dom.create('div',  {class: "squares-wrapper"})

    $els['squares'] = Dom.create('div', {class: 'squares'})
    $els['table'] = Dom.create('table')
    $els['tbody'] = Dom.create('tbody')
    $els['trows'] = $([1,2,3,4].map(index =>
      Dom.create('tr', {'data-row': index}).getElements()).flat()
    )
    $els.trows.each($tr => {
      [1,2,3,4].map(index => Dom.create('td', {'data-column': index}))
        .forEach($td => $tr.append($td))
      $els.tbody.append($tr)
    })

    $els['plusColumn'] = $els.squares.append(
      Dom.create('button', {class: 'plus column', 'aria-label': 'Plus column'})
    )
    $els['plusRow'] = $els.squares.append(
      Dom.create('button', {class: 'plus row', 'aria-label': 'Plus row'})
    )
    $els['minusRow'] = $els.squares.append(
      Dom.create('button', {class: 'minus row', 'aria-label': 'Minus row'})
    )
    $els['minusColumn'] = $els.squares.append(
      Dom.create('button', {class: 'minus column', 'aria-label': 'Minus column'})
    )

    root.append(squaresWrapper).append($els.squares).append($els.table).append($els.tbody)

    $els['buttons'] = $('.squares button')
    $els['minuses'] = $('.squares .minus')
    $els['table_buttons'] = $('.squares table, .squares button')
  }

  const toggleMinuses = (cls) => {
    const method = cls === 'show' ? 'add' : 'remove'
    $els.minuses[`${method}Class`]('show')
  }

  const rowMouseOverHandler = e => {
    const size = parseInt(Dom.getCssVariable('--square-size'))
    const offset = parseInt(Dom.getCssVariable('--square-offset'))
    const border = parseInt(Dom.getCssVariable('--square-border-width'))

    column = +e.$target.data('column');
    $els.minusColumn.css({left:`${column * size + offset + (column - 1) * border}px`})

    row = +e.$current.data('row')
    $els.minusRow.css({top: `${row * size + offset + (row - 1) * border}px`})

    toggleMinuses('show')
  }

  const attachEventHandlers = () => {
    $els.trows.on('mouseover', rowMouseOverHandler)

    $els.table_buttons.on('mouseleave', e => {
      const $targetName = e.$target.name()
      const $relatedName = e.$related?.name()
      if ( ($targetName === 'table' && $relatedName !== 'button') ||
        ($targetName === 'button' && $relatedName !== 'table') ) {
        toggleMinuses()
      }
    })

    $els.plusColumn.on('click', () => {
      $els.trows.each($tr => {
        const $td = Dom.create('td', {'data-column': $tr.countChildren() + 1})
        $tr.append($td)
      })
    })

    $els.plusRow.on('click', () => {
      const $tr = Dom.create('tr', {'data-row': $els.tbody.countChildren() + 1})
      $tr.on('mouseover', rowMouseOverHandler)
      $els.trows.children().each($td => {
        $tr.append($td.clone())
      })
      $els.tbody.append($tr)
      $els.trows = $els.tbody.find('tr')
    })

    $els.minusRow.on('click', () => {
      if ($els.tbody.countChildren() === 1) return
      $els.trows.remove(row-1)
      $els.trows = $els.tbody.find('tr').each(
        ($tr, index) => $tr.setAttr('data-row', index + 1)
      )
      toggleMinuses()
    })

    $els.minusColumn.on('click', () => {
      if ($els.trows.countChildren() === 1) return
      $els.trows.each(
        $tr => {
          $tr.children().remove(column-1).each(($td, index) => {
            $td.setAttr('data-column', index + 1)
          })
        }
      )
      toggleMinuses()
    })

  }

  const init = (rootSelector) => {
    root = $(rootSelector)

    if (root.length()) {
      setEls()
      attachEventHandlers()
    }
  }

  return init

}(document));
