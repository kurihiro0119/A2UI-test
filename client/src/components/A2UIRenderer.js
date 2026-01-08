import React, { useState } from 'react';
import './A2UIRenderer.css';

function A2UIRenderer({ surface, data: initialData, onAction }) {
  const [data, setData] = useState(initialData || {});

  const handleInputChange = (binding, value) => {
    const keys = binding.split('.');
    setData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const getValue = (binding) => {
    const keys = binding.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return '';
    }
    return value;
  };

  const renderComponent = (component) => {
    switch (component.type) {
      case 'text':
        return (
          <div 
            key={component.id} 
            className="a2ui-text"
            style={component.style}
          >
            {component.text}
          </div>
        );

      case 'input':
        const value = getValue(component.binding);
        return (
          <div key={component.id} className="a2ui-input-group">
            <label className="a2ui-label">
              {component.label}
              {component.required && <span className="required">*</span>}
            </label>
            <input
              type={component.inputType || 'text'}
              value={value}
              onChange={(e) => handleInputChange(component.binding, e.target.value)}
              placeholder={component.placeholder}
              min={component.min}
              max={component.max}
              required={component.required}
              className="a2ui-input"
            />
          </div>
        );

      case 'button':
        return (
          <button
            key={component.id}
            className="a2ui-button"
            style={component.style}
            onClick={() => onAction(component.action, data)}
          >
            {component.text}
          </button>
        );

      default:
        return (
          <div key={component.id} className="a2ui-unknown">
            不明なコンポーネントタイプ: {component.type}
          </div>
        );
    }
  };

  if (!surface || !surface.components) {
    return <div className="a2ui-error">無効なA2UIメッセージです</div>;
  }

  return (
    <div className="a2ui-renderer">
      {surface.components.map(component => renderComponent(component))}
    </div>
  );
}

export default A2UIRenderer;

