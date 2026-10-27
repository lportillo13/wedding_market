import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { colors } from '../theme/tokens';

export function PasswordField({ language, style, ...props }: TextInputProps & { language: 'en' | 'es' }) {
  const [visible, setVisible] = useState(false);
  const label = language === 'es' ? (visible ? 'Ocultar contraseña' : 'Mostrar contraseña') : (visible ? 'Hide password' : 'Show password');
  return <View style={{ position: 'relative' }}>
    <TextInput {...props} secureTextEntry={!visible} style={[style, { paddingRight: 84 }]} />
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: visible }} onPress={() => setVisible(value => !value)} style={{ position: 'absolute', right: 4, top: 4, bottom: 4, minHeight: 44, minWidth: 72, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 13, color: colors.ink }}>{language === 'es' ? (visible ? 'Ocultar' : 'Mostrar') : (visible ? 'Hide' : 'Show')}</Text>
    </TouchableOpacity>
  </View>;
}
