import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { SelectItem, SelectGroup } from '../services/coachMessageService';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface SearchableSelectListProps {
  groups: SelectGroup[];
  metaOptions: readonly SelectItem[];
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  otherKey: string;
  otherValue: string;
  onOtherChange: (text: string) => void;
  noneKey: string;
  preferNotKey: string;
  searchPlaceholder: string;
  safetyMessage: string;
  allItemsKey?: string;
}

function toggleKey(keys: string[], key: string, noneKey: string, preferNotKey: string): string[] {
  if (key === noneKey || key === preferNotKey) {
    return [key];
  }
  const hasNone = keys.includes(noneKey);
  const hasPrefer = keys.includes(preferNotKey);
  let base = keys;
  if (hasNone) base = base.filter((k) => k !== noneKey);
  if (hasPrefer) base = base.filter((k) => k !== preferNotKey);
  if (base.includes(key)) {
    return base.filter((k) => k !== key);
  }
  return [...base, key];
}

export default function SearchableSelectList({
  groups,
  metaOptions,
  selectedKeys,
  onSelectionChange,
  otherKey,
  otherValue,
  onOtherChange,
  noneKey,
  preferNotKey,
  searchPlaceholder,
  safetyMessage,
}: SearchableSelectListProps) {
  const [search, setSearch] = useState('');

  const allItems = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    for (const g of groups) {
      for (const item of g.items) {
        items.push(item);
      }
    }
    return items;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const metaMatches = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return metaOptions.some((m) => m.label.toLowerCase().includes(q));
  }, [search, metaOptions]);

  const showSafety = selectedKeys.length > 0 &&
    !selectedKeys.includes(noneKey) &&
    !selectedKeys.includes(preferNotKey);

  const anyChecked = selectedKeys.length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder={searchPlaceholder}
        placeholderTextColor={Colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={searchPlaceholder}
      />

      {filteredGroups.map((group) => (
        <View key={group.category} style={styles.group}>
          <Text style={styles.categoryLabel}>{group.category}</Text>
          {group.items.map((item) => {
            const sel = selectedKeys.includes(item.key);
            return (
              <Pressable
                key={item.key}
                style={[styles.row, sel && styles.rowActive]}
                onPress={() => onSelectionChange(toggleKey(selectedKeys, item.key, noneKey, preferNotKey))}
                accessibilityLabel={`${item.label}${sel ? ', selected' : ', not selected'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
              >
                <View style={[styles.checkbox, sel && styles.checkboxActive]}>
                  {sel && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.rowText, sel && styles.rowTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {metaMatches && (
        <View style={styles.group}>
          <Text style={styles.categoryLabel}>Options</Text>
          {metaOptions.map((opt) => {
            const sel = selectedKeys.includes(opt.key);
            return (
              <Pressable
                key={opt.key}
                style={[styles.row, sel && styles.rowActive]}
                onPress={() => onSelectionChange(toggleKey(selectedKeys, opt.key, noneKey, preferNotKey))}
                accessibilityLabel={`${opt.label}${sel ? ', selected' : ', not selected'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
              >
                <View style={[styles.checkbox, sel && styles.checkboxActive]}>
                  {sel && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.rowText, sel && styles.rowTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {selectedKeys.includes(otherKey) && (
        <TextInput
          style={styles.otherInput}
          placeholder="Please specify"
          placeholderTextColor={Colors.textMuted}
          value={otherValue}
          onChangeText={onOtherChange}
          accessibilityLabel="Other, please specify"
        />
      )}

      {showSafety && (
        <View style={styles.safetyBox}>
          <Text style={styles.safetyText}>{safetyMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  group: { gap: 2 },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    gap: 12,
  },
  rowActive: { backgroundColor: Colors.primaryGlow },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkMark: { color: Colors.textInverse, fontSize: 14, fontWeight: FontWeight.bold },
  rowText: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  rowTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  otherInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  safetyBox: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F0D78A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  safetyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
