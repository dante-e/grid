export const DOMHelper = {
  EXPANDER_TARGET_ATTRIBUTE: 'data-target-id',
  TABLE_SHRINKED_CLASSNAME: 'shrinked',
  JSON_GRID_CONTAINER_CLASSNAME: 'json-grid-container',
  JSON_GRID_ELEMENT_CONTAINER_CLASSNAME: 'json-grid-element-container',

  /**
   * @param {string} type
   * @param {string} [valueType]
   * @param {string|string[]} [additionalClasses]
   * @param {string} [id]
   */
  createElement(type, valueType, additionalClasses, id) {
    const element = document.createElement(type);
    const classes = Array.isArray(additionalClasses)
      ? [...additionalClasses]
      : additionalClasses ? [additionalClasses] : [];
    if (valueType) classes.push(valueType);
    if (classes.length) element.classList.add(...classes);
    if (id) element.id = id;
    return element;
  },

  createExpander(title, count, target, isObject) {
    const brackets = isObject ? ['{ ', ' }'] : ['[ ', ' ]'];
    const expander = document.createElement('span');
    expander.classList.add('expander');
    const sign = DOMHelper.getExpanderSign(target);
    expander.innerHTML =
      `<span class="expander-toggle">[${sign}]</span> ` +
      `<span class="expander-title">${title}</span> ` +
      `<span class="expander-count">${brackets[0]}${count}${brackets[1]}</span>`;
    expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, target.id);
    expander.addEventListener('click', DOMHelper.onExpanderClick);
    return expander;
  },

  onExpanderClick(event) {
    const expander = event.target.closest('.expander');
    if (!expander) return;
    const tableId = expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    if (!tableId) return;
    const tableEl = document.getElementById(tableId);
    if (!tableEl) return;
    tableEl.classList.toggle(DOMHelper.TABLE_SHRINKED_CLASSNAME);
    const toggleEl = expander.querySelector('.expander-toggle');
    if (toggleEl) toggleEl.textContent = `[${DOMHelper.getExpanderSign(tableEl)}]`;
  },

  getExpanderSign(target) {
    return target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME) ? '+' : '-';
  },
};
