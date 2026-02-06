import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/colors';

const types = ['All', 'Expense', 'Income'];
const categories = ['All', 'school friends', 'college friends', 'religion', 'personal', 'miscellaneous'];
const ranges = [
  { label: 'All', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];
const months = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

export default function FilterBar({
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filterRange,
  setFilterRange,
}) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filterType !== 'all' ||
    filterCategory !== 'All' ||
    filterMonth !== '0' ||
    filterYear !== currentYear.toString() ||
    filterRange !== 'all';

  function clearFilters() {
    setFilterType('all');
    setFilterCategory('All');
    setFilterMonth('0');
    setFilterYear(currentYear.toString());
    setFilterRange('all');
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.toggleButton, open && styles.toggleButtonActive]}
        onPress={() => setOpen(!open)}
      >
        <Text style={[styles.toggleText, open && { color: Colors.light.primaryForeground }]}>
          {open ? 'Hide Filters' : 'Show Filters'}
        </Text>
        {hasActiveFilters && (
          <View style={styles.activeDot} />
        )}
      </TouchableOpacity>
      {open && (
        <View style={styles.filtersContainer}>
          {/* Type */}
          <Text style={styles.groupLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {types.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.button, filterType === t.toLowerCase() && styles.buttonActive]}
                onPress={() => setFilterType(t.toLowerCase())}
              >
                <Text style={[styles.text, filterType === t.toLowerCase() && styles.textActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Category */}
          <Text style={styles.groupLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.button, filterCategory === c && styles.buttonActive]}
                onPress={() => setFilterCategory(c)}
              >
                <Text style={[styles.text, filterCategory === c && styles.textActive]}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Range */}
          <Text style={styles.groupLabel}>Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {ranges.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.button, filterRange === r.value && styles.buttonActive]}
                onPress={() => setFilterRange(r.value)}
              >
                <Text style={[styles.text, filterRange === r.value && styles.textActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Month */}
          <Text style={styles.groupLabel}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {months.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[styles.button, filterMonth === i.toString() && styles.buttonActive]}
                onPress={() => setFilterMonth(i.toString())}
              >
                <Text style={[styles.text, filterMonth === i.toString() && styles.textActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Year */}
          <Text style={styles.groupLabel}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {years.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.button, filterYear === y && styles.buttonActive]}
                onPress={() => setFilterYear(y)}
              >
                <Text style={[styles.text, filterYear === y && styles.textActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 16, 
    backgroundColor: Colors.light.card, 
    borderRadius: 12, 
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    backgroundColor: Colors.light.muted, 
    borderRadius: 10, 
    marginBottom: 8,
  },
  toggleButtonActive: { 
    backgroundColor: Colors.light.primary,
  },
  toggleText: { 
    color: Colors.light.foreground, 
    fontWeight: '600', 
    fontSize: 14,
  },
  activeDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: Colors.light.primary, 
    marginLeft: 8,
  },
  filtersContainer: { 
    paddingTop: 8,
  },
  groupLabel: { 
    color: Colors.light.foreground, 
    fontWeight: '600', 
    fontSize: 13, 
    marginVertical: 8, 
    marginLeft: 4,
  },
  groupScroll: { 
    marginBottom: 10,
  },
  button: { 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: Colors.light.muted, 
    borderColor: Colors.light.border, 
    borderWidth: 1, 
    marginRight: 8, 
    marginBottom: 4,
  },
  buttonActive: { 
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  text: { 
    color: Colors.light.foreground, 
    fontSize: 13,
    fontWeight: '500',
  },
  textActive: { 
    color: Colors.light.primaryForeground, 
    fontWeight: '600',
  },
  clearButton: { 
    backgroundColor: Colors.light.destructive, 
    padding: 10, 
    borderRadius: 10, 
    alignSelf: 'center', 
    marginTop: 12,
  },
  clearText: { 
    color: Colors.light.primaryForeground, 
    fontWeight: '700', 
    fontSize: 13,
  },
});