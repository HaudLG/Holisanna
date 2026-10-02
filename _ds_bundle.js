/* @ds-bundle: {"format":4,"namespace":"HolisannaDesignSystem_0df725","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"StatCard","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"f8ef2045e2e1","components/core/Button.jsx":"0ef6666ab443","components/core/Card.jsx":"5d9e03df54e0","components/forms/Input.jsx":"5d12b0f47c87"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HolisannaDesignSystem_0df725 = window.HolisannaDesignSystem_0df725 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-sans)',
  fontSize: '11px',
  fontWeight: 'var(--fw-medium)',
  letterSpacing: 'var(--ls-tight)',
  padding: '5px 12px',
  borderRadius: 'var(--radius-sm)'
};
const kinds = {
  confirmed: {
    background: 'var(--olive-bg)',
    color: 'var(--olive)',
    icon: '✓'
  },
  cancelled: {
    background: '#FBEAE7',
    color: 'var(--error)',
    icon: '✕'
  },
  founder: {
    background: 'var(--gold-bg)',
    color: 'var(--gold)',
    border: '0.5px solid var(--gold)',
    fontSize: '9px',
    padding: '3px 8px',
    letterSpacing: '0.08em',
    icon: '★'
  },
  recommended: {
    background: 'var(--olive-bg)',
    color: 'var(--olive)',
    fontSize: '10px',
    padding: '3px 10px',
    icon: '✓'
  },
  count: {
    background: 'var(--rose)',
    color: '#fff',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '10px'
  }
};
function Badge({
  kind = 'confirmed',
  children
}) {
  const {
    icon,
    ...style
  } = kinds[kind];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      ...style
    }
  }, kind !== 'count' && icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const base = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--fs-button)',
  fontWeight: 'var(--fw-medium)',
  letterSpacing: 'var(--ls-button)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
  transition: 'background 0.2s, border-color 0.2s, color 0.2s'
};
const variants = {
  primary: {
    background: 'var(--slate)',
    color: 'var(--ivory)',
    padding: '13px 28px'
  },
  cta: {
    background: 'var(--rose)',
    color: '#fff',
    padding: '13px 28px'
  },
  outline: {
    background: 'transparent',
    color: 'var(--slate)',
    border: '0.5px solid var(--border)',
    padding: '12px 24px'
  },
  'outline-on-dark': {
    background: 'transparent',
    color: 'var(--ivory)',
    border: '0.5px solid rgba(250,246,238,0.3)',
    padding: '12px 26px'
  }
};
function Button({
  variant = 'primary',
  disabled = false,
  children,
  onClick
}) {
  const style = {
    ...base,
    ...variants[variant],
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'default' : 'pointer'
  };
  return /*#__PURE__*/React.createElement("button", {
    style: style,
    disabled: disabled,
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-width) solid var(--border-default)',
      padding: 'var(--card-padding)',
      width: '260px'
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-card-title)',
      color: 'var(--slate)',
      marginBottom: '6px'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--slate-md)',
      fontWeight: 'var(--fw-light)',
      lineHeight: 'var(--lh-body)'
    }
  }, children));
}
function StatCard({
  number,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-width) solid var(--border-default)',
      padding: '18px',
      width: '140px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '28px',
      color: 'var(--olive)'
    }
  }, number), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      color: 'var(--slate-lt)',
      letterSpacing: '0.04em',
      marginTop: '2px'
    }
  }, label));
}
Object.assign(__ds_scope, { Card, StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  type = 'text',
  placeholder,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    style: {
      height: 'var(--input-height)',
      border: 'var(--border-width) solid var(--border-default)',
      padding: '0 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      color: 'var(--slate)',
      background: '#fff',
      width: '260px',
      borderRadius: 'var(--radius-md)'
    }
  });
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Input = __ds_scope.Input;

})();
