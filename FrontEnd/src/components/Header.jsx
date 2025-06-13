import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { getGlobalStyles } from '../styles/styles';

export default function Header() {
  const { theme } = useContext(ThemeContext);
  const styles = getGlobalStyles(theme);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>OndeFica</Text>
    </View>
  );
}