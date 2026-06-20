import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, ActivityIndicator, ScrollView, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { foodsApi, recipesApi, recommendApi, RECIPES_DB } from '../../services/api';
import FoodCard from '../../components/FoodCard';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { Food, Recipe, RestaurantFood } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useMeals } from '../../context/MealContext';

type TabKey = 'foods' | 'restaurant';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'foods',      label: 'Foods & Recipes', icon: 'nutrition-outline' },
  { key: 'restaurant', label: 'Fast Food',       icon: 'fast-food-outline' },
];

export default function SearchScreen() {
  const { user } = useAuth();
  const { logMeal, remaining, targets, meals } = useMeals();
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

  // Details Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemSource, setSelectedItemSource] = useState<'food' | 'recipe' | 'restaurant' | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const remCals = remaining?.calories ? Math.max(0, remaining.calories) : (targets?.calories_target ?? 500);
      const loggedMealTypes = meals?.map(m => m.meal_type) || [];
      const hasBreakfast = loggedMealTypes.includes('breakfast');
      const hasLunch = loggedMealTypes.includes('lunch');
      const hasDinner = loggedMealTypes.includes('dinner');

      let remainingMealsToEat = 0;
      if (!hasBreakfast) remainingMealsToEat++;
      if (!hasLunch) remainingMealsToEat++;
      if (!hasDinner) remainingMealsToEat++;
      
      if (remainingMealsToEat === 0) {
          remainingMealsToEat = 1;
      }
      const caloriesPerRemainingMeal = remCals / remainingMealsToEat;

      if (activeTab === 'foods') {
        if (!q.trim()) {
           // Default: Recommendations + Custom Foods
           const alg = user?.allergies || [];
           const custom = await foodsApi.listCustomFoods();
           const recs = await recommendApi.meals(undefined, 10, caloriesPerRemainingMeal, alg);
           setFoods([...custom.data, ...recs.data]);
        } else {
           const { data: f } = await foodsApi.search(q);
           const { data: r } = await recipesApi.search(q);
           
           // Scale searched recipes to caloriesPerRemainingMeal to maintain consistency
           const scaledRecipes = r.recipes.map((recipe: any) => {
             const portion_g = caloriesPerRemainingMeal > 0 ? (caloriesPerRemainingMeal / recipe.macros_per_100g.calories) * 100 : 100;
             const factor = portion_g / 100;
             return {
               ...recipe,
               macros_per_portion: {
                 portion_g,
                 calories: recipe.macros_per_100g.calories * factor,
                 protein: recipe.macros_per_100g.protein * factor,
                 carbs: recipe.macros_per_100g.carbs * factor,
                 fat: recipe.macros_per_100g.fat * factor,
               }
             };
           });

           setFoods([...f.results, ...scaledRecipes]);
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
  }, [activeTab, targets, remaining, meals, user?.allergies]);

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

  const handleAddPress = (item: any) => {
    const isRecipe = !!item.meal_types;
    const isRestaurant = !!item.restaurant_name;
    const type = isRecipe ? 'recipe' : isRestaurant ? 'restaurant' : 'food';

    const defaultQty = item.macros_per_portion?.portion_g ?? item.serving_size_g ?? 100;

    Alert.alert(
      'Log Meal',
      `Select meal type to log "${item.name}":`,
      [
        { text: 'Breakfast', onPress: () => performLog(item, type, defaultQty, 'breakfast') },
        { text: 'Lunch', onPress: () => performLog(item, type, defaultQty, 'lunch') },
        { text: 'Dinner', onPress: () => performLog(item, type, defaultQty, 'dinner') },
        { text: 'Snack', onPress: () => performLog(item, type, defaultQty, 'snack') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const performLog = async (item: any, type: string, quantity_g: number, mealType: string) => {
    try {
      await logMeal(mealType, [{
        type: type as any,
        id: item.id,
        quantity_g,
        cooking_method: 'raw',
        with_bones: false
      }]);
      Alert.alert('Logged! 🎉', `${item.name} (${Math.round(quantity_g)}g) has been added to your ${mealType}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log meal');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'foods') {
      const isRecipe = !!item.meal_types;
      const isCustom = item.id.startsWith('f_user_');
      return (
        <View style={styles.cardWrapper}>
          <FoodCard
            item={{ source: isRecipe ? 'recipe' : 'food', data: item }}
            onPress={() => {
              setSelectedItem(item);
              setSelectedItemSource(isRecipe ? 'recipe' : 'food');
              setDetailModalVisible(true);
            }}
            onAdd={() => handleAddPress(item)}
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
          onPress={() => {
            setSelectedItem(item);
            setSelectedItemSource('restaurant');
            setDetailModalVisible(true);
          }}
          onAdd={() => handleAddPress(item)}
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

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  
                  {/* Category / Source info */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type / Source</Text>
                    <Text style={styles.detailValue}>
                      {selectedItemSource === 'recipe' ? `🇵🇭 Recipe (${selectedItem.country})` : selectedItemSource === 'restaurant' ? `🍔 Fast Food (${selectedItem.restaurant_name})` : `🍎 Food (${selectedItem.category || 'general'})`}
                    </Text>
                  </View>

                  {/* Macros Summary */}
                  <View style={styles.detailMacrosContainer}>
                    <Text style={styles.detailSecTitle}>Macros Breakdown</Text>
                    
                    {(() => {
                      const macros = selectedItem.macros_per_portion ?? selectedItem.macros_per_100g ?? {
                        calories: selectedItem.calories_per_100g ?? selectedItem.calories ?? 0,
                        protein: selectedItem.protein_per_100g ?? selectedItem.protein ?? 0,
                        carbs: selectedItem.carbs_per_100g ?? selectedItem.carbs ?? 0,
                        fat: selectedItem.fat_per_100g ?? selectedItem.fat ?? 0
                      };
                      const portionG = selectedItem.macros_per_portion?.portion_g ?? selectedItem.serving_size_g ?? 100;
                      
                      return (
                        <>
                          <Text style={styles.portionText}>Serving size: {Math.round(portionG)}g</Text>
                          <View style={styles.detailMacrosGrid}>
                            <View style={[styles.detailMacroCard, { backgroundColor: Colors.primaryGlow }]}>
                              <Text style={[styles.detailMacroVal, { color: Colors.calories }]}>{Math.round(macros.calories)}</Text>
                              <Text style={styles.detailMacroLabel}>kcal</Text>
                            </View>
                            <View style={[styles.detailMacroCard, { backgroundColor: Colors.protein + '20' }]}>
                              <Text style={[styles.detailMacroVal, { color: Colors.protein }]}>{Math.round(macros.protein)}g</Text>
                              <Text style={styles.detailMacroLabel}>Protein</Text>
                            </View>
                            <View style={[styles.detailMacroCard, { backgroundColor: Colors.carbs + '20' }]}>
                              <Text style={[styles.detailMacroVal, { color: Colors.carbs }]}>{Math.round(macros.carbs)}g</Text>
                              <Text style={styles.detailMacroLabel}>Carbs</Text>
                            </View>
                            <View style={[styles.detailMacroCard, { backgroundColor: Colors.fat + '20' }]}>
                              <Text style={[styles.detailMacroVal, { color: Colors.fat }]}>{Math.round(macros.fat)}g</Text>
                              <Text style={styles.detailMacroLabel}>Fat</Text>
                            </View>
                          </View>
                        </>
                      );
                    })()}
                  </View>

                  {/* Recipe Ingredients */}
                  {selectedItemSource === 'recipe' && (() => {
                    const recipe = RECIPES_DB.find(r => r.id === selectedItem.id);
                    if (recipe && recipe.ingredients) {
                      const portion_g = selectedItem.macros_per_portion?.portion_g ?? recipe.total_weight_g;
                      const factor = portion_g / recipe.total_weight_g;
                      const scaled = recipe.ingredients.map(ing => ({
                        name: ing.name,
                        qty_g: ing.base_qty_g * factor
                      }));

                      return (
                        <View style={styles.ingredientsSection}>
                          <Text style={styles.detailSecTitle}>Ingredients ({Math.round(portion_g)}g portion):</Text>
                          <View style={styles.ingredientsContainer}>
                            {scaled.map((ing, idx) => (
                              <View key={idx} style={styles.ingredientRow}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.ingredientText}>
                                  <Text style={styles.ingredientQty}>{Math.round(ing.qty_g)}g</Text> {ing.name}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  <View style={styles.modalBtnRow}>
                    <Pressable style={styles.modalCancelBtn} onPress={() => setDetailModalVisible(false)}>
                      <Text style={styles.modalCancelText}>Close</Text>
                    </Pressable>
                    <Pressable style={styles.modalSaveBtn} onPress={() => { setDetailModalVisible(false); handleAddPress(selectedItem); }}>
                      <Text style={styles.modalSaveText}>Log this item</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            )}
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

  // Details Modal Specific Styles
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  detailMacrosContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  detailSecTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  detailMacrosGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  detailMacroCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMacroVal: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  detailMacroLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ingredientsSection: {
    marginTop: Spacing.md,
  },
  ingredientsContainer: {
    backgroundColor: Colors.bgElevated + '30',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: 6,
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  ingredientText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  ingredientQty: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
