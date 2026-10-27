"use client";

import { useState, type ComponentProps } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();
  return <div className="wm-password-input">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button type="button" aria-controls={props.id} aria-pressed={visible} onClick={() => setVisible(current => !current)}>
      {language === 'es' ? (visible ? 'Ocultar' : 'Mostrar') : (visible ? 'Hide' : 'Show')}
    </button>
  </div>;
}
