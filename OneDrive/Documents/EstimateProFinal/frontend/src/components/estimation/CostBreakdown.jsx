import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calculator, 
  TrendingUp, 
  DollarSign,
  Percent
} from "lucide-react";

const CostBreakdown = ({ 
  costBreakdown, 
  setCostBreakdown, 
  totalCost, 
  contingency, 
  setContingency, 
  finalCost 
}) => {
  const [activeCategory, setActiveCategory] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const addCategory = () => {
    const categoryCount = costBreakdown.length + 1;
    const defaultNames = ['Labor', 'Materials', 'Equipment', 'Overhead', 'Services', 'Other'];
    const defaultName = categoryCount <= defaultNames.length 
      ? defaultNames[categoryCount - 1] 
      : `Category ${categoryCount}`;
    
    const newCategory = {
      id: Date.now(),
      category: defaultName,
      items: []
    };
    setCostBreakdown([...costBreakdown, newCategory]);
    setActiveCategory(newCategory.id);
  };

  // Auto-create first category if none exist
  useEffect(() => {
    if (costBreakdown.length === 0 && activeCategory === null) {
      const categoryCount = costBreakdown.length + 1;
      const defaultNames = ['Labor', 'Materials', 'Equipment', 'Overhead', 'Services', 'Other'];
      const defaultName = categoryCount <= defaultNames.length 
        ? defaultNames[categoryCount - 1] 
        : `Category ${categoryCount}`;
      
      const newCategory = {
        id: Date.now(),
        category: defaultName,
        items: []
      };
      setCostBreakdown([newCategory]);
      setActiveCategory(newCategory.id);
    }
  }, []); // Empty dependency array - run only once

  const deleteCategory = (categoryId) => {
    if (costBreakdown.length > 1) {
      setCostBreakdown(costBreakdown.filter(cat => cat.id !== categoryId));
      if (activeCategory === categoryId) {
        setActiveCategory(costBreakdown[0].id);
      }
    }
  };

  const updateCategory = (categoryId, field, value) => {
    setCostBreakdown(costBreakdown.map(cat => 
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    ));
  };

  const addItem = (categoryId) => {
    const newItem = {
      id: Date.now(),
      name: 'New Item',
      quantity: 1,
      unitCost: 0,
      total: 0
    };
    
    setCostBreakdown(costBreakdown.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));
  };

  const updateItem = (categoryId, itemId, field, value) => {
    setCostBreakdown(costBreakdown.map(cat => {
      if (cat.id === categoryId) {
        const updatedItems = cat.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, [field]: value };
            
            // Calculate total based on item type
            if (item.hours !== undefined) {
              // Labor item
              updatedItem.total = (updatedItem.hours || 0) * (updatedItem.rate || 0);
            } else if (item.quantity !== undefined) {
              // Material item
              updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitCost || 0);
            } else if (item.months !== undefined) {
              // Overhead item
              updatedItem.total = (updatedItem.months || 0) * (updatedItem.monthlyCost || 0);
            }
            
            return updatedItem;
          }
          return item;
        });
        return { ...cat, items: updatedItems };
      }
      return cat;
    }));
  };

  const deleteItem = (categoryId, itemId) => {
    setCostBreakdown(costBreakdown.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      }
      return cat;
    }));
  };

  const getCategoryTotal = (category) => {
    return category.items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const activeCategoryData = activeCategory ? costBreakdown.find(cat => cat.id === activeCategory) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Categories</CardTitle>
                <Button size="sm" onClick={addCategory}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {costBreakdown.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent ${
                      activeCategory === category.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <div className="flex-1">
                      <div 
                        className="font-medium hover:bg-gray-100 px-1 rounded cursor-text"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          value={category.category}
                          onChange={(e) => updateCategory(category.id, 'category', e.target.value)}
                          className="border-none bg-transparent p-0 h-auto font-medium focus-visible:ring-0"
                          placeholder="Category name"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(getCategoryTotal(category))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{category.items.length}</Badge>
                      {costBreakdown.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-2">
          {activeCategoryData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={activeCategoryData.category}
                        onChange={(e) => updateCategory(activeCategoryData.id, 'category', e.target.value)}
                        className="text-lg font-semibold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 px-1 py-0 h-auto focus-visible:ring-0 transition-colors"
                        placeholder="Enter category name"
                      />
                    </div>
                    <CardDescription>
                      {formatCurrency(getCategoryTotal(activeCategoryData))} total
                    </CardDescription>
                  </div>
                  <Button onClick={() => addItem(activeCategoryData.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeCategoryData.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add items to this category to calculate costs
                    </p>
                    <Button onClick={() => addItem(activeCategoryData.id)}>
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCategoryData.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(activeCategoryData.id, item.id, 'name', e.target.value)}
                              placeholder="Enter item name"
                            />
                          </div>
                          
                          {/* Labor fields */}
                          {item.hours !== undefined && (
                            <>
                              <div>
                                <Label>Hours</Label>
                                <Input
                                  type="number"
                                  value={item.hours}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'hours', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label>Rate ($/hr)</Label>
                                <Input
                                  type="number"
                                  value={item.rate}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'rate', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                            </>
                          )}
                          
                          {/* Material fields */}
                          {item.quantity !== undefined && (
                            <>
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label>Unit Cost ($)</Label>
                                <Input
                                  type="number"
                                  value={item.unitCost}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                            </>
                          )}
                          
                          {/* Overhead fields */}
                          {item.months !== undefined && (
                            <>
                              <div>
                                <Label>Duration (months)</Label>
                                <Input
                                  type="number"
                                  value={item.months}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'months', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label>Monthly Cost ($)</Label>
                                <Input
                                  type="number"
                                  value={item.monthlyCost}
                                  onChange={(e) => updateItem(activeCategoryData.id, item.id, 'monthlyCost', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(activeCategoryData.id, item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Base Cost</Label>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contingency</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={contingency}
                  onChange={(e) => setContingency(parseFloat(e.target.value) || 0)}
                  className="w-20"
                  min="0"
                  max="100"
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(totalCost * contingency / 100)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Final Cost</Label>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(finalCost)}</div>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Category Breakdown</h4>
            <div className="space-y-2">
              {costBreakdown.map((category) => {
                const categoryTotal = getCategoryTotal(category);
                const percentage = totalCost > 0 ? (categoryTotal / totalCost) * 100 : 0;
                
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <span className="text-sm">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(categoryTotal)}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostBreakdown;
