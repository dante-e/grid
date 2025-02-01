export const DOMHelper = {
  EXPANDER_TARGET_ATTRIBUTE: 'data-target-id',
  TABLE_SHRINKED_CLASSNAME: 'shrinked',
  JSON_GRID_CONTAINER_CLASSNAME: 'json-grid-container',
  JSON_GRID_ELEMENT_CONTAINER_CLASSNAME: 'json-grid-element-container',

  createElement: (type, valueType, additionalClasses = [], id) => {
    const element = document.createElement(type);
    const classes = Array.isArray(additionalClasses) ? additionalClasses : [additionalClasses];
    if (valueType) classes.push(valueType);
    element.classList.add(...classes);
    if (id) element.id = id;
    return element;
  },

  createExpander: (title, count, target, isObject) => {
    const countBrackets = isObject ? '{}' : '[]';
    const expander = DOMHelper.createElement('span', 'expander');
    expander.textContent =
      `[${DOMHelper.getExpanderSign(target)}] ${title} ` +
      `${countBrackets[0]}${count}${countBrackets[1]}`;
    expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, target.id);
    expander.onclick = DOMHelper.onExpanderClick;
    return expander;
  },

  onExpanderClick: (event) => {
    const tableId = event.target.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    const target = document.getElementById(tableId);
    if (target) {
      target.classList.toggle(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      event.target.textContent =
        `[${DOMHelper.getExpanderSign(target)}]` +
        event.target.textContent.slice(3);
    }
  },

  getExpanderSign: (target) => {
    return target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME) ? '+' : '-';
  },
};
