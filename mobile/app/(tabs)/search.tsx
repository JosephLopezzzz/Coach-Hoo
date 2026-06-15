import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { foodsApi, recipesApi, recommendApi } from '../../services/api';
import FoodCard from '../../components/FoodCard';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { Food, Recipe, RestaurantFood } from '../../types';

type TabKey = 'foods' | 'recipes' | 'restaurant';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'foods',      label: 'Foods',      icon: 'nutrition-outline' },
  { key: 'recipes',    label: 'Recipes 🇵🇭', icon: 'restaurant-outline' },
  { key: 'restaurant', label: 'Fast Food',   icon: 'fast-food-outline' },
];

export default function SearchScreen() {
  const [query,       setQuery]       = useState('');
  const [activeTab,   setActiveTab]   = useState<TabKey>('foods');
  const [foods,       setFoods]       = useState<Food[]>([]);
  const [recipes,     setRecipes]     = useState<Recipe[]>([]);
  const [restaurant,  setRestaurant]  = useState<RestaurantFood[]>([]);
  const [loading,     setLoading]     = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() && activeTab !== 'restaurant') { clearResults(); return; }
    setLoading(true);
    try {
      if (activeTab === 'foods') {
        const { data } = await foodsApi.search(q);
        setFoods(data.results);
      } else if (activeTab === 'recipes') {
        const { data } = await recipesApi.search(q);
        setRecipes(data.recipes);
      } else {
        const { data } = await recommendApi.restaurant(q || undefined);
        setRestaurant(data.items);
      }
    } catch (err) {
      console.error('[Search]', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const clearResults = () => { setFoods([]); setRecipes([]); setRestaurant([]); };

  // Load defaults on tab change
  React.useEffect(() => {
    if (activeTab === 'restaurant') search('');
    else clearResults();
    setQuery('');
  }, [activeTab]);

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'foods') {
      return (
        <FoodCard
          item={{ source: 'food', data: item as Food }}
          onAdd={() => console.log('Add food', item.id)}
        />
      );
    }
    if (activeTab === 'recipes') {
      return (
        <FoodCard
          item={{ source: 'recipe', data: item as Recipe }}
          onAdd={() => console.log('Add recipe', item.id)}
        />
      );
    }
    return (
      <FoodCard
        item={{ source: 'restaurant', data: item as RestaurantFood }}
        onAdd={() => console.log('Add restaurant', item.id)}
      />
    );
  };

  const dataArr = activeTab === 'foods' ? foods : activeTab === 'recipes' ? recipes : restaurant;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Food</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={(q) => { setQuery(q); search(q); }}
            returnKeyType="search"
            onSubmitEditing={() => search(query)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); clearResults(); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} size="large" />
      ) : dataArr.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            {query ? 'No results found' : 'Start typing to search'}
          </Text>
          {activeTab === 'recipes' && !query && (
            <Pressable style={styles.loadRecipesBtn} onPress={() => search('adobo')}>
              <Text style={styles.loadRecipesText}>Browse Filipino Recipes</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={dataArr}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: 8,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  tabScroll: { flexGrow: 0 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginRight: 8,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  loader: { marginTop: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  list: { padding: Spacing.lg },
  loadRecipesBtn: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  loadRecipesText: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
