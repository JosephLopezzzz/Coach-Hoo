import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Pressable, KeyboardAvoidingView, Platform, Image,
  Animated, Keyboard, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMeals } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { FOODS_DB, RECIPES_DB, RESTAURANT_DB, calculateItemMacros } from '../../services/api';

// ─── Mascot Image Map (root-level high-res for header) ───────────────────────
const MASCOT_IMAGES = {
  idle:    require('../../assets/idle.png'),
  worry:   require('../../assets/worry.png'),
  sleeppp: require('../../assets/sleeppp.png'),
  streak:  require('../../assets/streak.png'),
  flex:    require('../../assets/flex.png'),
};

// ─── Small avatars for chat bubbles ──────────────────────────────────────────
const MASCOT_AVATARS = {
  idle:    require('../../assets/mascot/idle.png'),
  worry:   require('../../assets/mascot/worry.png'),
  sleeppp: require('../../assets/mascot/sleeppp.png'),
  streak:  require('../../assets/mascot/streak.png'),
  flex:    require('../../assets/mascot/flex.png'),
};

type MascotState = keyof typeof MASCOT_IMAGES;

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: Date;
  mascotState?: MascotState;
}

const QUICK_SUGGESTIONS = [
  'Log 150g grilled chicken breast',
  'Log 200g of rice for lunch',
  'I ate 200g chicken thigh with 30g bones',
  'How are my macros today?',
  'Give me some tips!',
];

