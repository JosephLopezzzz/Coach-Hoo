import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, ActivityIndicator, ScrollView, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { foodsApi, recipesApi, recommendApi } from '../../services/api';
import FoodCard from '../../components/FoodCard';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { Food, Recipe, RestaurantFood } from '../../types';
import { useAuth } from '../../context/AuthContext';

type TabKey = 'foods' | 'restaurant';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'foods',      label: 'Foods & Recipes', icon: 'nutrition-outline' },
  { key: 'restaurant', label: 'Fast Food',       icon: 'fast-food-outline' },
];

export default function SearchScreen() {
  const { user, dailyTargets, dailyTotals } = useAuth();
  const [query,       setQuery]       = useState('');
  const [activeTab,   setActiveTab]   = useState<TabKey>('foods');
  const [foods,       setFoods]       = useState<any[]>([]);
  const [restaurant,  setRestaurant]  = useState<RestaurantFood[]>([]);
  const [loading,     setLoading]     = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRestaurant, setNewItemRestaurant] = useState('');
  const [newItemCals, setNewItemCals] = useState('');
  const [newItemProtein, setNewItemProtein] = useState('');
  const [newItemCarbs, setNewItemCarbs] = useState('');
  const [newItemFat, setNewItemFat] = useState('');

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      if (activeTab === 'foods') {
        if (!q.trim()) {
           // Default: Recommendations + Custom Foods
           const rem = dailyTargets ? Math.max(0, dailyTargets.calories_target - (dailyTotals?.calories || 0)) : 500;
           const alg = user?.allergies || [];
           const custom = await foodsApi.listCustomFoods();
           const recs = await recommendApi.meals(undefined, 10, rem, alg);
           setFoods([...custom.data, ...recs.data]);
        } else {
           const { data: f } = await foodsApi.search(q);
           const { data: r } = await recipesApi.search(q);
           setFoods([...f.results, ...r.recipes]);
        }
      } else {
        const { data } = await recommendApi.restaurant(q || undefined);
        setRestaurant(data.items);
      }
    } catch (err) {
      console.error('[Search]', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dailyTargets, dailyTotals, user?.allergies]);

  const clearResults = () => { setFoods([]); setRestaurant([]); };

  // Load defaults on tab change
  useEffect(() => {
    search('');
    setQuery('');
  }, [activeTab]);

  const handleScanMenu = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to scan menus.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled) {
      Alert.alert(
        'Simulated OCR',
        'In a production app with a backend server, we would run AI OCR here to extract calories from the image. For now, please input the macros manually!',
        [
          { text: 'OK', onPress: () => {
              setNewItemName('');
              setNewItemRestaurant('Scanned Menu Item');
              setModalVisible(true);
          }}
        ]
      );
    }
  };

  const handleSaveCustomItem = async () => {
    if (!newItemName) return Alert.alert('Error', 'Name is required');
    
    if (activeTab === 'restaurant') {
      await recommendApi.createFastFood({
        name: newItemName,
        restaurant_name: newItemRestaurant || 'Custom Fast Food',
        calories: parseFloat(newItemCals) || 0,
        protein: parseFloat(newItemProtein) || 0,
        carbs: parseFloat(newItemCarbs) || 0,
        fat: parseFloat(newItemFat) || 0,
        serving_size_g: 100,
        country: user?.country || 'PH'
      });
    } else {
      await foodsApi.create({
        name: newItemName,
        category: 'custom',
        calories_per_100g: parseFloat(newItemCals) || 0,
        protein_per_100g: parseFloat(newItemProtein) || 0,
        carbs_per_100g: parseFloat(newItemCarbs) || 0,
        fat_per_100g: parseFloat(newItemFat) || 0,
        is_raw: false,
        source: 'User'
      });
    }
    setModalVisible(false);
    setNewItemName(''); setNewItemRestaurant(''); setNewItemCals(''); setNewItemProtein(''); setNewItemCarbs(''); setNewItemFat('');
    search(query);
  };

  const handleDelete = async (id: string, isFastFood: boolean) => {
    if (isFastFood) {
      await recommendApi.deleteCustomFastFood(id);
    } else {
      await foodsApi.deleteCustomFood(id);
    }
    search(query);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'foods') {
      const isRecipe = !!item.meal_types;
      const isCustom = item.id.startsWith('f_user_');
      return (
        <View style={styles.cardWrapper}>
          <FoodCard
            item={{ source: isRecipe ? 'recipe' : 'food', data: item }}
            onAdd={() => console.log('Add', item.id)}
          />
          {isCustom && (
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, false)}>
              <Ionicons name="trash" size={16} color={Colors.error} />
              <Text style={styles.deleteBtnText}>Delete Custom Food</Text>
            </Pressable>
          )}
        </View>
      );
    }
    
    // Fast Food
    const isCustomFF = item.id.startsWith('ff_user_');
    return (
      <View style={styles.cardWrapper}>
        <FoodCard
          item={{ source: 'restaurant', data: item }}
          onAdd={() => console.log('Add restaurant', item.id)}
        />
        {isCustomFF && (
          <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, true)}>
            <Ionicons name="trash" size={16} color={Colors.error} />
            <Text style={styles.deleteBtnText}>Delete Fast Food</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const dataArr = activeTab === 'foods' ? foods : restaurant;

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
            <Pressable onPress={() => { setQuery(''); clearResults(); search(''); }} hitSlop={8}>
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

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {activeTab === 'restaurant' ? (
          <>
            <Pressable style={styles.actionBtn} onPress={handleScanMenu}>
              <Ionicons name="camera-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Scan Menu</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => { setNewItemRestaurant(''); setModalVisible(true); }}>
              <Ionicons name="add-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Add Manually</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.actionBtn, { flex: 1 }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Add Custom Food</Text>
          </Pressable>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} size="large" />
      ) : dataArr.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="fast-food-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            {activeTab === 'restaurant' ? 'No custom fast foods yet.' : 'No results found.'}
          </Text>
          {activeTab === 'restaurant' && (
             <Text style={[styles.emptyText, { textAlign: 'center', fontSize: FontSize.sm, marginTop: Spacing.sm }]}>
               Tap 'Scan Menu' or 'Add Manually' to store your favorite fast food macros for easy logging!
             </Text>
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

      {/* Add Custom Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {activeTab === 'restaurant' ? 'Fast Food' : 'Custom Food'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 1pc Chickenjoy" placeholderTextColor={Colors.textMuted} value={newItemName} onChangeText={setNewItemName} />
              
              {activeTab === 'restaurant' && (
                <>
                  <Text style={styles.inputLabel}>Restaurant</Text>
                  <TextInput style={styles.modalInput} placeholder="e.g. Jollibee" placeholderTextColor={Colors.textMuted} value={newItemRestaurant} onChangeText={setNewItemRestaurant} />
                </>
              )}

              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} value={newItemCals} onChangeText={setNewItemCals} />

              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} value={newItemProtein} onChangeText={setNewItemProtein} />

              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} value={newItemCarbs} onChangeText={setNewItemCarbs} />

              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} value={newItemFat} onChangeText={setNewItemFat} />

              <View style={styles.modalBtnRow}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSaveBtn} onPress={handleSaveCustomItem}>
                  <Text style={styles.modalSaveText}>Save Item</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  
  actionRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryGlow, paddingVertical: 10, borderRadius: Radius.md, gap: 6, borderWidth: 1, borderColor: Colors.primary },
  actionBtnText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },

  cardWrapper: { marginBottom: Spacing.md },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: -8, paddingRight: Spacing.md, gap: 4 },
  deleteBtnText: { color: Colors.error, fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  loader: { marginTop: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  list: { padding: Spacing.lg },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  modalScroll: { gap: Spacing.sm },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 4 },
  modalInput: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  modalCancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgElevated },
  modalCancelText: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  modalSaveBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  modalSaveText: { color: Colors.textInverse, fontWeight: FontWeight.bold },
});