export default function ChatScreen() {
  const { logMeal, totals, targets, remaining } = useMeals();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Cluck cluck! Hello ${user?.full_name?.split(' ')[0] ?? 'there'}! I'm Coach Hoo, your personal macro-tracking chicken mascot! 🐔\n\nTell me what you ate (e.g. "I ate 150g of roasted chicken") and I'll parse it and log it for you. You can even specify bones, like "chicken thigh with 20g bones"!`,
      timestamp: new Date(),
      mascotState: 'idle',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [mascotStatusText, setMascotStatusText] = useState('Feeling motivated!');
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ─── Mascot State Animation ────────────────────────────────────────────────
  const changeMascotState = (newState: MascotState, statusMsg: string) => {
    setMascotStatusText(statusMsg);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setMascotState(newState);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();
    });
  };

  // ─── Sleepy State Trigger ──────────────────────────────────────────────────
  useEffect(() => {
    // Check if it's late night (after 10 PM)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      changeMascotState('sleeppp', 'Getting sleepy... Zzz');
    }
  }, []);

  // ─── Offline NLP Parser ───────────────────────────────────────────────────
  const parseChatMessage = (text: string) => {
    const clean = text.toLowerCase().trim();
    
    // Check if user is asking for weight info
    if (clean.includes('weight') || clean.includes('weigh') || clean.includes('heavy') || clean.includes('lbs') || clean.includes('kg')) {
      return { type: 'weight_query' };
    }

    // Check if user is asking for profile/height/age/goals
    if (clean.includes('profile') || clean.includes('height') || clean.includes('age') || clean.includes('gender') || clean.includes('sex') || clean.includes('country') || clean.includes('goal') || clean.includes('about me')) {
      return { type: 'profile_query' };
    }

    // Check what did I eat/logged meals
    if (clean.includes('what did i eat') || clean.includes('logged') || clean.includes('history') || clean.includes('meals') || clean.includes('what i ate')) {
      return { type: 'meals_query' };
    }

    // Check greetings
    if (clean.match(/\b(hello|hi|hey|greetings|morning|afternoon|evening|yo|whats up|howdy|sup)\b/)) {
      return { type: 'greeting' };
    }

    // Check if user is asking for macros report
    if (clean.includes('macro') || clean.includes('calories') || clean.includes('status') || clean.includes('report') || clean.includes('today') || clean.includes('progress') || clean.includes('remaining') || clean.includes('how am i doing')) {
      return { type: 'report' };
    }

    // Check if user is asking for tips
    if (clean.includes('tip') || clean.includes('help') || clean.includes('advice') || clean.includes('suggest') || clean.includes('recommend')) {
      return { type: 'general_chat' };
    }

    // Grams extraction
    const gramMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|grams)\b/);
    if (!gramMatch) {
      // Check if they mentioned a food keyword but forgot weight in grams
      const foodKeywords = [
        'pork', 'beef', 'chicken', 'rice', 'egg', 'tofu', 'fish', 'tilapia', 'shrimp', 'squid',
        'adobo', 'sinigang', 'tinola', 'kare-kare', 'food', 'eat', 'ate', 'meal', 'lunch', 'breakfast',
        'dinner', 'snack', 'milk', 'juice', 'soda', 'coke', 'coffee', 'tea', 'drink', 'beverage',
        'shake', 'water', 'broccoli', 'spinach', 'kangkong', 'cabbage', 'potato', 'vegetable',
        'banana', 'apple', 'mango', 'avocado', 'orange', 'calamansi', 'fruit'
      ];
      for (const kw of foodKeywords) {
        if (clean.includes(kw)) {
          return { type: 'missing_grams', foodKeyword: kw };
        }
      }
      return { type: 'out_of_domain' };
    }
    const quantity_g = parseFloat(gramMatch[1]);

    // Bone weight extraction
    let bone_weight_g: number | undefined = undefined;
    const boneMatch = clean.match(/(?:with)?\s*(\d+(?:\.\d+)?)\s*(?:g|grams)?\s*bones?\b/) ||
                      clean.match(/(\d+(?:\.\d+)?)\s*(?:g|grams)?\s*of\s*bones?\b/);
    if (boneMatch) {
      bone_weight_g = parseFloat(boneMatch[1]);
    }

    // Cooking method extraction
    let cooking_method = 'raw';
    const methods = ['boiled', 'steamed', 'grilled', 'baked', 'fried', 'deep-fried', 'deep fried', 'sauteed', 'stewed', 'roasted'];
    for (const m of methods) {
      if (clean.includes(m)) {
        cooking_method = m.replace(' ', '_');
        break;
      }
    }

    // Meal type extraction
    let meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) meal_type = 'breakfast';
    else if (hour >= 11 && hour < 15) meal_type = 'lunch';
    else if (hour >= 17 && hour < 21) meal_type = 'dinner';

    if (clean.includes('breakfast')) meal_type = 'breakfast';
    else if (clean.includes('lunch')) meal_type = 'lunch';
    else if (clean.includes('dinner')) meal_type = 'dinner';
    else if (clean.includes('snack')) meal_type = 'snack';

    // Food Match
    let matchedItem: { type: 'food' | 'recipe' | 'restaurant' | 'manual'; id?: string; name: string } | null = null;

    // Check fast food
    for (const rt of RESTAURANT_DB) {
      if (clean.includes(rt.name.toLowerCase()) || (clean.includes(rt.restaurant_name.toLowerCase()) && clean.includes(rt.name.split(' ').slice(1).join(' ').toLowerCase()))) {
        matchedItem = { type: 'restaurant', id: rt.id, name: rt.name };
        break;
      }
    }

    // Check recipes
    if (!matchedItem) {
      for (const r of RECIPES_DB) {
        if (clean.includes(r.name.toLowerCase())) {
          matchedItem = { type: 'recipe', id: r.id, name: r.name };
          break;
        }
      }
    }

    // Check raw foods
    if (!matchedItem) {
      for (const f of FOODS_DB) {
        const short = f.name.toLowerCase().replace(/\(.*?\)/g, '').replace('cooked', '').replace('raw', '').trim();
        if (clean.includes(short)) {
          matchedItem = { type: 'food', id: f.id, name: f.name };
          break;
        }
      }
    }

    // Fallback to manual food type keyword
    if (!matchedItem) {
      let foodType = 'chicken';
      const foodKeywords = [
        'pork', 'beef', 'chicken', 'rice', 'egg', 'tofu', 'fish', 'tilapia', 'shrimp', 'squid',
        'adobo', 'sinigang', 'tinola', 'kare-kare', 'milk', 'juice', 'soda', 'coke', 'coffee', 'tea',
        'drink', 'beverage', 'shake', 'water', 'broccoli', 'spinach', 'kangkong', 'cabbage', 'potato',
        'vegetable', 'banana', 'apple', 'mango', 'avocado', 'orange', 'calamansi', 'fruit'
      ];
      for (const kw of foodKeywords) {
        if (clean.includes(kw)) {
          foodType = kw;
          break;
        }
      }
      matchedItem = { type: 'manual', name: foodType };
    }

    return {
      type: 'log',
      matchedItem,
      quantity_g,
      bone_weight_g,
      cooking_method,
      meal_type,
    };
  };

  // ─── Send Message Handler ──────────────────────────────────────────────────
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Process Response
    setTimeout(async () => {
      const parsed = parseChatMessage(textToSend);
      let coachResponseText = '';
      let nextMascot: MascotState = 'idle';
      let nextStatus = 'Feeling motivated!';

      // Check for late night sleepiness override first
      const hour = new Date().getHours();
      const isLate = hour >= 22 || hour < 5;

      if (!parsed || parsed.type === 'out_of_domain') {
        coachResponseText = `Cluck? Coach Hoo is here to help with your fitness journey! 🐔✨\n\nI can help you log foods, track your weight, display macro targets, or view today's progress.\n\nTry asking me:\n- "What is my weight?"\n- "How are my macros today?"\n- "Log 150g grilled chicken breast"\n- "Show my profile details"`;
        nextMascot = isLate ? 'sleeppp' : 'worry';
        nextStatus = isLate ? 'Getting sleepy... Zzz' : 'Ready to help!';
      } else if (parsed.type === 'greeting') {
        const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        coachResponseText = `Cluck cluck! Good ${timeOfDay}, ${user?.full_name?.split(' ')[0] ?? 'friend'}! 🐔✨\n\nCoach Hoo is feeling motivated and ready to help you track your progress. Let me know what you'd like to check or log today!`;
        nextMascot = isLate ? 'sleeppp' : 'idle';
        nextStatus = isLate ? 'Yawning...' : 'Happy clucking!';
      } else if (parsed.type === 'weight_query') {
        if (user?.weight_kg) {
          coachResponseText = `Cluck! According to my records, your current weight is **${user.weight_kg} kg** (approx. ${Math.round(user.weight_kg * 2.20462)} lbs). 🐔⚖️\n\nYour goal is to **${user.goal || 'maintain'}** weight. Keep up the amazing effort!`;
          nextMascot = isLate ? 'sleeppp' : 'idle';
          nextStatus = 'Monitoring weight progress!';
        } else {
          coachResponseText = `Cluck! I don't see a weight recorded in your profile yet. You can set your weight in the Profile tab! 🐔`;
          nextMascot = isLate ? 'sleeppp' : 'worry';
          nextStatus = 'A bit worried...';
        }
      } else if (parsed.type === 'profile_query') {
        coachResponseText = `Bawk! Here is what Coach Hoo knows about your profile: 🐔\n\n👤 **Name**: ${user?.full_name ?? 'Not set'}\n🎂 **Age**: ${user?.age ?? 'Not set'} years old\n📏 **Height**: ${user?.height_cm ?? 'Not set'} cm\n⚖️ **Weight**: ${user?.weight_kg ?? 'Not set'} kg\n🎯 **Goal**: ${user?.goal === 'lose' ? 'Lose weight' : user?.goal === 'gain' ? 'Gain weight' : user?.goal === 'maintain' ? 'Maintain weight' : 'Not set'}\n🌍 **Country**: ${user?.country ?? 'Not set'}\n\nNeed to make changes? Head over to the Profile tab! ✨`;
        nextMascot = isLate ? 'sleeppp' : 'idle';
        nextStatus = 'Reviewing profile!';
      } else if (parsed.type === 'meals_query') {
        if (!meals || meals.length === 0) {
          coachResponseText = `Cluck! You haven't logged any meals today yet. 🐔\n\nTell me what you ate (e.g., "Log 150g grilled chicken breast") and I'll list it here!`;
          nextMascot = isLate ? 'sleeppp' : 'idle';
          nextStatus = 'Waiting for meal logs!';
        } else {
          let mealList = `Bawk! Here are your logged meals for today: 🐔🍗\n\n`;
          meals.forEach((m) => {
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            mealList += `🍳 **${m.meal_type.toUpperCase()}** (at ${time}):\n`;
            m.items.forEach((item) => {
              mealList += `- ${item.food_name || 'Item'} (${item.quantity_g}g${item.with_bones ? `, minus ${item.bone_weight_g}g bones` : ''})\n`;
            });
            mealList += `\n`;
          });
          coachResponseText = mealList.trim();
          nextMascot = isLate ? 'sleeppp' : 'streak';
          nextStatus = 'Reviewing today\'s menu!';
        }
      } else if (parsed.type === 'missing_grams') {
        coachResponseText = `Cluck? Coach Hoo noticed you mentioned **${(parsed as any).foodKeyword}**, but I didn't see the quantity in grams! 🥺\n\nCould you specify the weight in grams? For example:\n- "Log 150g ${(parsed as any).foodKeyword}"\n- "I ate 200g of ${(parsed as any).foodKeyword} for lunch"`;
        nextMascot = isLate ? 'sleeppp' : 'worry';
        nextStatus = 'Waiting for weight in grams...';
      } else if (parsed.type === 'report') {
        const calTarget = targets?.calories_target ?? 2000;
        const pTarget = targets?.protein_target ?? 150;
        const cTarget = targets?.carbs_target ?? 200;
        const fTarget = targets?.fat_target ?? 65;

        coachResponseText = `Here is your Daily Macro Report, cluck! 🐔\n\n🔥 **Calories**: ${Math.round(totals.calories)} / ${calTarget} kcal (Remaining: ${Math.round(remaining?.calories ?? 0)} kcal)\n🍗 **Protein**: ${Math.round(totals.protein)}g / ${pTarget}g\n🌾 **Carbs**: ${Math.round(totals.carbs)}g / ${cTarget}g\n🥑 **Fat**: ${Math.round(totals.fat)}g / ${fTarget}g\n\n${totals.protein >= pTarget ? 'Bawk bawk! You hit your protein goal! Coach Hoo is flexing! 🐔💪' : 'Peck at that protein! You still need ' + Math.round(Math.max(0, pTarget - totals.protein)) + 'g more!'}`;
        nextMascot = totals.protein >= pTarget ? 'flex' : (isLate ? 'sleeppp' : 'idle');
        nextStatus = totals.protein >= pTarget ? 'Flexing those feathers!' : (isLate ? 'Sleepy bawk...' : 'Keeping watch on macros!');
      } else if (parsed.type === 'general_chat') {
        coachResponseText = `Cluck cluck! Coach Hoo is here! 🐔\n\n💡 **Hoo\'s Fitness Tips**:\n1. Hit your protein targets (aim for 2.0g per kg of body weight).\n2. If you weigh food with bones, type "with 20g bones" to subtract bone weight!\n3. Cooked methods change macros: fried food has added fats compared to boiled.\n\nTry telling me: "Log 150g boiled chicken breast for dinner"!`;
        nextMascot = isLate ? 'sleeppp' : 'idle';
        nextStatus = isLate ? 'Yawning...' : 'Feeling helpful!';
      } else if (parsed.type === 'log' && parsed.matchedItem) {
        try {
          const itemToLog: any = {
            type: parsed.matchedItem.type,
            id: parsed.matchedItem.id || 'manual',
            quantity_g: parsed.quantity_g,
            cooking_method: parsed.cooking_method,
            method: parsed.cooking_method,
            food_type: parsed.matchedItem.type === 'manual' ? parsed.matchedItem.name : undefined,
            with_bones: parsed.bone_weight_g !== undefined,
            bone_weight_g: parsed.bone_weight_g,
          };

          // Log via context
          await logMeal(parsed.meal_type, [itemToLog]);
          
          // Calculate item's individual macros for display
          const itemMacros = await calculateItemMacros(itemToLog);

          coachResponseText = `Bawk! Successfully logged for your **${parsed.meal_type}**! 🐔🎉\n\n🍗 **${parsed.matchedItem.name}** (${parsed.quantity_g}g${parsed.bone_weight_g ? ` with ${parsed.bone_weight_g}g bones` : ''})\n\n🔥 **Calories**: ${Math.round(itemMacros.calories)} kcal\n💪 **Protein**: ${Math.round(itemMacros.protein)}g\n🌾 **Carbs**: ${Math.round(itemMacros.carbs)}g\n🥑 **Fat**: ${Math.round(itemMacros.fat)}g\n\n${itemMacros.protein > 20 ? 'Cock-a-doodle-doo! Amazing protein source! Coach Hoo is flexing! 🐔💪' : 'Logged! Keep checking your macros!'}`;
          nextMascot = itemMacros.protein > 20 ? 'flex' : (isLate ? 'sleeppp' : 'streak');
          nextStatus = itemMacros.protein > 20 ? 'Feelin the pump!' : (isLate ? 'Bedtime cluck...' : 'Log streak ongoing!');
        } catch (err: any) {
          coachResponseText = `Cluck... I failed to log that item. Error: ${err.message || 'Unknown'}. Try entering it manually in the Log Meal screen!`;
          nextMascot = 'worry';
          nextStatus = 'Worried cluck...';
        }
      }

      const coachMsg: Message = {
        id: Math.random().toString(),
        sender: 'coach',
        text: coachResponseText,
        timestamp: new Date(),
        mascotState: nextMascot,
      };

      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
      changeMascotState(nextMascot, nextStatus);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCoach = item.sender === 'coach';
    return (
      <View style={[styles.msgWrapper, isCoach ? styles.msgCoachWrapper : styles.msgUserWrapper]}>
        {isCoach && (
          <View style={styles.coachAvatarCircle}>
            <Image
              source={MASCOT_AVATARS[item.mascotState ?? 'idle']}
              style={styles.coachAvatar}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={[styles.msgBubble, isCoach ? styles.msgBubbleCoach : styles.msgBubbleUser]}>
          <Text style={[styles.msgText, isCoach ? styles.msgTextCoach : styles.msgTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, isCoach ? styles.msgTimeCoach : styles.msgTimeUser]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Mascot Header View */}
      <View style={styles.header}>
        <Animated.View style={[styles.mascotFrame, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={MASCOT_IMAGES[mascotState]}
            style={styles.mascotImg}
            resizeMode="contain"
          />
        </Animated.View>
        <View style={styles.headerInfo}>
          <Text style={styles.coachTitle}>Coach Hoo 🐔</Text>
          <View style={styles.statusBubble}>
            <View style={[styles.statusDot, { backgroundColor: mascotState === 'worry' ? Colors.error : mascotState === 'sleeppp' ? Colors.textMuted : Colors.success }]} />
            <Text style={styles.statusText}>{mascotStatusText}</Text>
          </View>
        </View>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.coachAvatarCircle}>
                <Image source={MASCOT_AVATARS[mascotState]} style={styles.coachAvatar} resizeMode="contain" />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>Coach Hoo is writing...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestions scroll */}
      <View style={styles.suggestionsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          {QUICK_SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              style={styles.suggestionChip}
              onPress={() => setInputText(s)}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Message Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Chat or type what you ate to log..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline={false}
          onSubmitEditing={() => handleSend(inputText)}
        />
        <Pressable
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: Spacing.md,
  },
  mascotFrame: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  mascotImg: {
    width: '90%',
    height: '90%',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  coachTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chatList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    maxWidth: '85%',
  },
  msgCoachWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgUserWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  coachAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coachAvatar: {
    width: '100%',
    height: '100%',
  },
  msgBubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 4,
  },
  msgBubbleCoach: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgBubbleUser: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 2,
  },
  msgText: {
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  msgTextCoach: {
    color: Colors.textPrimary,
  },
  msgTextUser: {
    color: Colors.textInverse,
  },
  msgTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  msgTimeCoach: {
    color: Colors.textMuted,
  },
  msgTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderTopLeftRadius: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  suggestionsWrapper: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
